import { BadRequestError } from '../middleware/errors.js';

export const getCityFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const rawCity = parsedUrl.searchParams.get('city');
  if (!rawCity) {
    throw new BadRequestError('City name is required');
  }

  const trimmed = rawCity.trim();
  if (trimmed.length === 0) {
    throw new BadRequestError('City name contains invalid characters');
  }

  // Строгое правило: цифры в названии города — это однозначная ошибка.
  if (/\d/.test(trimmed)) {
    throw new BadRequestError('City name contains invalid characters');
  }

  // Разрешаем только буквы, пробелы и дефис.
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
    throw new BadRequestError('City name contains invalid characters');
  }

  const city = trimmed.toLowerCase();
  if (city.length > 50) {
    throw new BadRequestError('City name too long');
  }

  return city;
};

export const getOptionsFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const options = parsedUrl.searchParams.get('options');
  if (!options) return false;

  return options;
};
