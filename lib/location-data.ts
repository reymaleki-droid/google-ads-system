import gccCitiesData from '@/data/gcc-cities.json';

export const GCC_LOCATION_DATA = gccCitiesData;

export type CountryCode = string;
export type StateCode = string;
export type City = string;

// Helper function to get cities for a country/state
export function getCitiesForState(countryCode: string, stateCode: string): string[] {
  const countryCities = GCC_LOCATION_DATA.citiesByCountry[countryCode as keyof typeof GCC_LOCATION_DATA.citiesByCountry];
  if (!countryCities || Array.isArray(countryCities)) {
    return [];
  }
  return (countryCities as Record<string, string[]>)[stateCode] || [];
}

// Helper function to get states for a country
export function getStatesForCountry(countryCode: string) {
  return GCC_LOCATION_DATA.statesByCountry[countryCode as keyof typeof GCC_LOCATION_DATA.statesByCountry] || [];
}

// Helper function to get all countries
export function getCountries() {
  return GCC_LOCATION_DATA.countries;
}
