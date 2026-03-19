import { BadRequestError } from '../middleware/errors.js';

export const getCityFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const rawCity = parsedUrl.searchParams.get('city');
  if (!rawCity) {
    throw new BadRequestError('City name is required');
  }

  const city = rawCity
    .replace(/[^a-zA-Z\s-]/g, '')
    .trim()
    .toLowerCase();
  if (city.length === 0) {
    throw new BadRequestError('City name contains invalid characters');
  }
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
