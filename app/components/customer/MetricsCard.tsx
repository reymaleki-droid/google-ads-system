'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  format?: 'currency' | 'percentage' | 'number';
  icon?: React.ReactNode;
}

export function MetricsCard({ title, value, change, format = 'number', icon }: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return val.toLocaleString('en-US');
      default:
        return val.toString();
    }
  };

  const isPositiveChange = change ? change.value > 0 : null;
  const isNegativeChange = change ? change.value < 0 : null;

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        {change && (
          <div className="flex items-center mt-2 text-xs">
            {isPositiveChange && (
              <>
                <ArrowUpIcon className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">+{Math.abs(change.value)}%</span>
              </>
            )}
            {isNegativeChange && (
              <>
                <ArrowDownIcon className="w-3 h-3 text-red-600 mr-1" />
                <span className="text-red-600 font-medium">-{Math.abs(change.value)}%</span>
              </>
            )}
            {!isPositiveChange && !isNegativeChange && (
              <span className="text-gray-500 font-medium">0%</span>
            )}
            <span className="text-gray-500 ml-1">vs {change.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
