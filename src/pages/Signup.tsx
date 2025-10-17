import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/bak55-logo.png";

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"artist" | "fan" | "brand">("fan");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [stageName, setStageName] = useState("");
  const [genres, setGenres] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      username,
      role,
      displayName: displayName || username,
      bio,
      location,
      ...(role === "artist" && {
        stageName: stageName || username,
        genres: genres ? genres.split(",").map((g) => g.trim()) : [],
      }),
      ...(role === "brand" && {
        companyName: companyName || username,
        industry,
      }),
    };

    const { error } = await signUp(email, password, userData);

    if (error) {
      toast.error(error.message || "Failed to create account");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8 md:py-12">
      <Card className="w-full max-w-2xl border-primary/20">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img src={logoImage} alt="BAK55 Talent" className="h-16 sm:h-20 w-auto" />
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Join BAK55 Talent
          </CardTitle>
          <CardDescription className="text-center text-sm">
            Create your account and start your music journey
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm">Username *</Label>
                <Input
                  id="username"
                  placeholder="coolartist123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm">I am a... *</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="fan">Fan</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="brand">Brand/Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm">Location</Label>
                <Input
                  id="location"
                  placeholder="Nairobi, Kenya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {role === "artist" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stageName" className="text-sm">Stage Name</Label>
                  <Input
                    id="stageName"
                    placeholder="DJ Cool"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genres" className="text-sm">Genres (comma-separated)</Label>
                  <Input
                    id="genres"
                    placeholder="Afrobeats, Hip Hop, R&B"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="h-11"
                  />
                </div>
              </>
            )}

            {role === "brand" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Music Company Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="Entertainment"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-4 sm:p-6">
            <Button
              type="submit"
              variant="hero"
              className="w-full h-11 md:h-12 touch-manipulation"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
