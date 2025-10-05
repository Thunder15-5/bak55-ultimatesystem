import { Trophy, Clock, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompetitionsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Active Competitions</span>
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl mx-auto">
            Browse and join music competitions to showcase your talent
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass rounded-2xl p-16 text-center border border-dark-600">
            <div className="w-24 h-24 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-12 w-12 text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Coming Soon</h2>
            <p className="text-dark-200 text-lg mb-8 max-w-md mx-auto">
              We're preparing an amazing competition experience. Get ready to compete and showcase your talent!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 rounded-xl glass-light">
                <Clock className="h-8 w-8 text-secondary-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Real-time</h3>
                <p className="text-dark-300 text-sm">Live voting & results</p>
              </div>
              <div className="p-6 rounded-xl glass-light">
                <Users className="h-8 w-8 text-accent-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Community</h3>
                <p className="text-dark-300 text-sm">Vote for your favorites</p>
              </div>
              <div className="p-6 rounded-xl glass-light">
                <Award className="h-8 w-8 text-primary-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-1">Rewards</h3>
                <p className="text-dark-300 text-sm">Win prizes & recognition</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
