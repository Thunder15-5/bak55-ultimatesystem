import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UpgradePrompt() {
  const navigate = useNavigate();

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Crown className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold mb-2">Upgrade to Upload More Tracks</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          You've reached the upload limit for free artists. Subscribe to Artist Pro or Premium for unlimited uploads and exclusive benefits!
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Artist Pro</h4>
            </div>
            <p className="text-sm text-muted-foreground">200 BAK/month</p>
            <ul className="text-sm space-y-1">
              <li>✓ Unlimited uploads</li>
              <li>✓ Priority moderation</li>
              <li>✓ 50% off competitions</li>
              <li>✓ Verified badge</li>
            </ul>
          </div>

          <div className="border border-primary rounded-lg p-4 space-y-2 bg-primary/5">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Artist Premium</h4>
            </div>
            <p className="text-sm text-muted-foreground">500 BAK/month</p>
            <ul className="text-sm space-y-1">
              <li>✓ All Pro features</li>
              <li>✓ Featured placement</li>
              <li>✓ Free competitions (5/mo)</li>
              <li>✓ Custom URL</li>
            </ul>
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          size="lg"
          onClick={() => navigate('/subscribe')}
        >
          <Upload className="w-4 h-4 mr-2" />
          View Subscription Plans
        </Button>
      </AlertDescription>
    </Alert>
  );
}