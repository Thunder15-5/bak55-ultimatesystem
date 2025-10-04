// frontend/components/ui/button.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  animation?: 'scale' | 'slide' | 'glow' | 'none';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon: LeftIcon, 
    rightIcon: RightIcon, 
    children, 
    disabled, 
    animation = 'scale',
    ...props 
  }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus-luxury disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden';
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transform hover:-translate-y-0.5',
      secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg shadow-secondary-500/25 hover:shadow-xl hover:shadow-secondary-500/40 hover:from-secondary-600 hover:to-secondary-700 transform hover:-translate-y-0.5',
      accent: 'bg-gradient-to-r from-accent-500 to-accent-600 text-dark-900 shadow-lg shadow-accent-500/25 hover:shadow-xl hover:shadow-accent-500/40 hover:from-accent-600 hover:to-accent-700 transform hover:-translate-y-0.5',
      outline: 'glass border-2 border-primary-500/20 text-primary-100 hover:border-primary-400 hover:bg-primary-500/10 hover:text-white transform hover:-translate-y-0.5',
      ghost: 'text-gray-300 hover:text-white hover:bg-white/10 transform hover:-translate-y-0.5',
      glass: 'glass text-white hover:bg-white/15 hover:backdrop-blur-xl transform hover:-translate-y-0.5',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-2',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-3',
      xl: 'px-10 py-5 text-xl gap-3',
    };

    const animations = {
      scale: {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
      },
      slide: {
        whileHover: { x: 2 },
        whileTap: { x: -1 }
      },
      glow: {
        whileHover: { 
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)" 
        }
      },
      none: {}
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        whileHover={animations[animation].whileHover}
        whileTap={animations[animation].whileTap}
        {...props}
      >
        {/* Shimmer effect on hover */}
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </span>

        {/* Loading spinner */}
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}

        {/* Left Icon */}
        {!isLoading && LeftIcon && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <LeftIcon className={cn(
              size === 'sm' ? 'h-4 w-4' : 
              size === 'md' ? 'h-5 w-5' : 
              'h-6 w-6'
            )} />
          </motion.div>
        )}

        {/* Button text */}
        <span className="relative z-10">{children}</span>

        {/* Right Icon */}
        {!isLoading && RightIcon && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <RightIcon className={cn(
              size === 'sm' ? 'h-4 w-4' : 
              size === 'md' ? 'h-5 w-5' : 
              'h-6 w-6'
            )} />
          </motion.div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
