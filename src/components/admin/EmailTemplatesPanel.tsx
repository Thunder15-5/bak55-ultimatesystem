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
import { toast } from 'sonner';
import { 
  Mail, 
  Send, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye
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

export function EmailTemplatesPanel() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingBulkWelcome, setSendingBulkWelcome] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    description: '',
    html_content: '',
    category: 'general',
    variables: '',
  });

  const [customEmail, setCustomEmail] = useState({
    recipients: '',
    subject: '',
    html_content: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, campaignsRes, queueRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
        supabase.from('email_queue').select('*').order('scheduled_for', { ascending: false }).limit(50),
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data);
      if (campaignsRes.data) setCampaigns(campaignsRes.data);
      if (queueRes.data) setQueue(queueRes.data);
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
        name: newTemplate.name,
        subject: newTemplate.subject,
        description: newTemplate.description || null,
        html_content: newTemplate.html_content,
        category: newTemplate.category,
        variables: newTemplate.variables.split(',').map(v => v.trim()).filter(Boolean),
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);
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
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Template deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleToggleCampaign = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      toast.success(isActive ? 'Campaign activated' : 'Campaign paused');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update campaign');
    }
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.recipients || !customEmail.subject || !customEmail.html_content) {
      toast.error('Please fill in all fields');
      return;
    }

    setSendingTest(true);
    try {
      const recipients = customEmail.recipients.split(',').map(e => e.trim()).filter(Boolean);
      
      for (const email of recipients) {
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            subject: customEmail.subject,
            template: 'custom',
            html: customEmail.html_content,
          },
        });

        if (error) throw error;
      }

      toast.success(`Email sent to ${recipients.length} recipient(s)`);
      setShowSendDialog(false);
      setCustomEmail({ recipients: '', subject: '', html_content: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleProcessQueue = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue');
      if (error) throw error;
      toast.success(data.message || 'Queue processed');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to process queue');
    }
  };

  const handleSendBulkWelcome = async () => {
    if (!confirm('This will send the welcome email to ALL 75 registered users. Continue?')) return;
    
    setSendingBulkWelcome(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-welcome');
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Welcome emails sent: ${data.sent} delivered, ${data.failed} failed out of ${data.total}`);
      } else {
        toast.error(data?.error || 'Failed to send bulk welcome emails');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send bulk welcome emails');
    } finally {
      setSendingBulkWelcome(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/20 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Management
          </h2>
          <p className="text-muted-foreground">Manage templates, campaigns, and send custom emails</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            onClick={handleSendBulkWelcome} 
            disabled={sendingBulkWelcome}
          >
            {sendingBulkWelcome ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
            {sendingBulkWelcome ? 'Sending...' : 'Send Welcome to All Users'}
          </Button>
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Custom Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Send Custom Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    placeholder="email1@example.com, email2@example.com"
                    value={customEmail.recipients}
                    onChange={(e) => setCustomEmail({ ...customEmail, recipients: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject..."
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HTML Content</Label>
                  <Textarea
                    placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                    value={customEmail.html_content}
                    onChange={(e) => setCustomEmail({ ...customEmail, html_content: e.target.value })}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Available Variables:</p>
                  <p className="text-muted-foreground">
                    {"{{username}}, {{role}}, {{dashboard_link}}, {{profile_link}}, {{upload_link}}, {{wallet_link}}"}
                  </p>
                </div>
                <Button onClick={handleSendCustomEmail} disabled={sendingTest} className="w-full">
                  {sendingTest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Email
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      placeholder="welcome_email"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Welcome to BAK55 Talent!"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Sent when a new user signs up"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Variables (comma-separated)</Label>
                  <Input
                    placeholder="username, dashboard_link, profile_link"
                    value={newTemplate.variables}
                    onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>HTML Content</Label>
                  <Textarea
                    placeholder="<h1>Welcome {{username}}!</h1>"
                    value={newTemplate.html_content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Button onClick={handleSaveTemplate} className="w-full">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="templates">
            <FileText className="w-4 h-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Users className="w-4 h-4 mr-2" />
            Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Clock className="w-4 h-4 mr-2" />
            Queue ({queue.filter(q => q.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline">{template.category}</Badge>
                        {!template.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      )}
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((v) => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setNewTemplate({
                            name: template.name,
                            subject: template.subject,
                            description: template.description || '',
                            html_content: template.html_content,
                            category: template.category,
                            variables: template.variables.join(', '),
                          });
                          setShowTemplateDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{campaign.trigger_type}</Badge>
                        {campaign.delay_hours > 0 && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {campaign.delay_hours}h delay
                          </Badge>
                        )}
                        {campaign.target_roles.length > 0 && (
                          <Badge variant="outline">
                            {campaign.target_roles.join(', ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sent: {campaign.send_count} emails
                        {campaign.last_sent_at && ` • Last: ${new Date(campaign.last_sent_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`campaign-${campaign.id}`} className="text-sm">Active</Label>
                        <Switch
                          id={`campaign-${campaign.id}`}
                          checked={campaign.is_active}
                          onCheckedChange={(checked) => handleToggleCampaign(campaign.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Email Queue</CardTitle>
                <Button variant="outline" size="sm" onClick={handleProcessQueue}>
                  <Send className="w-4 h-4 mr-2" />
                  Process Queue
                </Button>
              </div>
              <CardDescription>
                Pending and recently sent emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No emails in queue</p>
                ) : (
                  queue.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          To: {item.recipient_email} • Template: {item.template_name}
                        </p>
                        {item.error_message && (
                          <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.scheduled_for).toLocaleString()}
                        </p>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
