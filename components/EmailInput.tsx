'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

const EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'gmx.com',
  'aol.com',
  'yandex.com',
  'mail.com',
  'fastmail.com',
  'tutanota.com',
  'tuta.com',
  'qq.com',
  '163.com',
];

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function EmailInput({ value, onChange, required }: EmailInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    const atIndex = newValue.indexOf('@');
    if (atIndex === -1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const localPart = newValue.substring(0, atIndex);
    const domainPart = newValue.substring(atIndex + 1).toLowerCase();

    // Don't suggest if domain already has a dot (custom domain)
    if (domainPart.includes('.')) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't suggest if domain is empty
    if (domainPart.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Filter domains that match the input
    const matchedDomains = EMAIL_DOMAINS.filter((domain) =>
      domain.toLowerCase().startsWith(domainPart)
    ).map((domain) => `${localPart}@${domain}`);

    setSuggestions(matchedDomains);
    setShowSuggestions(matchedDomains.length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="email"
        id="email"
        name="email"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        required={required}
        autoComplete="off"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
