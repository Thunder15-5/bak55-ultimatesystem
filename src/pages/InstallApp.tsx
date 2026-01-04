import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Wifi, 
  Zap, 
  Bell,
  Share,
  Plus,
  Check,
  Monitor,
  Apple,
  Chrome
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Loads instantly, even on slow connections',
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Listen to cached tracks without internet',
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get notified about new releases and competitions',
    },
    {
      icon: Smartphone,
      title: 'Native Experience',
      description: 'Feels just like a native app on your device',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile App
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Install <span className="text-gradient">BAK55</span> App
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Add BAK55 to your home screen for the best experience. 
              Fast, reliable, and always accessible.
            </p>
          </div>

          {/* Status Card */}
          {isInstalled || isStandalone ? (
            <Card className="border-green-500/30 bg-green-500/10 mb-8">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                  App Installed!
                </h2>
                <p className="text-muted-foreground">
                  BAK55 is now available on your device. Look for it on your home screen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent className="p-6">
                {/* Android/Desktop Install */}
                {deferredPrompt && (
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      variant="hero" 
                      className="w-full max-w-sm"
                      onClick={handleInstall}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install BAK55 App
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      One-click install. No app store needed.
                    </p>
                  </div>
                )}

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Apple className="w-6 h-6" />
                      <h3 className="text-lg font-bold">Install on iPhone/iPad</h3>
                    </div>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap the Share button</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for <Share className="w-4 h-4" /> at the bottom of Safari
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Look for <Plus className="w-4 h-4" /> Add to Home Screen
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Tap "Add" to confirm</p>
                          <p className="text-sm text-muted-foreground">
                            BAK55 will appear on your home screen
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                )}

                {/* Desktop/Generic Instructions */}
                {!isIOS && !deferredPrompt && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Chrome className="w-6 h-6" />
                      <h3 className="text-lg font-bold">Install on Desktop</h3>
                    </div>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Look for the install icon</p>
                          <p className="text-sm text-muted-foreground">
                            In the address bar, look for <Monitor className="w-4 h-4 inline" /> or <Download className="w-4 h-4 inline" />
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Click "Install"</p>
                          <p className="text-sm text-muted-foreground">
                            Confirm the installation when prompted
                          </p>
                        </div>
                      </li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-4">
                      Note: If you don't see an install option, you may need to use Chrome or Edge browser.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-primary/10">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
