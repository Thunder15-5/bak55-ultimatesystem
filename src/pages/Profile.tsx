import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Upload, Trophy, User, Settings, Gift, Users, 
  MapPin, Calendar, Mail, Shield, Camera, Sparkles, 
  Music, TrendingUp, Award, Coins, Edit3, Check, X
} from "lucide-react";
import { BadgeCollection } from "@/components/competition/BadgeCollection";
import { ReferralSystem } from "@/components/ReferralSystem";
import { FanRewards } from "@/components/FanRewards";
import { RoleBadge } from "@/components/ui/role-badge";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { KYCVerification } from "@/components/KYCVerification";
import { DirectChat } from "@/components/DirectChat";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { AccountSecurityCard } from "@/components/auth/AccountSecurityCard";

import { Bell } from "lucide-react";

export default function Profile() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0, tracks: 0, plays: 0 });
  const [profile, setProfile] = useState({
    username: "",
    displayName: "",
    bio: "",
    location: "",
    avatarUrl: "",
    email: "",
    createdAt: "",
  });
  const [artistProfile, setArtistProfile] = useState({
    stageName: "",
    genres: [] as string[],
    verified: false,
    talentScore: 0,
  });
  const [producerProfile, setProducerProfile] = useState({
    producerName: "",
    genres: [] as string[],
    verified: false,
    tier: "starter",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWallet();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      if (profileData) {
        setProfile({
          username: profileData.username || "",
          displayName: profileData.display_name || user?.user_metadata?.display_name || "",
          bio: profileData.bio || "",
          location: profileData.location || "",
          avatarUrl: profileData.avatar_url || "",
          email: profileData.email || user?.email || "",
          createdAt: profileData.created_at || "",
        });
      }

      if (userRole === "artist") {
        const { data: artistData } = await supabase
          .from("artist_profiles")
          .select("*")
          .eq("user_id", user?.id)
          .maybeSingle();

        if (artistData) {
          setArtistProfile({
            stageName: artistData.stage_name || "",
            genres: artistData.genres || [],
            verified: artistData.verified || false,
            talentScore: artistData.talent_score || 0,
          });
        }
      }

      if (userRole === "producer") {
        const { data: producerData } = await supabase
          .from("producer_profiles")
          .select("*")
          .eq("user_id", user?.id)
          .maybeSingle();

        if (producerData) {
          setProducerProfile({
            producerName: producerData.producer_name || "",
            genres: producerData.genres || [],
            verified: producerData.verified || false,
            tier: producerData.producer_tier || "starter",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchWallet = async () => {
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user?.id)
      .maybeSingle();
    
    if (data) setWalletBalance(data.balance || 0);
  };

  const fetchStats = async () => {
    try {
      // Followers count
      const { count: followersCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", user?.id);

      // Following count
      const { count: followingCount } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user?.id);

      // Tracks count (for artists)
      const { count: tracksCount } = await supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", user?.id);

      // Total plays
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("plays")
        .eq("artist_id", user?.id);

      const totalPlays = tracksData?.reduce((sum, t) => sum + (t.plays || 0), 0) || 0;

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        tracks: tracksCount || 0,
        plays: totalPlays,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatarUrl: publicUrl });
      
      // Auto-save avatar
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user?.id);
        
      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: profile.bio,
          location: profile.location,
          avatar_url: profile.avatarUrl,
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      if (userRole === "artist") {
        const { error: artistError } = await supabase
          .from("artist_profiles")
          .update({
            stage_name: artistProfile.stageName,
            genres: artistProfile.genres,
          })
          .eq("user_id", user?.id);

        if (artistError) throw artistError;
      }

      if (userRole === "producer") {
        const { error: producerError } = await supabase
          .from("producer_profiles")
          .update({
            producer_name: producerProfile.producerName,
            genres: producerProfile.genres,
          })
          .eq("user_id", user?.id);

        if (producerError) throw producerError;
      }

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const displayName = userRole === "artist" 
    ? artistProfile.stageName 
    : userRole === "producer" 
    ? producerProfile.producerName 
    : profile.displayName || profile.username;

  const isVerified = userRole === "artist" 
    ? artistProfile.verified 
    : userRole === "producer" 
    ? producerProfile.verified 
    : false;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      {/* Profile Header with Banner */}
      <div className="relative">
        {/* Banner Background */}
        <div className="h-32 sm:h-48 md:h-56 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative -mt-16 sm:-mt-20 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              {/* Avatar with Upload */}
              <div className="relative group">
                <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl sm:text-4xl bg-primary/10 text-primary">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>

              {/* Name & Badges */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    {displayName}
                  </h1>
                  <div className="flex items-center gap-2">
                    {isVerified && (
                      <Badge className="bg-primary/90 hover:bg-primary gap-1">
                        <Shield className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                    <RoleBadge role={(userRole as "admin" | "artist" | "brand" | "fan" | "producer") || "fan"} />
                  </div>
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                
                {/* Meta Info Row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground pt-1">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> 
                    Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.followers}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.following}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
            </CardContent>
          </Card>
          {(userRole === "artist" || userRole === "producer") && (
            <>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.tracks}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Tracks</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stats.plays.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Total Plays</div>
                </CardContent>
              </Card>
            </>
          )}
          {userRole === "fan" && (
            <>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{walletBalance.toFixed(1)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">BAK Balance</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Active Fan</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-4 sm:px-6">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-7 sm:inline-flex h-auto sm:h-10 p-1 bg-muted/50">
            <TabsTrigger value="about" className="gap-1.5 text-xs sm:text-sm py-2">
              <User className="h-3.5 w-3.5 hidden sm:inline" /> About
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5 text-xs sm:text-sm py-2">
              <Mail className="h-3.5 w-3.5 hidden sm:inline" /> Messages
            </TabsTrigger>
            {(userRole === "artist" || userRole === "producer") && (
              <TabsTrigger value="kyc" className="gap-1.5 text-xs sm:text-sm py-2">
                <Shield className="h-3.5 w-3.5 hidden sm:inline" /> KYC
              </TabsTrigger>
            )}
            <TabsTrigger value="achievements" className="gap-1.5 text-xs sm:text-sm py-2">
              <Trophy className="h-3.5 w-3.5 hidden sm:inline" /> Badges
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1.5 text-xs sm:text-sm py-2">
              <Gift className="h-3.5 w-3.5 hidden sm:inline" /> Rewards
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1.5 text-xs sm:text-sm py-2">
              <Users className="h-3.5 w-3.5 hidden sm:inline" /> Referrals
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm py-2">
              <Bell className="h-3.5 w-3.5 hidden sm:inline" /> Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bio Section */}
              <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="Nairobi, Kenya"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        />
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Preferred Currency</Label>
                        <CurrencySelector variant="full" />
                        <p className="text-xs text-muted-foreground">All monetary values will be displayed in your selected currency</p>
                      </div>
                      {userRole === "artist" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor="stageName">Stage Name</Label>
                            <Input
                              id="stageName"
                              placeholder="Your stage name"
                              value={artistProfile.stageName}
                              onChange={(e) => setArtistProfile({ ...artistProfile, stageName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="genres">Genres (comma-separated)</Label>
                            <Input
                              id="genres"
                              placeholder="Afrobeats, Hip Hop, R&B"
                              value={artistProfile.genres.join(", ")}
                              onChange={(e) =>
                                setArtistProfile({
                                  ...artistProfile,
                                  genres: e.target.value.split(",").map((g) => g.trim()).filter(Boolean),
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                      {userRole === "producer" && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <Label htmlFor="producerName">Producer Name</Label>
                            <Input
                              id="producerName"
                              placeholder="Your producer name"
                              value={producerProfile.producerName}
                              onChange={(e) => setProducerProfile({ ...producerProfile, producerName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="producerGenres">Genres (comma-separated)</Label>
                            <Input
                              id="producerGenres"
                              placeholder="Afrobeats, Trap, Amapiano"
                              value={producerProfile.genres.join(", ")}
                              onChange={(e) =>
                                setProducerProfile({
                                  ...producerProfile,
                                  genres: e.target.value.split(",").map((g) => g.trim()).filter(Boolean),
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {profile.bio || "No bio added yet. Click 'Edit Profile' to add one!"}
                      </p>
                      
                      {(userRole === "artist" || userRole === "producer") && (
                        <>
                          <Separator />
                          <div className="flex flex-wrap gap-2">
                            {(userRole === "artist" ? artistProfile.genres : producerProfile.genres).map((genre) => (
                              <Badge key={genre} variant="secondary" className="px-3 py-1">
                                {genre}
                              </Badge>
                            ))}
                            {(userRole === "artist" ? artistProfile.genres : producerProfile.genres).length === 0 && (
                              <span className="text-sm text-muted-foreground">No genres added</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Sidebar */}
              <div className="space-y-4">
                {/* Account Info */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">@{profile.username}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Card */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {walletBalance.toFixed(2)} <span className="text-lg font-normal">BAK</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="/wallet">Manage Wallet</a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Artist/Producer Score Card */}
                {userRole === "artist" && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Talent Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {artistProfile.talentScore}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on engagement, streams & votes
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {userRole === "producer" && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Producer Tier
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className="text-lg px-4 py-1 bg-gradient-to-r from-primary to-secondary">
                        {producerProfile.tier.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Upgrade to unlock premium features
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <DirectChat />
          </TabsContent>

          {(userRole === "artist" || userRole === "producer") && (
            <TabsContent value="kyc">
              <KYCVerification />
            </TabsContent>
          )}

          <TabsContent value="achievements">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Your Badges & Achievements
                </CardTitle>
                <CardDescription>
                  Milestones you've unlocked on your journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeCollection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <FanRewards />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSystem />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">

            <NotificationPreferences />
            <AccountSecurityCard />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
