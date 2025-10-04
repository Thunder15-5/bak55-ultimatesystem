// frontend/components/competition/voting-interface.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompetitionEntry } from '@/types/competition';
import { useCompetitionStore } from '@/store/competition-store';
import { useWalletStore } from '@/store/wallet-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBAKCoins, cn } from '@/lib/utils';
import { Heart, Trophy, Coins, Star, Users, AlertCircle } from 'lucide-react';
import { AudioPlayerMini } from '@/components/audio/audio-player-mini';

interface VotingInterfaceProps {
  entries: CompetitionEntry[];
  competitionId: string;
  maxVotesPerEntry?: number;
}

export function VotingInterface({ entries, competitionId, maxVotesPerEntry = 10 }: VotingInterfaceProps) {
  const { voteForEntry, userVotes } = useCompetitionStore();
  const { balance, refreshBalance } = useWalletStore();
  const [selectedEntry, setSelectedEntry] = useState<CompetitionEntry | null>(null);
  const [votesToCast, setVotesToCast] = useState<number>(1);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (entry: CompetitionEntry) => {
    if (votesToCast < 1) {
      setError('Please select at least 1 vote');
      return;
    }

    const totalCost = votesToCast;
    if (balance < totalCost) {
      setError(`Insufficient BAKCoins. You need ${formatBAKCoins(totalCost)} but have ${formatBAKCoins(balance)}`);
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      await voteForEntry(entry.id, votesToCast);
      await refreshBalance(); // Update wallet balance
      setVotesToCast(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsVoting(false);
    }
  };

  const getUserVotesForEntry = (entryId: string) => {
    return userVotes.get(entryId) || 0;
  };

  const getVoteCost = (votes: number) => {
    return votes; // 1 vote = 1 BAKCoin
  };

  const canVoteMore = (entryId: string) => {
    const currentVotes = getUserVotesForEntry(entryId);
    return currentVotes < maxVotesPerEntry;
  };

  return (
    <div className="space-y-6">
      {/* Voting Info */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Coins className="h-8 w-8 text-yellow-500 mb-2" />
              <div className="text-2xl font-bold text-white">{formatBAKCoins(balance)}</div>
              <div className="text-sm text-gray-400">Your Balance</div>
            </div>
            <div className="flex flex-col items-center">
              <Heart className="h-8 w-8 text-red-500 mb-2" />
              <div className="text-2xl font-bold text-white">
                {entries.reduce((sum, entry) => sum + getUserVotesForEntry(entry.id), 0)}
              </div>
              <div className="text-sm text-gray-400">Your Votes</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-primary-500 mb-2" />
              <div className="text-2xl font-bold text-white">{entries.length}</div>
              <div className="text-sm text-gray-400">Total Entries</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              variant="glass" 
              className={cn(
                "h-full backdrop-blur-xl transition-all",
                selectedEntry?.id === entry.id && "ring-2 ring-primary-500"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  {entry.rank && (
                    <Badge variant="primary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Rank {entry.rank}
                    </Badge>
                  )}
                </div>

                <CardTitle className="text-lg line-clamp-2 mb-2">
                  {entry.track.title}
                </CardTitle>

                <CardDescription className="line-clamp-2 text-gray-300">
                  by {entry.artist.stageName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Audio Player */}
                <AudioPlayerMini track={entry.track} />

                {/* Vote Count */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Heart className="h-4 w-4" />
                    <span>{entry.voteCount} votes</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Coins className="h-4 w-4" />
                    <span>{entry.totalTips} tipped</span>
                  </div>
                </div>

                {/* User's Votes */}
                {getUserVotesForEntry(entry.id) > 0 && (
                  <div className="bg-primary-500/20 border border-primary-500/30 rounded-lg p-2 text-center">
                    <p className="text-primary-500 text-sm font-semibold">
                      You voted {getUserVotesForEntry(entry.id)} times
                    </p>
                  </div>
                )}

                {/* Voting Controls */}
                {canVoteMore(entry.id) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Votes to cast:</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVotesToCast(Math.max(1, votesToCast - 1))}
                          disabled={votesToCast <= 1}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-semibold">{votesToCast}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVotesToCast(Math.min(maxVotesPerEntry - getUserVotesForEntry(entry.id), votesToCast + 1))}
                          disabled={votesToCast >= maxVotesPerEntry - getUserVotesForEntry(entry.id)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-400">
                      Cost: {formatBAKCoins(getVoteCost(votesToCast))}
                    </div>

                    <Button
                      onClick={() => handleVote(entry)}
                      disabled={isVoting || balance < getVoteCost(votesToCast)}
                      isLoading={isVoting}
                      className="w-full"
                      size="sm"
                    >
                      {isVoting ? 'Voting...' : 'Cast Votes'}
                    </Button>
                  </div>
                )}

                {/* Max Votes Reached */}
                {!canVoteMore(entry.id) && (
                  <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-sm">
                      You've reached the maximum votes for this entry
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Entries Message */}
      {entries.length === 0 && (
        <Card variant="glass" className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Entries Yet</h3>
            <p className="text-gray-400">
              Be the first to enter this competition and showcase your talent!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
