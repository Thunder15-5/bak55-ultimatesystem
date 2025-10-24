import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Mail, CheckCircle, Clock, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EarlyAccessSignup {
  id: string;
  email: string;
  user_type: string;
  source: string;
  created_at: string;
  converted: boolean;
  converted_user_id: string | null;
  invited: boolean;
  invited_at: string | null;
  notes: string | null;
}

export function EarlyAccessPanel() {
  const [signups, setSignups] = useState<EarlyAccessSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Welcome to BAK55 Talent!");
  const [emailBody, setEmailBody] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    setLoading(true);
    
    // Fetch signups with conversion status
    const { data: signupsData, error: signupsError } = await supabase
      .from('early_access_signups')
      .select('*')
      .order('created_at', { ascending: false });

    if (signupsError) {
      console.error('Error fetching early access signups:', signupsError);
      toast.error('Failed to load early access signups');
      setLoading(false);
      return;
    }

    // Check conversion status by matching emails with profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email');

    const profileEmails = new Set(profiles?.map(p => p.email.toLowerCase()) || []);

    const signupsWithStatus = signupsData.map(signup => ({
      ...signup,
      converted: profileEmails.has(signup.email.toLowerCase()),
    }));

    setSignups(signupsWithStatus);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Email', 'User Type', 'Source', 'Signup Date', 'Status', 'Invited', 'Notes'].join(','),
      ...signups.map(signup => [
        signup.email,
        signup.user_type || 'N/A',
        signup.source || 'N/A',
        new Date(signup.created_at).toLocaleDateString(),
        signup.converted ? 'Registered' : 'Pending',
        signup.invited ? 'Yes' : 'No',
        `"${signup.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `early-access-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const handleMarkAsInvited = async (signupId: string) => {
    const { error } = await supabase
      .from('early_access_signups')
      .update({ 
        invited: true, 
        invited_at: new Date().toISOString() 
      })
      .eq('id', signupId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Marked as invited');
      fetchSignups();
    }
  };

  const handleBulkEmail = () => {
    const pendingSignups = signups.filter(s => !s.converted);
    setSelectedEmails(pendingSignups.map(s => s.email));
    setEmailDialogOpen(true);
  };

  const sendBulkEmail = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: selectedEmails,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br>'),
        },
      });

      if (error) throw error;

      // Mark all as invited
      await supabase
        .from('early_access_signups')
        .update({ invited: true, invited_at: new Date().toISOString() })
        .in('email', selectedEmails);

      toast.success(`Invitation sent to ${selectedEmails.length} users`);
      setEmailDialogOpen(false);
      fetchSignups();
    } catch (error: any) {
      console.error('Email send error:', error);
      toast.error('Failed to send emails');
    }
  };

  const filteredSignups = signups.filter(signup =>
    signup.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: signups.length,
    converted: signups.filter(s => s.converted).length,
    pending: signups.filter(s => !s.converted).length,
    artists: signups.filter(s => s.user_type === 'artist').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}% conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.artists}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={handleBulkEmail}>
          <Mail className="w-4 h-4 mr-2" />
          Send Bulk Invitation ({stats.pending} pending)
        </Button>
      </div>

      {/* Signups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Early Access Leads</CardTitle>
          <CardDescription>Track and manage early access signups</CardDescription>
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading signups...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSignups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No signups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSignups.map((signup) => (
                      <TableRow key={signup.id}>
                        <TableCell className="font-medium">{signup.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {signup.user_type || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {signup.source || 'N/A'}
                        </TableCell>
                        <TableCell>{new Date(signup.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={signup.converted ? 'default' : 'secondary'}>
                            {signup.converted ? 'Registered' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {signup.invited ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!signup.invited && !signup.converted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsInvited(signup.id)}
                            >
                              Mark Invited
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Bulk Invitation</DialogTitle>
            <DialogDescription>
              Sending to {selectedEmails.length} pending users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={8}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your invitation message here..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendBulkEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Send to {selectedEmails.length} Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}