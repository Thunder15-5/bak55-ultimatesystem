import { Card } from '@/components/ui/card';
import { RegistrationSteps } from '@/components/auth/registration-steps';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold gradient-text">Create Your Account</h1>
          <p className="text-dark-200">Join the BAK55 community</p>
        </div>
        
        <RegistrationSteps />
      </div>
    </div>
  );
}
