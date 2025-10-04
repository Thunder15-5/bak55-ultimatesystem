// frontend/components/auth/registration-steps.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Music, MapPin, Link, Check, ArrowRight, ArrowLeft } from 'lucide-react';
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

    if (step === 3 && registrationData.role === 'ARTIST') {
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step <= registrationStep
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-500'
                }`}
              >
                {step < registrationStep ? <Check className="h-4 w-4" /> : step}
              </div>
              <div className="text-xs mt-2 text-gray-400 capitalize">
                {step === 1 && 'Role'}
                {step === 2 && 'Account'}
                {step === 3 && 'Profile'}
                {step === 4 && 'Complete'}
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-dark-700 -translate-y-1/2" />
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2"
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
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Join as Artist or Fan</CardTitle>
                <CardDescription>
                  Choose how you want to experience BAK55
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'ARTIST' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'ARTIST'
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 bg-dark-800/50 hover:border-primary-500/50'
                    }`}
                  >
                    <Music className="h-8 w-8 text-primary-500 mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Artist</h3>
                    <p className="text-gray-400">
                      Upload music, join competitions, get discovered, and earn BAKCoins
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'FAN' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'FAN'
                        ? 'border-secondary-500 bg-secondary-500/10'
                        : 'border-dark-600 bg-dark-800/50 hover:border-secondary-500/50'
                    }`}
                  >
                    <User className="h-8 w-8 text-secondary-500 mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Fan</h3>
                    <p className="text-gray-400">
                      Discover new talent, vote in competitions, support artists, and collect exclusive content
                    </p>
                  </motion.button>
                </div>

                {errors.role && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-500"
                  >
                    {errors.role}
                  </motion.p>
                )}

                <Button
                  onClick={nextStep}
                  disabled={!registrationData.role}
                  className="w-full"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Account Details */}
          {registrationStep === 2 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Enter your basic account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={registrationData.email || ''}
                  onChange={(e) => updateRegistrationData({ email: e.target.value })}
                  error={errors.email}
                />

                <Input
                  label="Username"
                  placeholder="unique_username"
                  value={registrationData.username || ''}
                  onChange={(e) => updateRegistrationData({ username: e.target.value })}
                  error={errors.username}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={registrationData.password || ''}
                  onChange={(e) => updateRegistrationData({ password: e.target.value })}
                  error={errors.password}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={registrationData.confirmPassword || ''}
                  onChange={(e) => updateRegistrationData({ confirmPassword: e.target.value })}
                  error={errors.confirmPassword}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Profile Setup */}
          {registrationStep === 3 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>
                  {registrationData.role === 'ARTIST' ? 'Artist Profile' : 'Fan Profile'}
                </CardTitle>
                <CardDescription>
                  Tell us more about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {registrationData.role === 'ARTIST' && (
                  <>
                    <Input
                      label="Stage Name"
                      placeholder="Your artist name"
                      value={registrationData.stageName || ''}
                      onChange={(e) => updateRegistrationData({ stageName: e.target.value })}
                      error={errors.stageName}
                    />

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Music Genres
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {musicGenres.map((genre) => (
                          <motion.button
                            key={genre}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const currentGenres = registrationData.genres || [];
                              const newGenres = currentGenres.includes(genre)
                                ? currentGenres.filter(g => g !== genre)
                                : [...currentGenres, genre];
                              updateRegistrationData({ genres: newGenres });
                            }}
                            className={`p-3 rounded-lg text-sm text-left transition-all ${
                              registrationData.genres?.includes(genre)
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                            }`}
                          >
                            {genre}
                          </motion.button>
                        ))}
                      </div>
                      {errors.genres && (
                        <p className="text-sm text-red-500 mt-2">{errors.genres}</p>
                      )}
                    </div>
                  </>
                )}

                <Input
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={registrationData.bio || ''}
                  onChange={(e) => updateRegistrationData({ bio: e.target.value })}
                  multiline
                  rows={3}
                />

                <Input
                  label="Location"
                  placeholder="City, Country"
                  value={registrationData.location || ''}
                  onChange={(e) => updateRegistrationData({ location: e.target.value })}
                  leftIcon={MapPin}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={registrationData.acceptTerms || false}
                    onChange={(e) => updateRegistrationData({ acceptTerms: e.target.checked })}
                    className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary-500 hover:text-primary-400">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary-500 hover:text-primary-400">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!registrationData.acceptTerms || isLoading}
                    className="flex-1"
                    isLoading={isLoading}
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
