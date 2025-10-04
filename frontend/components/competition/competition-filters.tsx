// frontend/components/competition/competition-filters.tsx
'use client';

import { CompetitionStatus, CompetitionFilters as Filters } from '@/types/competition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const musicGenres = [
  'Afrobeats', 'Hip Hop', 'R&B', 'Gospel', 'Highlife',
  'Fuji', 'Juju', 'Apala', 'Reggae', 'Dancehall',
  'Amapiano', 'Bongo Flava', 'Azonto', 'Kwaito', 'Gqom'
];

const prizeRanges = [
  { label: 'Any prize', value: 0 },
  { label: '10K+ BAKCoins', value: 10000 },
  { label: '50K+ BAKCoins', value: 50000 },
  { label: '100K+ BAKCoins', value: 100000 },
  { label: '500K+ BAKCoins', value: 500000 },
];

interface CompetitionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  className?: string;
}

export function CompetitionFilters({ filters, onFiltersChange, className }: CompetitionFiltersProps) {
  const statusFilters = [
    { value: CompetitionStatus.ACTIVE, label: 'Active', color: 'bg-green-500' },
    { value: CompetitionStatus.VOTING, label: 'Voting', color: 'bg-purple-500' },
    { value: CompetitionStatus.UPCOMING, label: 'Upcoming', color: 'bg-blue-500' },
    { value: CompetitionStatus.COMPLETED, label: 'Completed', color: 'bg-gray-500' },
  ];

  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: keyof Filters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="outline" className="flex items-center gap-1">
              {key}: {value}
              <button
                onClick={() => removeFilter(key as keyof Filters)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="text-red-500 hover:text-red-400"
          >
            Clear All
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statusFilters.map((status) => (
              <button
                key={status.value}
                onClick={() => updateFilter('status', status.value)}
                className={cn(
                  'flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors',
                  filters.status === status.value
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                <div className={cn('w-3 h-3 rounded-full', status.color)} />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Genre
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {musicGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => updateFilter('genre', genre)}
                className={cn(
                  'block w-full p-2 rounded-lg text-sm text-left transition-colors',
                  filters.genre === genre
                    ? 'bg-secondary-500/20 text-secondary-500'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Prize Pool Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Minimum Prize
          </label>
          <div className="space-y-2">
            {prizeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => updateFilter('prizePoolMin', range.value)}
                className={cn(
                  'block w-full p-2 rounded-lg text-sm text-left transition-colors',
                  filters.prizePoolMin === range.value
                    ? 'bg-accent-500/20 text-accent-500'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Quick Filters
          </label>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('status', CompetitionStatus.ACTIVE)}
              className="w-full justify-start"
            >
              Enter Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('status', CompetitionStatus.VOTING)}
              className="w-full justify-start"
            >
              Vote Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onFiltersChange({
                  status: CompetitionStatus.ACTIVE,
                  prizePoolMin: 50000
                });
              }}
              className="w-full justify-start"
            >
              High Prize
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
