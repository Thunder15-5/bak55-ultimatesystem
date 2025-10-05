import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { User, Music, MapPin, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const musicGenres = [
  'Afrobeats', 'Hip Hop', 'R&B', 'Gospel', 'Highlife',
  'Fuji', 'Juju', 'Apala', 'Reggae', 'Dancehall',
  'Amapiano', 'Bongo Flava', 'Azonto', 'Kwaito', 'Gqom'
];

export function RegistrationSteps() {
  const {
    registrationStep,
    registrationData,
    setRegistrationStep,
    updateRegistrationData,
    register,
    isLoading
  } = useAuthStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!registrationData.role) {
        newErrors.role = 'Please select a role';
      }
    }

    if (step === 2) {
      if (!registrationData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(registrationData.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!registrationData.username) {
        newErrors.username = 'Username is required';
      } else if (registrationData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (!registrationData.password) {
        newErrors.password = 'Password is required';
      } else if (registrationData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (registrationData.password !== registrationData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 3 && registrationData.role === 'artist') {
      if (!registrationData.stageName) {
        newErrors.stageName = 'Stage name is required';
      }
      if (!registrationData.genres || registrationData.genres.length === 0) {
        newErrors.genres = 'Select at least one genre';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(registrationStep)) {
      setRegistrationStep(registrationStep + 1);
    }
  };

  const prevStep = () => {
    setRegistrationStep(registrationStep - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(registrationStep) && registrationData.email && registrationData.password) {
      try {
        await register(registrationData as any);
      } catch (error) {
        setErrors({ submit: (error as Error).message });
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step <= registrationStep
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-dark-700 text-dark-300'
                }`}
              >
                {step < registrationStep ? <Check className="h-5 w-5" /> : step}
              </div>
              <div className="text-xs mt-2 text-dark-200 capitalize font-medium">
                {step === 1 && 'Role'}
                {step === 2 && 'Account'}
                {step === 3 && 'Profile'}
                {step === 4 && 'Complete'}
              </div>
            </div>
          ))}
        </div>
        <div className="relative h-1">
          <div className="absolute top-0 left-0 right-0 h-full bg-dark-700 rounded-full" />
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${((registrationStep - 1) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={registrationStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Role Selection */}
          {registrationStep === 1 && (
            <div className="glass rounded-2xl p-8">
              <div className="space-y-2 mb-8">
                <h3 className="text-3xl font-bold text-white">Join as Artist or Fan</h3>
                <p className="text-dark-200">Choose how you want to experience BAK55</p>
              </div>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'artist' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'artist'
                        ? 'border-primary-500 bg-primary-500/20 shadow-lg shadow-primary-500/30'
                        : 'border-dark-600 glass-light hover:border-primary-500/50'
                    }`}
                  >
                    <Music className="h-10 w-10 text-primary-400 mb-3" />
                    <h3 className="text-xl font-semibold mb-2 text-white">Artist</h3>
                    <p className="text-dark-200 text-sm">
                      Upload music, join competitions, get discovered, and earn BAKCoins
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'user' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'user'
                        ? 'border-secondary-500 bg-secondary-500/20 shadow-lg shadow-secondary-500/30'
                        : 'border-dark-600 glass-light hover:border-secondary-500/50'
                    }`}
                  >
                    <User className="h-10 w-10 text-secondary-400 mb-3" />
                    <h3 className="text-xl font-semibold mb-2 text-white">Fan</h3>
                    <p className="text-dark-200 text-sm">
                      Discover new talent, vote in competitions, support artists, and collect exclusive content
                    </p>
                  </motion.button>
                </div>

                {errors.role && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-400"
                  >
                    {errors.role}
                  </motion.p>
                )}

                <Button
                  onClick={nextStep}
                  disabled={!registrationData.role}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {registrationStep === 2 && (
            <div className="glass rounded-2xl p-8">
              <div className="space-y-2 mb-8">
                <h3 className="text-3xl font-bold text-white">Create Your Account</h3>
                <p className="text-dark-200">Enter your basic account information</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Email Address</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={registrationData.email || ''}
                    onChange={(e) => updateRegistrationData({ email: e.target.value })}
                    variant="glass"
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Username</label>
                  <Input
                    placeholder="unique_username"
                    value={registrationData.username || ''}
                    onChange={(e) => updateRegistrationData({ username: e.target.value })}
                    variant="glass"
                  />
                  {errors.username && <p className="text-sm text-red-400">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registrationData.password || ''}
                    onChange={(e) => updateRegistrationData({ password: e.target.value })}
                    variant="glass"
                  />
                  {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registrationData.confirmPassword || ''}
                    onChange={(e) => updateRegistrationData({ confirmPassword: e.target.value })}
                    variant="glass"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1 border-dark-600 text-dark-100 hover:bg-dark-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Profile Setup */}
          {registrationStep === 3 && (
            <div className="glass rounded-2xl p-8">
              <div className="space-y-2 mb-8">
                <h3 className="text-3xl font-bold text-white">
                  {registrationData.role === 'artist' ? 'Artist Profile' : 'Fan Profile'}
                </h3>
                <p className="text-dark-200">Tell us more about yourself</p>
              </div>
              <div className="space-y-5">
                {registrationData.role === 'artist' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark-100">Stage Name</label>
                      <Input
                        placeholder="Your artist name"
                        value={registrationData.stageName || ''}
                        onChange={(e) => updateRegistrationData({ stageName: e.target.value })}
                        variant="glass"
                      />
                      {errors.stageName && <p className="text-sm text-red-400">{errors.stageName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-dark-100">Music Genres</label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {musicGenres.map((genre) => (
                          <motion.button
                            key={genre}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const currentGenres = registrationData.genres || [];
                              const newGenres = currentGenres.includes(genre)
                                ? currentGenres.filter(g => g !== genre)
                                : [...currentGenres, genre];
                              updateRegistrationData({ genres: newGenres });
                            }}
                            className={`p-3 rounded-lg text-sm font-medium text-left transition-all ${
                              registrationData.genres?.includes(genre)
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'glass-light text-dark-100 hover:bg-dark-600'
                            }`}
                          >
                            {genre}
                          </motion.button>
                        ))}
                      </div>
                      {errors.genres && (
                        <p className="text-sm text-red-400 mt-2">{errors.genres}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Bio</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg glass-light border border-dark-600 px-4 py-3 text-sm text-white placeholder:text-dark-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent transition-all"
                    placeholder="Tell us about yourself..."
                    value={registrationData.bio || ''}
                    onChange={(e) => updateRegistrationData({ bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark-100">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-dark-400" />
                    <Input
                      className="pl-10"
                      placeholder="City, Country"
                      value={registrationData.location || ''}
                      onChange={(e) => updateRegistrationData({ location: e.target.value })}
                      variant="glass"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 glass-light rounded-lg">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={registrationData.acceptTerms || false}
                    onChange={(e) => updateRegistrationData({ acceptTerms: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-dark-200">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary-400 hover:text-primary-300 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-400 hover:text-primary-300 underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1 border-dark-600 text-dark-100 hover:bg-dark-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!registrationData.acceptTerms || isLoading}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
