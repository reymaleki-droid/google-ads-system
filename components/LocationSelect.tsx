'use client';

import { useState } from 'react';
import { getCountries, getStatesForCountry, getCitiesForState } from '@/lib/location-data';

interface LocationSelectProps {
  country: string;
  city: string;
  area: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onAreaChange: (area: string) => void;
}

export default function LocationSelect({
  country,
  city,
  area,
  onCountryChange,
  onCityChange,
  onAreaChange,
}: LocationSelectProps) {
  const countries = getCountries();
  const states = getStatesForCountry(country);
  const cities = getCitiesForState(country, city);

  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    // Reset state/city and area when country changes
    const firstState = getStatesForCountry(newCountry)[0];
    if (firstState) {
      onCityChange(firstState.code);
      const firstCity = getCitiesForState(newCountry, firstState.code)[0];
      onAreaChange(firstCity || '');
    } else {
      onCityChange('');
      onAreaChange('');
    }
  };

  const handleStateChange = (newStateCode: string) => {
    onCityChange(newStateCode);
    // Reset area when state changes
    const firstCity = getCitiesForState(country, newStateCode)[0];
    onAreaChange(firstCity || '');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
          Country *
        </label>
        <select
          id="country"
          name="country"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
          State/Emirate *
        </label>
        <select
          id="city"
          name="city"
          value={city}
          onChange={(e) => handleStateChange(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="location_area" className="block text-sm font-semibold text-gray-700 mb-2">
          City *
        </label>
        <select
          id="location_area"
          name="location_area"
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          {cities.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
