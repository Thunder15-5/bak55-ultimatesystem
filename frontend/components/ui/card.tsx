// frontend/components/ui/card.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'premium' | 'interactive';
  glow?: boolean;
  hover?: 'scale' | 'glow' | 'lift' | 'none';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = false, hover = 'lift', ...props }, ref) => {
    
    const baseStyles = 'rounded-2xl transition-all duration-500';
    
    const variants = {
      default: 'bg-dark-800 border border-dark-700 shadow-lg',
      glass: 'glass border border-luxury-glass-border backdrop-blur-xl',
      premium: 'bg-gradient-to-br from-dark-800 via-primary-900/20 to-dark-900 border border-primary-500/20 shadow-2xl shadow-primary-500/10',
      interactive: 'glass border border-luxury-glass-border backdrop-blur-xl cursor-pointer'
    };

    const hoverEffects = {
      scale: 'hover:scale-105',
      glow: 'hover:shadow-2xl hover:shadow-primary-500/20',
      lift: 'hover:-translate-y-2 hover:shadow-2xl',
      none: ''
    };

    const glowEffect = glow 
      ? 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-primary-500/20 before:to-secondary-500/20 before:blur-xl before:-z-10'
      : '';

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          hoverEffects[hover],
          glowEffect,
          'relative',
          className
        )}
        whileHover={hover !== 'none' ? { 
          y: hover === 'lift' ? -8 : 0,
          scale: hover === 'scale' ? 1.05 : 1 
        } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight gradient-text",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
