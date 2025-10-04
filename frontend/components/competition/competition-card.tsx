// frontend/components/competition/competition-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Competition, CompetitionStatus } from '@/types/competition';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBAKCoins, cn } from '@/lib/utils';
import { Trophy, Users, Clock, Calendar, Award } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CompetitionCardProps {
  competition: Competition;
  showEnterButton?: boolean;
}

export function CompetitionCard({ competition, showEnterButton = true }: CompetitionCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<CompetitionStatus>(competition.status);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      let targetDate: Date;
      let prefix: string;

      switch (competition.status) {
        case CompetitionStatus.UPCOMING:
          targetDate = new Date(competition.startDate);
          prefix = 'Starts in';
          break;
        case CompetitionStatus.ACTIVE:
          targetDate = new Date(competition.endDate);
          prefix = 'Ends in';
          break;
        case CompetitionStatus.VOTING:
          targetDate = new Date(competition.votingEnd);
          prefix = 'Voting ends in';
          break;
        default:
          return;
      }

      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Competition phase has ended, we should update status
        // In a real app, this would trigger a status update via API
        setStatus(CompetitionStatus.COMPLETED);
        setTimeLeft('Completed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${prefix} ${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${prefix} ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${prefix} ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [competition]);

  const getStatusVariant = (status: CompetitionStatus) => {
    switch (status) {
      case CompetitionStatus.UPCOMING:
        return 'secondary';
      case CompetitionStatus.ACTIVE:
        return 'primary';
      case CompetitionStatus.VOTING:
        return 'accent';
      case CompetitionStatus.COMPLETED:
        return 'default';
      case CompetitionStatus.CANCELLED:
        return 'danger';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: CompetitionStatus) => {
    switch (status) {
      case CompetitionStatus.UPCOMING:
        return 'text-blue-400';
      case CompetitionStatus.ACTIVE:
        return 'text-green-400';
      case CompetitionStatus.VOTING:
        return 'text-purple-400';
      case CompetitionStatus.COMPLETED:
        return 'text-gray-400';
      case CompetitionStatus.CANCELLED:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        variant="glass" 
        hover="lift" 
        className="h-full backdrop-blur-xl"
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <Badge variant={getStatusVariant(status)} className={cn("capitalize", getStatusColor(status))}>
              {status.toLowerCase()}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>{competition.entries.length} entries</span>
            </div>
          </div>
          
          <CardTitle className="text-xl line-clamp-2 mb-2">
            {competition.title}
          </CardTitle>
          
          <CardDescription className="line-clamp-2 text-gray-300">
            {competition.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Prize Pool */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-white">Prize Pool</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-500">
                {formatBAKCoins(competition.prizePool)}
              </div>
              <div className="text-xs text-gray-400">BAKCoins</div>
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-primary-500" />
            <span className="text-gray-300">Theme:</span>
            <span className="text-white font-medium">{competition.theme}</span>
          </div>

          {/* Timeline */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Starts</span>
              </div>
              <span className="text-white">
                {new Date(competition.startDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Ends</span>
              </div>
              <span className="text-white">
                {new Date(competition.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Countdown */}
          {timeLeft && (
            <div className="flex items-center gap-2 p-2 bg-dark-700 rounded-lg">
              <Clock className="h-4 w-4 text-primary-500" />
              <span className="text-sm text-gray-300">{timeLeft}</span>
            </div>
          )}

          {/* Scoring System */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Judges: {competition.judgeWeight}%</span>
            <span>Fans: {competition.fanWeight}%</span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/competitions/${competition.id}`}>
                View Details
              </Link>
            </Button>
            
            {showEnterButton && status === CompetitionStatus.ACTIVE && (
              <Button asChild className="flex-1">
                <Link href={`/competitions/${competition.id}/enter`}>
                  Enter Now
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
