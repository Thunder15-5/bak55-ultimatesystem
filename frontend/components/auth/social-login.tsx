// frontend/components/auth/social-login.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook } from 'react-icons/fa';

export function SocialLogin() {
  const { socialLogin, isLoading } = useAuthStore();

  const socialProviders = [
    {
      name: 'Google',
      icon: FcGoogle,
      provider: 'google' as const,
      color: 'hover:bg-red-500/10 border-red-500/20',
    },
    {
      name: 'Apple',
      icon: FaApple,
      provider: 'apple' as const,
      color: 'hover:bg-gray-500/10 border-gray-500/20',
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      provider: 'facebook' as const,
      color: 'hover:bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-dark-900 text-gray-400">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {socialProviders.map((provider) => (
          <motion.div
            key={provider.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              variant="outline"
              className={`w-full h-12 border-2 ${provider.color} bg-transparent hover:bg-opacity-10 transition-all duration-300`}
              onClick={() => socialLogin(provider.provider)}
              disabled={isLoading}
            >
              <provider.icon className="h-5 w-5" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
