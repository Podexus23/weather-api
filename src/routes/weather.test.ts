import { describe, it, expect } from 'vitest';
import { getCityFromRequest, getOptionsFromRequest } from './weather.js';
import { BadRequestError } from '../middleware/errors.js';

const base = 'http://localhost';

describe('routes/weather', () => {
  describe('getCityFromRequest', () => {
    it('should throw when city is missing', () => {
      expect(() => getCityFromRequest('/api/weather', base)).toThrowError(BadRequestError);
    });

    it('should normalize city value to lower-case', () => {
      const city = getCityFromRequest('/api/weather?city=LoNdon', base);
      expect(city).toBe('london');
    });

    it('should reject if city contains digits', () => {
      expect(() => getCityFromRequest('/api/weather?city=LoNd0n', base)).toThrowError('invalid characters');
    });

    it('should reject if city contains invalid characters', () => {
      expect(() => getCityFromRequest('/api/weather?city=12345', base)).toThrowError('invalid characters');
    });

    it('should reject long city names', () => {
      const longCity = 'a'.repeat(51);
      expect(() => getCityFromRequest(`/api/weather?city=${longCity}`, base)).toThrowError('too long');
    });
  });

  describe('getOptionsFromRequest', () => {
    it('should return false when options are not provided', () => {
      expect(getOptionsFromRequest('/api/weather?city=london', base)).toBe(false);
    });

    it('should return provided option string', () => {
      expect(getOptionsFromRequest('/api/weather?city=london&options=html', base)).toBe('html');
      expect(getOptionsFromRequest('/api/weather?city=london&options=json', base)).toBe('json');
    });
  });
});
