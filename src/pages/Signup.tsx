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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <Card className="w-full max-w-2xl border-primary/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src={logoImage} alt="BAK55 Talent" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-2xl md:text-3xl text-center bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Join BAK55 Talent
          </CardTitle>
          <CardDescription className="text-center">
            Create your account and start your music journey
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="coolartist123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I am a... *</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fan">Fan</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="brand">Brand/Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Nairobi, Kenya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {role === "artist" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="stageName">Stage Name</Label>
                  <Input
                    id="stageName"
                    placeholder="DJ Cool"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genres">Genres (comma-separated)</Label>
                  <Input
                    id="genres"
                    placeholder="Afrobeats, Hip Hop, R&B"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                  />
                </div>
              </>
            )}

            {role === "brand" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Music Company Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="Entertainment"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              variant="hero"
              className="w-full"
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
