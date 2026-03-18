export const getCityFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const rawCity = parsedUrl.searchParams.get('city');
  if (!rawCity) throw Error('please add city query parameter');

  const city = rawCity
    .replace(/[^a-zA-Z\s-]/g, '')
    .trim()
    .toLowerCase();
  if (city.length === 0) throw Error('Invalid city name');
  if (city.length > 50) throw Error('City name too long');

  return city;
};

export const getOptionsFromRequest = (url: string, base: string) => {
  const parsedUrl = new URL(url, base);
  const options = parsedUrl.searchParams.get('options');
  if (!options) return false;

  return options;
};
