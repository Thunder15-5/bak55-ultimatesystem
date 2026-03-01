import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Mail, Send, FileText, Plus, Edit, Trash2, Clock, Users,
  CheckCircle, AlertCircle, Loader2, Eye, BarChart3, Inbox,
  RefreshCw, Search, ArrowUpRight, XCircle,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string | null;
  html_content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  template_id: string | null;
  trigger_type: string;
  delay_hours: number;
  target_roles: string[];
  is_active: boolean;
  send_count: number;
  last_sent_at: string | null;
}

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  template_name: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
}

interface SentLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_name: string;
  status: string | null;
  sent_at: string | null;
  resend_id: string | null;
}

export function EmailTemplatesPanel() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [sentLogs, setSentLogs] = useState<SentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBulkWelcome, setSendingBulkWelcome] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [queueFilter, setQueueFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  const [newTemplate, setNewTemplate] = useState({
    name: '', subject: '', description: '', html_content: '', category: 'general', variables: '',
  });

  const [customEmail, setCustomEmail] = useState({
    recipients: '', subject: '', html_content: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, campaignsRes, queueRes, logsRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('email_queue').select('*').order('scheduled_for', { ascending: false }).limit(100),
        supabase.from('email_sent_log').select('*').order('sent_at', { ascending: false }).limit(200),
      ]);
      if (templatesRes.data) setTemplates(templatesRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
      if (queueRes.data) setQueue(queueRes.data);
      if (logsRes.data) setSentLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast.error('Failed to load email data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        name: newTemplate.name, subject: newTemplate.subject,
        description: newTemplate.description || null,
        html_content: newTemplate.html_content, category: newTemplate.category,
        variables: newTemplate.variables.split(',').map(v => v.trim()).filter(Boolean),
      };
      if (editingTemplate) {
        const { error } = await supabase.from('email_templates').update(templateData).eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase.from('email_templates').insert(templateData);
        if (error) throw error;
        toast.success('Template created');
      }
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      setNewTemplate({ name: '', subject: '', description: '', html_content: '', category: 'general', variables: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      fetchData();
    } catch (error: any) { toast.error(error.message || 'Failed to delete'); }
  };

  const handleToggleCampaign = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('email_campaigns').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      toast.success(isActive ? 'Campaign activated' : 'Campaign paused');
      fetchData();
    } catch (error: any) { toast.error('Failed to update campaign'); }
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.recipients || !customEmail.subject || !customEmail.html_content) {
      toast.error('Please fill in all fields'); return;
    }
    setSendingTest(true);
    try {
      const recipients = customEmail.recipients.split(',').map(e => e.trim()).filter(Boolean);
      for (const email of recipients) {
        const { error } = await supabase.functions.invoke('send-email', {
          body: { to: email, subject: customEmail.subject, template: 'custom', html: customEmail.html_content },
        });
        if (error) throw error;
      }
      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setShowSendDialog(false);
      setCustomEmail({ recipients: '', subject: '', html_content: '' });
    } catch (error: any) { toast.error(error.message || 'Failed to send email'); }
    finally { setSendingTest(false); }
  };

  const handleProcessQueue = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue');
      if (error) throw error;
      toast.success(data.message || 'Queue processed');
      fetchData();
    } catch (error: any) { toast.error('Failed to process queue'); }
  };

  const handleRetryFailed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { action: 'retry_failed' },
      });
      if (error) throw error;
      toast.success(data.message || 'Failed emails reset to pending');
      fetchData();
    } catch (error: any) { toast.error('Failed to retry'); }
  };

  const handleClearStale = async () => {
    if (!confirm('This will delete pending queue items older than 7 days. Continue?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { action: 'clear_stale' },
      });
      if (error) throw error;
      toast.success(data.message || 'Stale items cleared');
      fetchData();
    } catch (error: any) { toast.error('Failed to clear stale items'); }
  };

  const handleSendBulkWelcome = async () => {
    if (!confirm('This will send the welcome email to ALL registered users. Continue?')) return;
    setSendingBulkWelcome(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-welcome');
      if (error) throw error;
      if (data?.success) toast.success(`Welcome emails sent: ${data.sent} delivered, ${data.failed} failed out of ${data.total}`);
      else toast.error(data?.error || 'Failed to send bulk welcome emails');
    } catch (error: any) { toast.error(error.message || 'Failed to send bulk welcome emails'); }
    finally { setSendingBulkWelcome(false); }
  };

  // Stats
  const totalSent = sentLogs.length;
  const totalDelivered = sentLogs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
  const totalFailed = sentLogs.filter(l => l.status === 'failed').length;
  const pendingInQueue = queue.filter(q => q.status === 'pending').length;
  const failedInQueue = queue.filter(q => q.status === 'failed').length;
  const staleInQueue = queue.filter(q => q.status === 'pending' && new Date(q.scheduled_for) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  const filteredQueue = queueFilter === 'all' ? queue : queue.filter(q => q.status === queueFilter);
  const filteredLogs = logSearch
    ? sentLogs.filter(l => l.recipient_email.toLowerCase().includes(logSearch.toLowerCase()) || l.subject.toLowerCase().includes(logSearch.toLowerCase()))
    : sentLogs;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: typeof CheckCircle; cls: string; label: string }> = {
      sent: { icon: CheckCircle, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Sent' },
      delivered: { icon: CheckCircle, cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', label: 'Delivered' },
      pending: { icon: Clock, cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Pending' },
      failed: { icon: XCircle, cls: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Failed' },
    };
    const cfg = map[status] || { icon: Clock, cls: '', label: status };
    const Icon = cfg.icon;
    return <Badge variant="outline" className={`text-[10px] ${cfg.cls}`}><Icon className="w-3 h-3 mr-1" />{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Management
          </h2>
          <p className="text-sm text-muted-foreground">Templates, campaigns, queue & delivery logs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-1.5" />Refresh</Button>
          <Button variant="default" size="sm" onClick={handleSendBulkWelcome} disabled={sendingBulkWelcome}>
            {sendingBulkWelcome ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Users className="w-4 h-4 mr-1.5" />}
            Bulk Welcome
          </Button>
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Send className="w-4 h-4 mr-1.5" />Custom Email</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Send Custom Email</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients (comma-separated)</Label>
                  <Input placeholder="email1@example.com, email2@example.com" value={customEmail.recipients} onChange={(e) => setCustomEmail({ ...customEmail, recipients: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject..." value={customEmail.subject} onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>HTML Content</Label>
                  <Textarea placeholder="<h1>Hello!</h1><p>Content here...</p>" value={customEmail.html_content} onChange={(e) => setCustomEmail({ ...customEmail, html_content: e.target.value })} className="min-h-[200px] font-mono text-sm" />
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <p className="text-muted-foreground text-xs">{"{{username}}, {{role}}, {{dashboard_link}}, {{profile_link}}, {{upload_link}}, {{wallet_link}}"}</p>
                </div>
                <Button onClick={handleSendCustomEmail} disabled={sendingTest} className="w-full">
                  {sendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Templates', value: templates.length, icon: FileText, color: 'text-primary' },
          { label: 'Emails Sent', value: totalSent, icon: ArrowUpRight, color: 'text-emerald-500' },
          { label: 'Delivered', value: totalDelivered, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Failed', value: totalFailed, icon: XCircle, color: 'text-destructive' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${s.color}`}><Icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="templates">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="campaigns"><Users className="w-4 h-4 mr-1.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="queue" className="relative">
            <Clock className="w-4 h-4 mr-1.5" />Queue
            {pendingInQueue > 0 && <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] text-[10px] px-1">{pendingInQueue}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="logs"><Inbox className="w-4 h-4 mr-1.5" />Sent Logs</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Dialog open={showTemplateDialog} onOpenChange={(open) => { setShowTemplateDialog(open); if (!open) { setEditingTemplate(null); setNewTemplate({ name: '', subject: '', description: '', html_content: '', category: 'general', variables: '' }); } }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />New Template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="welcome_email" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="onboarding">Onboarding</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Subject</Label><Input placeholder="Welcome to BAK55!" value={newTemplate.subject} onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Description</Label><Input placeholder="When this is sent" value={newTemplate.description} onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Variables (comma-separated)</Label><Input placeholder="username, dashboard_link" value={newTemplate.variables} onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })} /></div>
                  <div className="space-y-2"><Label>HTML Content</Label><Textarea placeholder="<h1>Welcome {{username}}!</h1>" value={newTemplate.html_content} onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })} className="min-h-[200px] font-mono text-sm" /></div>
                  <Button onClick={handleSaveTemplate} className="w-full">{editingTemplate ? 'Update Template' : 'Create Template'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No email templates yet</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {templates.map((template) => (
                <Card key={template.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm">{template.name}</h3>
                          <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
                          {!template.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{template.subject}</p>
                        {template.description && <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>}
                        {template.variables?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.variables.map((v) => (
                              <Badge key={v} variant="outline" className="text-[10px] font-mono">{`{{${v}}}`}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(template)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setEditingTemplate(template);
                          setNewTemplate({ name: template.name, subject: template.subject, description: template.description || '', html_content: template.html_content, category: template.category, variables: template.variables.join(', ') });
                          setShowTemplateDialog(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTemplate(template.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="mt-6">
          {campaigns.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No campaigns configured</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{campaign.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{campaign.trigger_type}</Badge>
                          {campaign.delay_hours > 0 && <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />{campaign.delay_hours}h</Badge>}
                          {campaign.target_roles?.length > 0 && <Badge variant="outline" className="text-[10px]">{campaign.target_roles.join(', ')}</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {campaign.send_count} sent{campaign.last_sent_at && ` · Last: ${new Date(campaign.last_sent_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`c-${campaign.id}`} className="text-xs text-muted-foreground">Active</Label>
                        <Switch id={`c-${campaign.id}`} checked={campaign.is_active} onCheckedChange={(v) => handleToggleCampaign(campaign.id, v)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value="queue" className="mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-base">Email Queue</CardTitle>
                  <CardDescription className="text-xs">{pendingInQueue} pending · {failedInQueue} failed · {staleInQueue > 0 ? `${staleInQueue} stale · ` : ''}{queue.length} total</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={queueFilter} onValueChange={setQueueFilter}>
                    <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRetryFailed}><RefreshCw className="w-3.5 h-3.5 mr-1" />Retry</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClearStale}><Trash2 className="w-3.5 h-3.5 mr-1" />Clear Stale</Button>
                  <Button variant="default" size="sm" className="h-8 text-xs" onClick={handleProcessQueue}><Send className="w-3.5 h-3.5 mr-1" />Process Queue</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredQueue.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No emails in queue</p>
                  ) : filteredQueue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.subject}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.recipient_email} · {item.template_name}
                        </p>
                        {item.error_message && <p className="text-[11px] text-destructive mt-0.5 truncate">{item.error_message}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">{new Date(item.scheduled_for).toLocaleString()}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Delivery Log</CardTitle>
                  <CardDescription className="text-xs">{sentLogs.length} recent emails</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search by email or subject..." className="pl-8 h-8 text-xs" value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No sent emails found</p>
                  ) : filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{log.subject}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{log.recipient_email} · {log.template_name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                        </span>
                        {getStatusBadge(log.status || 'sent')}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview: {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{previewTemplate?.category}</Badge>
              <span className="text-muted-foreground">Subject: {previewTemplate?.subject}</span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={previewTemplate?.html_content || ''}
                title="Email Preview"
                className="w-full h-[500px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
