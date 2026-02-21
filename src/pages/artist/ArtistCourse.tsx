import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, Circle, ChevronRight, ChevronLeft,
  Award, GraduationCap, Clock, Sparkles
} from "lucide-react";

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  description: string;
  content_html: string;
  estimated_minutes: number;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

const ArtistCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        supabase
          .from("course_lessons")
          .select("id, lesson_number, title, description, content_html, estimated_minutes")
          .eq("course_key", "artist_onboarding")
          .eq("is_active", true)
          .order("lesson_number"),
        supabase
          .from("user_course_progress")
          .select("lesson_id, completed, completed_at")
          .eq("user_id", user!.id)
          .eq("course_key", "artist_onboarding"),
      ]);

      if (lessonsRes.data) setLessons(lessonsRes.data);
      if (progressRes.data) {
        const map: Record<string, LessonProgress> = {};
        progressRes.data.forEach((p: any) => { map[p.lesson_id] = p; });
        setProgress(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = lessons.filter((l) => progress[l.id]?.completed).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;
  const allCompleted = lessons.length > 0 && completedCount === lessons.length;

  const completeLesson = async (lesson: Lesson) => {
    if (!user || progress[lesson.id]?.completed) return;
    setCompleting(true);
    try {
      const { error } = await supabase.from("user_course_progress").upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        course_key: "artist_onboarding",
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,lesson_id" });

      if (error) throw error;

      setProgress((prev) => ({
        ...prev,
        [lesson.id]: { lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString() },
      }));

      const newCompleted = completedCount + 1;
      if (newCompleted === lessons.length) {
        // Award badge notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "🎓 Course Completed!",
          message: "Congratulations! You've completed the BAK55 Artist Course and earned the Knowledge Badge!",
          type: "achievement",
          category: "badge",
        });
        toast.success("🎉 Course completed! You earned the Knowledge Badge!");
      } else {
        toast.success(`Lesson ${lesson.lesson_number} completed!`);
      }

      // Auto-advance to next lesson
      const nextLesson = lessons.find((l) => l.lesson_number === lesson.lesson_number + 1);
      if (nextLesson) setActiveLesson(nextLesson);
    } catch (err) {
      toast.error("Failed to save progress");
    } finally {
      setCompleting(false);
    }
  };

  const totalMinutes = lessons.reduce((sum, l) => sum + l.estimated_minutes, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Artist Course</h1>
            {allCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Award className="w-3 h-3 mr-1" /> Completed
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Master BAK55 in {totalMinutes} minutes • {lessons.length} lessons
          </p>

          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completedCount}/{lessons.length} lessons</span>
              <span className="text-primary font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {activeLesson ? (
          /* Lesson Content View */
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveLesson(null)}
              className="text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to lessons
            </Button>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  {activeLesson.estimated_minutes} min
                  <span>•</span>
                  Lesson {activeLesson.lesson_number} of {lessons.length}
                </div>
                <CardTitle className="text-xl">{activeLesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm prose-invert max-w-none
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3
                    [&_p]:text-muted-foreground [&_p]:mb-3 [&_p]:leading-relaxed
                    [&_ul]:space-y-1 [&_ul]:mb-3 [&_ul]:pl-4
                    [&_ol]:space-y-1 [&_ol]:mb-3 [&_ol]:pl-4
                    [&_li]:text-muted-foreground [&_li]:text-sm
                    [&_strong]:text-foreground"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content_html }}
                />

                <div className="mt-6 flex gap-3">
                  {progress[activeLesson.id]?.completed ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Completed
                    </div>
                  ) : (
                    <Button
                      onClick={() => completeLesson(activeLesson)}
                      disabled={completing}
                      className="w-full sm:w-auto"
                    >
                      {completing ? "Saving..." : "Mark as Complete"}
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation between lessons */}
            <div className="flex justify-between">
              {activeLesson.lesson_number > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prev = lessons.find((l) => l.lesson_number === activeLesson.lesson_number - 1);
                    if (prev) setActiveLesson(prev);
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              )}
              <div />
              {activeLesson.lesson_number < lessons.length && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = lessons.find((l) => l.lesson_number === activeLesson.lesson_number + 1);
                    if (next) setActiveLesson(next);
                  }}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Lesson List View */
          <div className="space-y-3">
            {allCompleted && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="font-semibold text-foreground">🎓 Knowledge Badge Earned!</p>
                    <p className="text-sm text-muted-foreground">You've mastered the BAK55 platform. Start creating!</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {lessons.map((lesson) => {
              const done = progress[lesson.id]?.completed;
              return (
                <Card
                  key={lesson.id}
                  className={`cursor-pointer transition-all hover:border-primary/40 ${
                    done ? "border-green-500/20 bg-green-500/5" : "border-border"
                  }`}
                  onClick={() => setActiveLesson(lesson)}
                >
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="flex-shrink-0">
                      {done ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${done ? "text-green-400" : "text-foreground"}`}>
                        {lesson.lesson_number}. {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{lesson.estimated_minutes}m</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistCourse;
