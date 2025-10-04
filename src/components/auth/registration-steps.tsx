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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step <= registrationStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {step < registrationStep ? <Check className="h-4 w-4" /> : step}
              </div>
              <div className="text-xs mt-2 text-muted-foreground capitalize">
                {step === 1 && 'Role'}
                {step === 2 && 'Account'}
                {step === 3 && 'Profile'}
                {step === 4 && 'Complete'}
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
          <motion.div
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2"
            initial={{ width: '0%' }}
            animate={{ width: `${((registrationStep - 1) / 2) * 100}%` }}
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
            <Card className="p-6">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-bold">Join as Artist or Fan</h3>
                <p className="text-muted-foreground">Choose how you want to experience BAK55</p>
              </div>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'artist' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'artist'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Music className="h-8 w-8 text-primary mb-3" />
                    <h3 className="text-xl font-semibold mb-2">Artist</h3>
                    <p className="text-muted-foreground">
                      Upload music, join competitions, get discovered, and earn BAKCoins
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateRegistrationData({ role: 'user' })}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${
                      registrationData.role === 'user'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border bg-card hover:border-secondary/50'
                    }`}
                  >
                    <User className="h-8 w-8 text-secondary mb-3" />
                    <h3 className="text-xl font-semibold mb-2">Fan</h3>
                    <p className="text-muted-foreground">
                      Discover new talent, vote in competitions, support artists, and collect exclusive content
                    </p>
                  </motion.button>
                </div>

                {errors.role && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
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
              </div>
            </Card>
          )}

          {/* Step 2: Account Details */}
          {registrationStep === 2 && (
            <Card className="p-6">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-bold">Create Your Account</h3>
                <p className="text-muted-foreground">Enter your basic account information</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={registrationData.email || ''}
                    onChange={(e) => updateRegistrationData({ email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    placeholder="unique_username"
                    value={registrationData.username || ''}
                    onChange={(e) => updateRegistrationData({ username: e.target.value })}
                  />
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registrationData.password || ''}
                    onChange={(e) => updateRegistrationData({ password: e.target.value })}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registrationData.confirmPassword || ''}
                    onChange={(e) => updateRegistrationData({ confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
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
                    onClick={nextStep}
                    className="flex-1"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Profile Setup */}
          {registrationStep === 3 && (
            <Card className="p-6">
              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-bold">
                  {registrationData.role === 'artist' ? 'Artist Profile' : 'Fan Profile'}
                </h3>
                <p className="text-muted-foreground">Tell us more about yourself</p>
              </div>
              <div className="space-y-4">
                {registrationData.role === 'artist' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stage Name</label>
                      <Input
                        placeholder="Your artist name"
                        value={registrationData.stageName || ''}
                        onChange={(e) => updateRegistrationData({ stageName: e.target.value })}
                      />
                      {errors.stageName && <p className="text-sm text-destructive">{errors.stageName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Music Genres</label>
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
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {genre}
                          </motion.button>
                        ))}
                      </div>
                      {errors.genres && (
                        <p className="text-sm text-destructive mt-2">{errors.genres}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about yourself..."
                    value={registrationData.bio || ''}
                    onChange={(e) => updateRegistrationData({ bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="City, Country"
                      value={registrationData.location || ''}
                      onChange={(e) => updateRegistrationData({ location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={registrationData.acceptTerms || false}
                    onChange={(e) => updateRegistrationData({ acceptTerms: e.target.checked })}
                    className="w-4 h-4 rounded border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <label htmlFor="acceptTerms" className="text-sm">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline">
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
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
