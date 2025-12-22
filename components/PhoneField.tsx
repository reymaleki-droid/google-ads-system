'use client';

import { PhoneInput } from 'react-international-phone';

interface PhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  defaultCountry?: string;
  label?: string;
  required?: boolean;
  id?: string;
}

export default function PhoneField({
  value,
  onChange,
  defaultCountry = 'ae',
  label = 'Phone Number',
  required = true,
  id = 'phone',
}: PhoneFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <PhoneInput
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        inputProps={{
          id,
          name: id,
          required,
          className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent',
        }}
        countrySelectorStyleProps={{
          buttonClassName: 'border border-gray-300 rounded-l-lg hover:bg-gray-50',
          flagClassName: 'text-xl',
        }}
        style={{
          width: '100%',
        }}
      />
    </div>
  );
}
