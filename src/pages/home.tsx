import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Music, Trophy, Users, Sparkles, TrendingUp, 
  Award, Mic2, Building2, ArrowRight, Play, Star,
  Zap, Crown, Gem
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary-purple/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-emerald/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-6 py-3 glass rounded-full border border-white/10"
            >
              <Sparkles className="h-5 w-5 text-accent-gold" />
              <span className="text-sm font-medium text-white">Africa's Premier Talent Platform</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="gradient-text">Discover.</span>
              <br />
              <span className="gradient-text">Compete.</span>
              <br />
              <span className="text-white">Conquer.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Connect with Africa's next generation of musical talent. 
              Compete in global competitions. Build your legacy.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Link to="/register">
                <Button 
                  size="lg"
                  className="group relative overflow-hidden bg-gradient-to-r from-primary-purple to-secondary-emerald hover:from-purple-600 hover:to-emerald-600 text-white border-0 px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Join BAK55 Talent
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              
              <Link to="/competitions">
                <Button 
                  size="lg"
                  variant="outline"
                  className="glass border-2 border-white/20 hover:bg-white/10 text-white px-8 py-6 text-lg font-semibold"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Explore Competitions
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16"
            >
              {[
                { number: '10K+', label: 'Artists' },
                { number: '500+', label: 'Competitions' },
                { number: '$2M+', label: 'Prize Pool' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.number}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full mt-2"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Why BAK55 Talent?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The ultimate platform for discovering and nurturing African musical talent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Global Competitions',
                description: 'Compete for prizes, recognition, and career-changing opportunities',
                gradient: 'from-accent-gold/20 to-transparent'
              },
              {
                icon: Mic2,
                title: 'Artist Discovery',
                description: 'Get discovered by brands, producers, and millions of fans worldwide',
                gradient: 'from-primary-purple/20 to-transparent'
              },
              {
                icon: TrendingUp,
                title: 'Career Growth',
                description: 'Access tools, insights, and connections to accelerate your music career',
                gradient: 'from-secondary-emerald/20 to-transparent'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass p-8 h-full hover:border-white/30 transition-all duration-300 group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Showcase */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-purple/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Active Competitions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join thousands of artists competing for prizes and recognition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass overflow-hidden group cursor-pointer hover:border-primary-purple/50 transition-all duration-300">
                  <div className="aspect-video bg-gradient-to-br from-primary-purple/20 to-secondary-emerald/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Crown className="h-16 w-16 text-accent-gold/50" />
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-accent-gold/20 backdrop-blur-sm rounded-full text-xs font-bold text-accent-gold border border-accent-gold/30">
                      $5,000 Prize
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary-purple transition-colors">
                      Rising Stars {2025}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Showcase your talent to millions of listeners
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Users className="h-4 w-4" />
                        234 entries
                      </span>
                      <span className="text-primary-purple font-semibold">Ends in 5d</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/competitions">
              <Button 
                size="lg"
                variant="outline"
                className="glass border-2 border-white/20 hover:bg-white/10 text-white"
              >
                View All Competitions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Artist Discovery */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-primary-purple/30">
                  <Star className="h-4 w-4 text-primary-purple" />
                  <span className="text-sm font-medium text-primary-purple">For Artists</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold">
                  <span className="gradient-text">Your Stage.</span>
                  <br />
                  <span className="text-white">Your Story.</span>
                </h2>
                
                <p className="text-xl text-gray-400 leading-relaxed">
                  Build your profile, showcase your music, and get discovered by brands and fans. 
                  Earn from your talent and grow your career on Africa's largest music platform.
                </p>

                <ul className="space-y-4">
                  {[
                    'Compete in global competitions',
                    'Get AI-powered talent scoring',
                    'Connect with top brands',
                    'Monetize your music'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-purple/20 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary-purple" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-primary-purple to-secondary-emerald hover:from-purple-600 hover:to-emerald-600 text-white border-0">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl glass p-8 flex items-center justify-center">
                <Music className="h-48 w-48 text-primary-purple/30" />
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-purple/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-secondary-emerald/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Partnership */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="aspect-square rounded-3xl glass p-8 flex items-center justify-center">
                <Building2 className="h-48 w-48 text-secondary-emerald/30" />
              </div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary-emerald/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-accent-gold/20 rounded-full blur-3xl" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-secondary-emerald/30">
                <Gem className="h-4 w-4 text-secondary-emerald" />
                <span className="text-sm font-medium text-secondary-emerald">For Brands</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="gradient-text">Discover Talent.</span>
                <br />
                <span className="text-white">Build Impact.</span>
              </h2>
              
              <p className="text-xl text-gray-400 leading-relaxed">
                Connect with Africa's most promising artists. Launch competitions, 
                discover talent, and amplify your brand's presence in the music industry.
              </p>

              <ul className="space-y-4">
                {[
                  'Launch branded competitions',
                  'Access pre-vetted talent pool',
                  'Advanced analytics dashboard',
                  'Direct artist engagement'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-emerald/20 flex items-center justify-center">
                      <Award className="h-4 w-4 text-secondary-emerald" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-secondary-emerald to-accent-gold hover:from-emerald-600 hover:to-amber-600 text-white border-0">
                  Partner With Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-purple/10 via-transparent to-secondary-emerald/10" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto px-4 text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Ready to Make History?</span>
          </h2>
          <p className="text-2xl text-gray-300 mb-12">
            Join the movement reshaping Africa's music industry
          </p>
          <Link to="/register">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary-purple to-secondary-emerald hover:from-purple-600 hover:to-emerald-600 text-white border-0 px-12 py-8 text-xl font-bold shadow-2xl shadow-purple-500/50"
            >
              Get Started Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4 gradient-text">BAK55 Talent</h3>
              <p className="text-gray-400 text-sm">
                Africa's premier platform for discovering and nurturing musical talent.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/competitions" className="hover:text-primary-purple transition-colors">Competitions</Link></li>
                <li><Link to="/pricing" className="hover:text-primary-purple transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">About Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary-purple transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Guidelines</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-primary-purple transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-purple transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 BAK55 Talent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
