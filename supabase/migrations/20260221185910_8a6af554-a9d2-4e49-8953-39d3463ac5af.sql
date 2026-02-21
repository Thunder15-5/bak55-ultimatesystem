
-- Course lessons table (admin-managed content)
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_key text NOT NULL DEFAULT 'artist_onboarding',
  lesson_number integer NOT NULL,
  title text NOT NULL,
  description text,
  content_html text NOT NULL,
  media_url text,
  media_type text DEFAULT 'text',
  estimated_minutes integer DEFAULT 5,
  course_version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_key, lesson_number)
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active lessons"
  ON public.course_lessons FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage lessons"
  ON public.course_lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User course progress table
CREATE TABLE public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_key text NOT NULL DEFAULT 'artist_onboarding',
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_course_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_course_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_course_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Seed the 8 onboarding lessons
INSERT INTO public.course_lessons (course_key, lesson_number, title, description, content_html, estimated_minutes) VALUES
('artist_onboarding', 1, 'Welcome to BAK55', 'Introduction to the BAK55 talent platform', '<h2>Welcome to BAK55</h2><p>BAK55 is Kenya''s premier music talent streaming platform built to discover, reward, and grow emerging artists.</p><p>On BAK55 you can:</p><ul><li>Upload your original music</li><li>Compete in talent competitions</li><li>Earn BAKCoins from fans and downloads</li><li>Build your fanbase and grow your career</li></ul><p>This course will walk you through everything you need to succeed on BAK55.</p>', 3),
('artist_onboarding', 2, 'Setting Up Your Profile', 'Complete your artist profile for maximum visibility', '<h2>Your Artist Profile</h2><p>A complete profile helps fans discover you. Here''s what to set up:</p><ul><li><strong>Stage Name</strong> – Your artist identity on the platform</li><li><strong>Bio</strong> – Tell fans your story in 2-3 sentences</li><li><strong>Avatar</strong> – Upload a clear photo or logo</li><li><strong>Genres</strong> – Select your primary music genres</li><li><strong>Social Links</strong> – Connect your Instagram, TikTok, YouTube</li></ul><p>Tip: Artists with complete profiles get 3x more plays!</p>', 4),
('artist_onboarding', 3, 'Uploading Your Music', 'Learn how to upload and manage your tracks', '<h2>Upload Your First Track</h2><p>Follow these steps to upload music:</p><ol><li>Go to <strong>Upload Track</strong> from your dashboard</li><li>Select your audio file (MP3 format, max 50MB)</li><li>Add a cover image (square, min 500x500px)</li><li>Fill in track details: title, genre, description</li><li>Set your price in BAKCoins (minimum 2.5 BAK)</li><li>Submit for review</li></ol><p>Your track will be reviewed by our team within 24 hours. Once approved, it appears in the music catalog.</p>', 5),
('artist_onboarding', 4, 'Competition Submission Rules', 'How to enter and compete in BAK55 competitions', '<h2>Competing on BAK55</h2><p>Competitions are how you get discovered! Here''s how they work:</p><ol><li><strong>Browse</strong> active competitions from the Competitions page</li><li><strong>Check eligibility</strong> – some competitions have genre or entry fee requirements</li><li><strong>Submit</strong> your track before the deadline</li><li><strong>Promote</strong> your entry to get fan votes</li></ol><p><strong>Competition Stages:</strong></p><ul><li>Onboarding → Mini Edition → Studio Session → Grand Finale</li></ul><p>Top performers win BAKCoin prizes and platform visibility boosts!</p>', 5),
('artist_onboarding', 5, 'Understanding the Voting System', 'How fans vote and how votes are counted', '<h2>The Voting System</h2><p>Fans power your success through votes:</p><ul><li>Each registered fan can vote once per submission per stage</li><li>Votes are counted in real-time on the leaderboard</li><li>Artists with the most votes advance to the next stage</li><li>Voting periods have specific start and end dates</li></ul><p><strong>How to get more votes:</strong></p><ul><li>Share your competition link on social media</li><li>Engage with your fans in comments</li><li>Build your follower base on BAK55</li></ul>', 4),
('artist_onboarding', 6, 'BAKCoins & Platform Currency', 'How to earn, spend, and withdraw BAKCoins', '<h2>BAKCoins Explained</h2><p>BAKCoins (BAK) are the platform currency. 1 BAK = 1 KES.</p><p><strong>Ways to earn BAK:</strong></p><ul><li>Receive tips from fans</li><li>Sell paid downloads (min 2.5 BAK)</li><li>Win competition prizes</li><li>Complete daily challenges</li><li>Referral rewards</li></ul><p><strong>Ways to spend BAK:</strong></p><ul><li>Enter paid competitions</li><li>Purchase other artists'' tracks</li><li>Tip other artists</li></ul><p><strong>Withdrawals:</strong> Minimum 250 BAK. A 5% platform fee applies. Processed via M-PESA.</p>', 6),
('artist_onboarding', 7, 'Paid Downloads Feature', 'Set up paid downloads for your tracks', '<h2>Monetize with Paid Downloads</h2><p>Enable fans to purchase and download your music:</p><ol><li>When uploading a track, set <strong>Price</strong> to at least 2.5 BAK</li><li>Fans click "Buy" and the BAK is transferred to your wallet</li><li>You receive 85% of the sale price</li><li>The platform keeps 15% as a service fee</li></ol><p><strong>Tips for more sales:</strong></p><ul><li>Price competitively (5-20 BAK is the sweet spot)</li><li>Offer exclusive content</li><li>Promote on your socials with direct links</li></ul>', 4),
('artist_onboarding', 8, 'Growing on BAK55', 'Strategies to build your audience and career', '<h2>Artist Growth Strategies</h2><p>Success on BAK55 is a marathon, not a sprint:</p><ul><li><strong>Consistency</strong> – Upload new music regularly</li><li><strong>Engagement</strong> – Reply to comments and interact with fans</li><li><strong>Competitions</strong> – Enter every competition you qualify for</li><li><strong>Collaboration</strong> – Work with other BAK55 artists</li><li><strong>Social Media</strong> – Share your BAK55 profile and tracks</li><li><strong>Quality</strong> – Invest in good production and mixing</li></ul><p>Top artists on BAK55 get featured on the homepage, earning massive visibility!</p><p><strong>Congratulations!</strong> You''ve completed the BAK55 Artist Course. You''re ready to start your journey! 🎉</p>', 5);
