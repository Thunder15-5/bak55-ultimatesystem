import { Card } from '@/components/ui/card';
import { RegistrationSteps } from '@/components/auth/registration-steps';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">Create Your Account</h1>
          <p className="text-muted-foreground">Join the BAK55 community</p>
        </div>
        
        <RegistrationSteps />
      </Card>
    </div>
  );
}
