'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ranges: { value: DateRange; label: string }[] = [
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_90_days', label: 'Last 90 days' },
    { value: 'this_month', label: 'This month' },
    { value: 'last_month', label: 'Last month' },
  ];

  const currentLabel = ranges.find(r => r.value === value)?.label || 'Last 30 days';

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <CalendarIcon className="w-4 h-4" />
        {currentLabel}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1">
              {ranges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    onChange(range.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    value === range.value
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
