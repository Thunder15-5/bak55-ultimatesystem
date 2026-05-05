import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModerationQueue } from "@/components/admin/trust/ModerationQueue";
import { EvidencePanel } from "@/components/admin/trust/EvidencePanel";
import { EnforcementBar } from "@/components/admin/trust/EnforcementBar";
import { RiskScoreCard } from "@/components/admin/trust/RiskScoreCard";
import { AlertStream } from "@/components/admin/trust/AlertStream";
import { AppealsInbox } from "@/components/admin/trust/AppealsInbox";
import { AdminAuditLog } from "@/components/admin/trust/AdminAuditLog";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function TrustSafety() {
  const [activeCase, setActiveCase] = useState<any>(null);

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-20 pb-20 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Trust & Safety Console</h1>
            <p className="text-sm text-muted-foreground">Detect, investigate, and act on platform integrity issues.</p>
          </div>
        </div>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="queue">Queue & Cases</TabsTrigger>
            <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
            <TabsTrigger value="appeals">Appeals</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <div className="grid lg:grid-cols-12 gap-4 h-[calc(100vh-260px)] min-h-[600px]">
              <div className="lg:col-span-3"><ModerationQueue selectedId={activeCase?.id || null} onSelect={setActiveCase} /></div>
              <div className="lg:col-span-6 space-y-4 overflow-auto">
                {!activeCase ? (
                  <Card className="p-12 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                    Select a case from the queue to begin review
                  </Card>
                ) : (
                  <>
                    <Card className="p-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Case</p>
                      <h2 className="text-lg font-semibold mt-1">{activeCase.title}</h2>
                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Subject: {activeCase.subject_type}</span>
                        <span>•</span>
                        <span>Severity: {activeCase.severity}</span>
                        <span>•</span>
                        <span>Status: {activeCase.status}</span>
                      </div>
                    </Card>
                    {activeCase.subject_type === "artist" && <RiskScoreCard artistId={activeCase.subject_id} />}
                    <EnforcementBar
                      caseId={activeCase.id}
                      subjectType={activeCase.subject_type}
                      subjectId={activeCase.subject_id}
                      onActionTaken={() => setActiveCase(null)}
                    />
                  </>
                )}
              </div>
              <div className="lg:col-span-3">
                <EvidencePanel subjectType={activeCase?.subject_type || null} subjectId={activeCase?.subject_id || null} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="h-[600px]"><AlertStream /></div>
          </TabsContent>

          <TabsContent value="appeals"><AppealsInbox /></TabsContent>

          <TabsContent value="audit"><AdminAuditLog /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
