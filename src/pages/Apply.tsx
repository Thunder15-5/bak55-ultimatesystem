import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Music, Trophy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const genres = [
  "Afrobeats", "Hip Hop", "Afro-Pop", "Gengetone", "Dancehall", 
  "R&B", "Reggae", "Gospel", "Bongo Flava", "Amapiano"
];

export default function Apply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phoneNumber: "",
    city: "",
    age: "",
    stageName: "",
    yearsExperience: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    portfolioLink: "",
    whyJoin: "",
    whatMakesUnique: "",
  });

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit an application");
      navigate("/login");
      return;
    }

    if (selectedGenres.length === 0) {
      toast.error("Please select at least one genre");
      return;
    }

    if (parseInt(formData.age) < 16 || parseInt(formData.age) > 26) {
      toast.error("You must be between 16 and 26 years old to apply");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("artist_applications")
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          city: formData.city,
          age: parseInt(formData.age),
          stage_name: formData.stageName,
          primary_genres: selectedGenres,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
          instagram: formData.instagram || null,
          tiktok: formData.tiktok || null,
          youtube: formData.youtube || null,
          portfolio_link: formData.portfolioLink || null,
          why_join: formData.whyJoin,
          what_makes_unique: formData.whatMakesUnique,
        });

      if (error) throw error;

      toast.success("Application submitted successfully! We'll review it and get back to you soon.");
      navigate("/competitions");
    } catch (error: any) {
      console.error("Application error:", error);
      if (error.code === "23505") {
        toast.error("You have already submitted an application");
      } else {
        toast.error("Failed to submit application. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Founders Season Application
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Join the <span className="text-gradient">First 55</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Be part of BAK55's founding artists. Start your journey from 55 artists to becoming the champion.
          </p>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-secondary/5 border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                Eligibility Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Based in Nairobi, Kenya</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>South Sudanese artist or origin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Age: 16-26 years old</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Passionate about building a professional music career</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+254..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Nairobi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        required
                        min="16"
                        max="26"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="18"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Artist Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Artist Information
                  </CardTitle>
                  <CardDescription>Tell us about your music</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stageName">Stage Name *</Label>
                      <Input
                        id="stageName"
                        required
                        value={formData.stageName}
                        onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                        placeholder="Your artist name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min="0"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Genres * (Select all that apply)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                      {genres.map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox
                            id={genre}
                            checked={selectedGenres.includes(genre)}
                            onCheckedChange={() => handleGenreToggle(genre)}
                          />
                          <label
                            htmlFor={genre}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {genre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={formData.tiktok}
                        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={formData.youtube}
                        onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                        placeholder="Channel link"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolioLink">Portfolio/SoundCloud Link</Label>
                    <Input
                      id="portfolioLink"
                      value={formData.portfolioLink}
                      onChange={(e) => setFormData({ ...formData, portfolioLink: e.target.value })}
                      placeholder="https://soundcloud.com/yourmusic"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Application Questions */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Questions</CardTitle>
                  <CardDescription>Help us understand your passion and goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whyJoin">Why do you want to join BAK55 Founders Season? *</Label>
                    <Textarea
                      id="whyJoin"
                      required
                      rows={4}
                      value={formData.whyJoin}
                      onChange={(e) => setFormData({ ...formData, whyJoin: e.target.value })}
                      placeholder="Tell us what drives you to join this competition..."
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatMakesUnique">What makes you unique as an artist? *</Label>
                    <Textarea
                      id="whatMakesUnique"
                      required
                      rows={4}
                      value={formData.whatMakesUnique}
                      onChange={(e) => setFormData({ ...formData, whatMakesUnique: e.target.value })}
                      placeholder="Share what sets you apart from other artists..."
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  disabled={loading}
                  className="w-full md:w-auto px-12"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <Trophy className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}