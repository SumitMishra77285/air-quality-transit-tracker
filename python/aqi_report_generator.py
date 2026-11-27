import csv
import json
import statistics
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CITIES = [
    {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794},
    {"name": "Amritsar", "lat": 31.6340, "lon": 74.8723},
    {"name": "New Delhi", "lat": 28.6139, "lon": 77.2090},
    {"name": "London", "lat": 51.5074, "lon": -0.1278},
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
]


def classify_us_aqi(aqi: float | None) -> str:
    if aqi is None:
        return "Unavailable"
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def fetch_city_air_quality(name: str, lat: float, lon: float) -> dict:
    params = urllib.parse.urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone",
        "hourly": "us_aqi,pm2_5",
        "forecast_days": 1,
        "timezone": "auto",
    })
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    current = data.get("current", {})
    hourly_aqi = [v for v in data.get("hourly", {}).get("us_aqi", []) if v is not None]
    hourly_times = data.get("hourly", {}).get("time", [])

    cleanest_hour = "N/A"
    if hourly_aqi and len(hourly_times) >= len(hourly_aqi):
        pairs = [
            (t, v)
            for t, v in zip(hourly_times, data["hourly"]["us_aqi"])
            if v is not None
        ]
        if pairs:
            best_time, best_val = min(pairs, key=lambda x: x[1])
            cleanest_hour = f"{best_time[11:16]} (AQI {round(best_val)})"

    us_aqi = current.get("us_aqi")
    return {
        "city": name,
        "us_aqi": us_aqi,
        "category": classify_us_aqi(us_aqi),
        "pm2_5": current.get("pm2_5"),
        "pm10": current.get("pm10"),
        "avg_24h_aqi": round(statistics.mean(hourly_aqi), 1) if hourly_aqi else None,
        "min_24h_aqi": min(hourly_aqi) if hourly_aqi else None,
        "max_24h_aqi": max(hourly_aqi) if hourly_aqi else None,
        "cleanest_commute_window": cleanest_hour,
    }


def main() -> None:
    print("Fetching live Open-Meteo Air Quality data using Python...\n")
    rows = [fetch_city_air_quality(c["name"], c["lat"], c["lon"]) for c in CITIES]

    # 1. Print summary table in terminal
    print(f"{'City':<12} {'US AQI':>7} {'24h Avg':>8} {'Category':<28} {'Cleanest Window'}")
    print("-" * 78)
    for r in rows:
        print(
            f"{r['city']:<12} {str(r['us_aqi']):>7} {str(r['avg_24h_aqi']):>8} "
            f"{r['category']:<28} {r['cleanest_commute_window']}"
        )

    # 2. Export JSON summary for the web app
    json_out = Path("public/data/python_aqi_summary.json")
    json_out.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_by": "python/aqi_report_generator.py",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "cities": rows,
    }
    json_out.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    # 3. Export CSV report
    csv_out = Path("python/aqi_report.csv")
    with csv_out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved JSON snapshot -> {json_out}")
    print(f"Saved CSV report    -> {csv_out}")


if __name__ == "__main__":
    main()