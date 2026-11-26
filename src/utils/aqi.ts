import type { AqiStandard } from '../types';

export interface AqiCategory {
  label: string;
  guidance: string;
  badgeClass: string;
  borderClass: string;
  textClass: string;
}

export function classifyAqi(value: number | null, standard: AqiStandard): AqiCategory {
  if (value === null || Number.isNaN(value)) {
    return {
      label: 'Unavailable',
      guidance: 'No current index reading available for this location.',
      badgeClass: 'bg-slate-200 text-slate-800',
      borderClass: 'border-slate-300',
      textClass: 'text-slate-700',
    };
  }

  if (standard === 'eu') {
    if (value <= 20) {
      return {
        label: 'Good',
        guidance: 'Air quality is ideal for outdoor activities.',
        badgeClass: 'bg-emerald-100 text-emerald-900',
        borderClass: 'border-emerald-300',
        textClass: 'text-emerald-800',
      };
    }
    if (value <= 40) {
      return {
        label: 'Fair',
        guidance: 'Acceptable air quality for most people.',
        badgeClass: 'bg-lime-100 text-lime-900',
        borderClass: 'border-lime-300',
        textClass: 'text-lime-800',
      };
    }
    if (value <= 60) {
      return {
        label: 'Moderate',
        guidance: 'Sensitive groups should consider reducing prolonged exertion.',
        badgeClass: 'bg-amber-100 text-amber-900',
        borderClass: 'border-amber-300',
        textClass: 'text-amber-800',
      };
    }
    if (value <= 80) {
      return {
        label: 'Poor',
        guidance: 'Limit intense outdoor exercise, especially near heavy traffic.',
        badgeClass: 'bg-orange-100 text-orange-900',
        borderClass: 'border-orange-300',
        textClass: 'text-orange-800',
      };
    }
    if (value <= 100) {
      return {
        label: 'Very Poor',
        guidance: 'Avoid strenuous outdoor activity; wear a mask if commuting.',
        badgeClass: 'bg-rose-100 text-rose-900',
        borderClass: 'border-rose-300',
        textClass: 'text-rose-800',
      };
    }
    return {
      label: 'Extremely Poor',
      guidance: 'Stay indoors with filtered air where possible.',
      badgeClass: 'bg-purple-100 text-purple-950',
      borderClass: 'border-purple-400',
      textClass: 'text-purple-900',
    };
  }

  // US EPA AQI scale (0-500)
  if (value <= 50) {
    return {
      label: 'Good',
      guidance: 'Air quality is satisfactory with little or no risk.',
      badgeClass: 'bg-emerald-100 text-emerald-900',
      borderClass: 'border-emerald-300',
      textClass: 'text-emerald-800',
    };
  }
  if (value <= 100) {
    return {
      label: 'Moderate',
      guidance: 'Unusually sensitive people should limit prolonged outdoor exertion.',
      badgeClass: 'bg-amber-100 text-amber-900',
      borderClass: 'border-amber-300',
      textClass: 'text-amber-800',
    };
  }
  if (value <= 150) {
    return {
      label: 'Unhealthy for Sensitive Groups',
      guidance: 'People with respiratory conditions, children, and older adults should reduce outdoor exertion.',
      badgeClass: 'bg-orange-100 text-orange-900',
      borderClass: 'border-orange-300',
      textClass: 'text-orange-800',
    };
  }
  if (value <= 200) {
    return {
      label: 'Unhealthy',
      guidance: 'Everyone should reduce prolonged or heavy outdoor exertion.',
      badgeClass: 'bg-rose-100 text-rose-900',
      borderClass: 'border-rose-300',
      textClass: 'text-rose-800',
    };
  }
  if (value <= 300) {
    return {
      label: 'Very Unhealthy',
      guidance: 'Avoid outdoor physical exertion; consider indoor transit waits.',
      badgeClass: 'bg-purple-100 text-purple-950',
      borderClass: 'border-purple-400',
      textClass: 'text-purple-900',
    };
  }
  return {
    label: 'Hazardous',
    guidance: 'Health alert: remain indoors and avoid outdoor travel.',
    badgeClass: 'bg-red-200 text-red-950',
    borderClass: 'border-red-500',
    textClass: 'text-red-950',
  };
}
