// frontend/app/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Play, Trophy, Users, TrendingUp, Star, Music } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass border-b border-luxury-glass-border sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">BAK55</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Button variant="ghost" size="md">
                Discover
              </Button>
              <Button variant="ghost" size="md">
                Competitions
              </Button>
              <Button variant="outline" size="md">
                Sign In
              </Button>
              <Button variant="primary" size="md">
                Join Now
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-5xl lg:text-7xl font-bold mb-6"
            >
              <span className="gradient-text">African Music</span>
              <br />
              <span className="text-white">Reimagined</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed"
            >
              Discover, support, and invest in the next generation of African music talent. 
              Powered by AI talent scoring and real-time competitions.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button size="lg" variant="primary" className="min-w-[200px]">
                <Play className="h-5 w-5 mr-2" />
                Start Listening
              </Button>
              <Button size="lg" variant="glass" className="min-w-[200px]">
                <Trophy className="h-5 w-5 mr-2" />
                Join Competition
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-2xl mx-auto"
            >
              {[
                { value: '10K+', label: 'Artists', icon: Users },
                { value: '₵5M+', label: 'Prize Pool', icon: Trophy },
                { value: '500K+', label: 'Fans', icon: TrendingUp },
                { value: '95%', label: 'AI Accuracy', icon: Star },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.8 }}
                  className="text-center"
                >
                  <div className="glass rounded-2xl p-4 backdrop-blur-xl">
                    <stat.icon className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Why <span className="gradient-text">BAK55</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We're building the future of African music with cutting-edge technology 
              and fair economic opportunities for artists.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Talent Scoring',
                description: 'Get instant feedback on your musical talent with our advanced AI analysis system.',
                icon: Star,
                color: 'from-primary-500 to-purple-600'
              },
              {
                title: 'Real Competitions',
                description: 'Compete for real prizes and get discovered by fans and industry professionals.',
                icon: Trophy,
                color: 'from-secondary-500 to-emerald-600'
              },
              {
                title: 'Fair Economy',
                description: 'Earn BAKCoins for your talent and convert them to real money instantly.',
                icon: TrendingUp,
                color: 'from-accent-500 to-yellow-600'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card variant="glass" hover="lift" className="h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card variant="premium" glow className="text-center p-12">
              <CardHeader>
                <CardTitle className="text-4xl mb-4">
                  Ready to Launch Your Music Career?
                </CardTitle>
                <CardDescription className="text-xl text-gray-300">
                  Join thousands of African artists already building their legacy on BAK55
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                  <Input 
                    placeholder="Enter your email address"
                    variant="glass"
                    className="flex-1"
                  />
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
