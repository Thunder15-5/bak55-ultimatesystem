import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Trophy, Users, Sparkles, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold gradient-text"
        >
          BAK55
        </motion.h1>
        <nav className="flex gap-3">
          <Button variant="ghost" className="text-dark-100 hover:text-white hover:bg-dark-700" asChild>
            <Link to="/competitions">Competitions</Link>
          </Button>
          <Button variant="ghost" className="text-dark-100 hover:text-white hover:bg-dark-700" asChild>
            <Link to="/pricing">Pricing</Link>
          </Button>
          <Button variant="outline" className="border-dark-600 text-dark-100 hover:bg-dark-700 hover:border-primary-500" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-16 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-5xl mx-auto space-y-10"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block"
            >
              <span className="px-4 py-2 rounded-full glass-light text-sm font-medium text-primary-400 border border-primary-500/30">
                <Sparkles className="inline h-4 w-4 mr-2" />
                AI-Powered Music Platform
              </span>
            </motion.div>
            
            <h2 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Connect Artists,</span>
              <br />
              <span className="text-white">Brands & Fans</span>
              <br />
              <span className="text-white">Through Music</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-dark-200 max-w-3xl mx-auto leading-relaxed">
              Revolutionary talent discovery platform powered by AI. Compete, collaborate, and get discovered.
            </p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Button size="lg" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white text-lg px-8 py-6 shadow-xl shadow-primary-500/30" asChild>
              <Link to="/register">
                Start Competing
                <TrendingUp className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-dark-600 text-white hover:bg-dark-700 hover:border-primary-500 text-lg px-8 py-6" asChild>
              <Link to="/competitions">
                Browse Competitions
                <Award className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-24"
          >
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              className="p-8 rounded-2xl glass border border-dark-600 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-xl bg-primary-500/20 flex items-center justify-center mb-6 mx-auto">
                <Music className="h-8 w-8 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">For Artists</h3>
              <p className="text-dark-200 leading-relaxed">
                Showcase your talent, compete in challenges, and get discovered by brands and fans worldwide
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              className="p-8 rounded-2xl glass border border-dark-600 hover:border-secondary-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-xl bg-secondary-500/20 flex items-center justify-center mb-6 mx-auto">
                <Trophy className="h-8 w-8 text-secondary-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">For Brands</h3>
              <p className="text-dark-200 leading-relaxed">
                Create campaigns, discover talent with AI matching, and engage your audience authentically
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              className="p-8 rounded-2xl glass border border-dark-600 hover:border-accent-500/50 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-xl bg-accent-500/20 flex items-center justify-center mb-6 mx-auto">
                <Users className="h-8 w-8 text-accent-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">For Fans</h3>
              <p className="text-dark-200 leading-relaxed">
                Vote for favorites, discover new music, support artists, and be part of their journey
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
