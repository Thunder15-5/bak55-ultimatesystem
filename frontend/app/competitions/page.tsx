// frontend/app/competitions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompetitionStore } from '@/store/competition-store';
import { CompetitionCard } from '@/components/competition/competition-card';
import { CompetitionFilters } from '@/components/competition/competition-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitionStatus, CompetitionFilters as Filters } from '@/types/competition';
import { Search, Filter, Trophy, Plus, Loader } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

export default function CompetitionsPage() {
  const { competitions, fetchCompetitions, isLoading } = useCompetitionStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCompetitions(filters);
  }, [fetchCompetitions, filters]);

  const filteredCompetitions = competitions.filter(competition =>
    competition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competition.theme.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCompetitions = filteredCompetitions.filter(
    c => c.status === CompetitionStatus.ACTIVE || c.status === CompetitionStatus.VOTING
  );
  
  const upcomingCompetitions = filteredCompetitions.filter(
    c => c.status === CompetitionStatus.UPCOMING
  );
  
  const completedCompetitions = filteredCompetitions.filter(
    c => c.status === CompetitionStatus.COMPLETED
  );

  const renderCompetitionSection = (title: string, competitions: any[], emptyMessage: string) => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary-500" />
        {title}
        <span className="text-sm text-gray-400 ml-2">({competitions.length})</span>
      </h2>
      
      {competitions.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <CardContent>
            <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {competitions.map((competition, index) => (
              <motion.div
                key={competition.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <CompetitionCard competition={competition} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Music <span className="gradient-text">Competitions</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                Compete for prizes, get discovered, and showcase your talent to the world
              </p>
            </div>
            
            {user?.role === 'ADMIN' && (
              <Button asChild size="lg">
                <Link href="/competitions/create" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Competition
                </Link>
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <Card variant="glass" className="backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search competitions by title, theme, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-dark-800/50 border-dark-600"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant={showFilters ? "primary" : "outline"}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                  
                  {(searchQuery || Object.keys(filters).length > 0) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery('');
                        setFilters({});
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <CompetitionFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      className="mt-4 pt-4 border-t border-gray-700"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        )}

        {/* Competition Sections */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {renderCompetitionSection(
              'Active Competitions',
              activeCompetitions,
              'No active competitions at the moment. Check back soon!'
            )}
            
            {renderCompetitionSection(
              'Upcoming Competitions',
              upcomingCompetitions,
              'No upcoming competitions scheduled yet.'
            )}
            
            {renderCompetitionSection(
              'Completed Competitions',
              completedCompetitions,
              'No completed competitions yet.'
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
