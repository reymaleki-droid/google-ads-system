'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface ReportColumn {
  key: string;
  label: string;
  format?: 'currency' | 'percentage' | 'number' | 'text';
  align?: 'left' | 'center' | 'right';
}

interface ReportRow {
  [key: string]: any;
  id: string;
  change?: number;
}

interface ReportTableProps {
  title: string;
  columns: ReportColumn[];
  data: ReportRow[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ReportTable({ 
  title, 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data available' 
}: ReportTableProps) {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'number':
        return Number(value).toLocaleString('en-US');
      case 'text':
      default:
        return value.toString();
    }
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  const renderChangeIndicator = (change?: number) => {
    if (change === undefined || change === null) return null;
    
    if (change > 0) {
      return (
        <span className="inline-flex items-center text-green-600 text-xs ml-2">
          <ArrowUpIcon className="w-3 h-3 mr-0.5" />
          {change.toFixed(1)}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center text-red-600 text-xs ml-2">
          <ArrowDownIcon className="w-3 h-3 mr-0.5" />
          {Math.abs(change).toFixed(1)}%
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center text-gray-500 text-xs ml-2">
          <MinusIcon className="w-3 h-3 mr-0.5" />
          0%
        </span>
      );
    }
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${getAlignClass(column.align)}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td
                        key={`${row.id}-${column.key}`}
                        className={`px-6 py-4 text-sm text-gray-900 ${getAlignClass(column.align)}`}
                      >
                        <div className="flex items-center justify-start">
                          {formatValue(row[column.key], column.format)}
                          {column.key === 'campaign_name' && renderChangeIndicator(row.change)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
