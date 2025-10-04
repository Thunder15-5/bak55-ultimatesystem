// frontend/app/(auth)/login/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialLogin } from '@/components/auth/social-login';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(formData.email, formData.password);
    } catch (error) {
      setErrors({ submit: (error as Error).message });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="glass" className="backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-lg text-gray-300">
            Sign in to your BAK55 account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              leftIcon={Mail}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconClick={() => setShowPassword(!showPassword)}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {errors.submit && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 text-center"
              >
                {errors.submit}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <SocialLogin />

          <div className="text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
