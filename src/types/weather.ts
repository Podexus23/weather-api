export interface WeatherCurrent {
  temp: number;
  conditions: string;
}

export interface WeatherDay {
  datetime: string;
  temp: number;
  conditions: string;
}

export interface WeatherApiResponse {
  currentConditions: WeatherCurrent;
  days: WeatherDay[];
}

export function isWeatherData(obj: unknown): obj is WeatherApiResponse {
  if (!obj || typeof obj !== 'object') return false;

  const maybe = obj as Record<string, unknown>;

  if (!maybe.currentConditions || typeof maybe.currentConditions !== 'object') return false;
  const cc = maybe.currentConditions as Record<string, unknown>;
  if (typeof cc.temp !== 'number' || typeof cc.conditions !== 'string') return false;

  if (!Array.isArray(maybe.days)) return false;

  for (const day of maybe.days) {
    if (!day || typeof day !== 'object') return false;
    const d = day as Record<string, unknown>;
    if (typeof d.datetime !== 'string' || typeof d.temp !== 'number' || typeof d.conditions !== 'string') {
      return false;
    }
  }

  return true;
}
