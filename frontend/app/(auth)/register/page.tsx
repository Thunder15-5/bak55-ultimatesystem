// frontend/app/(auth)/register/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialLogin } from '@/components/auth/social-login';
import { RegistrationSteps } from '@/components/auth/registration-steps';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="glass" className="backdrop-blur-xl border-0">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold gradient-text">
            Join BAK55
          </CardTitle>
          <CardDescription className="text-lg text-gray-300">
            Create your account and start your musical journey
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <RegistrationSteps />

          <SocialLogin />

          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
