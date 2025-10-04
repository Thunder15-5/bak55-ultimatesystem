// frontend/components/ui/input.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  variant?: 'default' | 'glass' | 'premium';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon: LeftIcon, rightIcon: RightIcon, variant = 'default', ...props }, ref) => {
    
    const baseStyles = 'flex w-full rounded-xl border bg-transparent px-4 py-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-luxury disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300';
    
    const variants = {
      default: 'border-dark-600 bg-dark-800/50 focus:border-primary-500 focus:ring-primary-500',
      glass: 'glass border-luxury-glass-border focus:border-primary-400 focus:bg-white/5',
      premium: 'border-primary-500/30 bg-gradient-to-r from-dark-800/50 to-primary-900/10 focus:border-primary-400 focus:bg-primary-900/20'
    };

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        
        <motion.div 
          className="relative"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <LeftIcon className="h-5 w-5" />
            </div>
          )}
          
          <input
            className={cn(
              baseStyles,
              variants[variant],
              LeftIcon && 'pl-10',
              RightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {RightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <RightIcon className="h-5 w-5" />
            </div>
          )}
        </motion.div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-2"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
