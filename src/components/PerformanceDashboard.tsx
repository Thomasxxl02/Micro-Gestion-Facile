/**
 * Performance Dashboard — Simple Web Vitals Display
 *
 * Shows current session's Web Vitals metrics
 * Color-coded: Good (green) | Needs improvement (yellow) | Poor (red)
 */

import { Activity } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { performanceMonitor, type PerformanceMetric } from '../lib/performanceMonitor';

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState<Record<string, { value: number; rating: string }>>({});

  useEffect(() => {
    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
      setSummary(performanceMonitor.getSummary());
    }, 2000);

    // Initial update
    setMetrics(performanceMonitor.getMetrics());
    setSummary(performanceMonitor.getSummary());

    return () => clearInterval(interval);
  }, []);

  if (Object.keys(summary).length === 0) {
    return null; // Don't show if no metrics yet
  }

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'poor':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getMetricDescription = (name: string): string => {
    switch (name) {
      case 'LCP':
        return 'Largest Contentful Paint (target: < 2.5s)';
      case 'INP':
        return 'Interaction to Next Paint (target: < 200ms)';
      case 'FID':
        return 'First Input Delay (target: < 100ms)';
      case 'CLS':
        return 'Cumulative Layout Shift (target: < 0.1)';
      case 'FCP':
        return 'First Contentful Paint (target: < 1.8s)';
      case 'TTFB':
        return 'Time to First Byte (target: < 600ms)';
      default:
        return name;
    }
  };

  const formatValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${value.toFixed(0)}ms`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs z-50">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <Activity className="w-4 h-4 text-brand-600" />
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Web Vitals</h3>
      </div>

      <div className="space-y-2">
        {Object.entries(summary).map(([name, { value, rating }]) => (
          <div key={name} className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getMetricDescription(name)}
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-bold border whitespace-nowrap ${getRatingColor(
                rating,
              )}`}
            >
              {formatValue(name, value)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {metrics.length} metrics collected
        </p>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
