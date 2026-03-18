import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Ban, Trash2, CheckCircle, Music, Crown, ShieldCheck,
  Coins, Search, Filter, Download, Loader2, Pencil
} from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  banned: boolean;
  user_roles: Array<{ role: string }> | null;
  artist_profiles?: { stage_name: string; total_earnings: number; verified: boolean } | null;
  brand_profiles?: { company_name: string; verified: boolean } | null;
  producer_profiles?: { producer_name: string; verified: boolean } | null;
  wallets?: { balance: number } | null;
  tracks?: Array<{ id: string }>;
}

type RoleFilter = "all" | "fan" | "artist" | "producer" | "brand" | "admin";

export function UsersPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [adjustDialog, setAdjustDialog] = useState<{ userId: string; username: string; currentBalance: number } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [metrics, setMetrics] = useState({
    totalUsers: 0, totalArtists: 0, totalProducers: 0, totalBrands: 0, bannedUsers: 0,
  });

  const getPrimaryRole = (
    roles: Array<{ role: string }> | undefined | null,
    hasArtistProfile = false, hasBrandProfile = false, hasProducerProfile = false
  ): "admin" | "artist" | "brand" | "producer" | "fan" => {
    if (roles && roles.length > 0) {
      const roleNames = roles.map(r => r.role);
      if (roleNames.includes("admin")) return "admin";
      if (roleNames.includes("artist")) return "artist";
      if (roleNames.includes("producer")) return "producer";
      if (roleNames.includes("brand")) return "brand";
      if (roleNames.includes("fan")) return "fan";
    }
    if (hasArtistProfile) return "artist";
    if (hasProducerProfile) return "producer";
    if (hasBrandProfile) return "brand";
    return "fan";
  };

  useEffect(() => { fetchUsers(); fetchMetrics(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role),
        artist_profiles(stage_name, total_earnings, verified),
        brand_profiles(company_name, verified),
        producer_profiles(producer_name, verified),
        wallets(balance),
        tracks(id)
      `)
      .order('created_at', { ascending: false }) as any;

    if (error) { toast.error('Failed to load users'); }
    else { setUsers(data || []); }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    const [totalUsers, totalArtists, totalProducers, totalBrands, bannedUsers] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'artist'),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'producer'),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'brand'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('banned', true),
    ]);
    setMetrics({
      totalUsers: totalUsers.count || 0,
      totalArtists: totalArtists.count || 0,
      totalProducers: totalProducers.count || 0,
      totalBrands: totalBrands.count || 0,
      bannedUsers: bannedUsers.count || 0,
    });
  };

  const getUserRole = (user: UserProfile) =>
    getPrimaryRole(user.user_roles, !!user.artist_profiles, !!user.brand_profiles, !!user.producer_profiles);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const role = getUserRole(user);
      const matchesRole = roleFilter === "all" || role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    if (!confirm(`${action.toUpperCase()} this user?`)) return;
    const { error } = await supabase.from('profiles').update({ banned: !currentBanStatus }).eq('id', userId);
    if (error) toast.error(`Failed to ${action} user`);
    else { toast.success(`User ${action}ned successfully`); fetchUsers(); fetchMetrics(); }
  };

  const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
    const action = currentVerified ? 'unverify' : 'verify';
    if (!confirm(`${action.toUpperCase()} this artist?`)) return;
    const { error } = await supabase.from('artist_profiles').update({ verified: !currentVerified }).eq('user_id', userId);
    if (error) toast.error(`Failed to ${action} artist`);
    else { toast.success(`Artist ${action === 'verify' ? 'verified' : 'unverified'}`); fetchUsers(); }
  };

  const handleAdjustBalance = async () => {
    if (!adjustDialog || !adjustAmount) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) { toast.error("Enter a valid amount"); return; }
    if (!adjustReason.trim()) { toast.error("Enter a reason"); return; }

    setAdjusting(true);
    try {
      const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', adjustDialog.userId).single();
      if (!wallet) throw new Error("Wallet not found");
      const newBalance = wallet.balance + amount;
      if (newBalance < 0) throw new Error("Balance cannot go negative");

      const { error: walletError } = await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
      if (walletError) throw walletError;

      await supabase.from('transactions').insert({
        wallet_id: wallet.id, amount, type: amount > 0 ? 'earning' : 'deduction',
        description: `Admin adjustment: ${adjustReason}`,
        metadata: { admin_adjustment: true, reason: adjustReason },
      });

      await supabase.from('admin_activity_log').insert({
        event_type: 'balance_adjustment', event_category: 'financial',
        description: `Adjusted ${adjustDialog.username}'s balance by ${amount} BAK. Reason: ${adjustReason}`,
        metadata: { user_id: adjustDialog.userId, amount, reason: adjustReason },
      });

      toast.success(`Balance adjusted by ${amount > 0 ? '+' : ''}${amount} BAK`);
      setAdjustDialog(null); setAdjustAmount(""); setAdjustReason("");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust balance");
    } finally {
      setAdjusting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: deleteUserId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('User deleted'); setDeleteUserId(null); fetchUsers(); fetchMetrics();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Username', 'Email', 'Role', 'Balance', 'Banned', 'Joined'];
    const rows = filteredUsers.map(u => [
      u.username, u.email, getUserRole(u),
      u.wallets?.balance || 0, u.banned ? 'Yes' : 'No',
      new Date(u.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bak55-users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported!");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Card><CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-xl font-bold">{metrics.totalUsers}</div>
            <div className="text-[10px] text-muted-foreground">Total Users</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Music className="h-6 w-6 mx-auto text-secondary mb-1" />
            <div className="text-xl font-bold">{metrics.totalArtists}</div>
            <div className="text-[10px] text-muted-foreground">Artists</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Music className="h-6 w-6 mx-auto text-accent mb-1" />
            <div className="text-xl font-bold">{metrics.totalProducers}</div>
            <div className="text-[10px] text-muted-foreground">Producers</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Crown className="h-6 w-6 mx-auto text-warning mb-1" />
            <div className="text-xl font-bold">{metrics.totalBrands}</div>
            <div className="text-[10px] text-muted-foreground">Brands</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Ban className="h-6 w-6 mx-auto text-destructive mb-1" />
            <div className="text-xl font-bold">{metrics.bannedUsers}</div>
            <div className="text-[10px] text-muted-foreground">Banned</div>
          </CardContent></Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">All Users ({filteredUsers.length})</CardTitle>
                <CardDescription className="text-xs">Manage accounts, roles, and balances</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search username or email..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="fan">Fans</SelectItem>
                  <SelectItem value="artist">Artists</SelectItem>
                  <SelectItem value="producer">Producers</SelectItem>
                  <SelectItem value="brand">Brands</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <ScrollArea className="w-full overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>BAK Balance</TableHead>
                      <TableHead>Tracks</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => {
                        const role = getUserRole(user);
                        const isAdmin = role === 'admin';
                        const balance = user.wallets?.balance || 0;

                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-1.5">
                                  {user.username}
                                  {isAdmin && <Crown className="w-3.5 h-3.5 text-primary" />}
                                </div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                {role === 'artist' && user.artist_profiles && (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    Stage: {user.artist_profiles.stage_name}
                                    {user.artist_profiles.verified && <Badge variant="default" className="h-3.5 px-1 text-[8px]">✓</Badge>}
                                  </div>
                                )}
                                {role === 'producer' && user.producer_profiles && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Producer: {user.producer_profiles.producer_name}
                                  </div>
                                )}
                                {role === 'brand' && user.brand_profiles && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Brand: {user.brand_profiles.company_name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell><RoleBadge role={role} /></TableCell>
                            <TableCell>
                              {user.banned ? (
                                <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Banned</Badge>
                              ) : (
                                <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{balance.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">BAK</span>
                                {!isAdmin && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                                    onClick={() => setAdjustDialog({ userId: user.id, username: user.username, currentBalance: balance })}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {role === 'artist' ? (user.tracks?.length || 0) : '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {!isAdmin && (
                                  <>
                                    {role === 'artist' && (
                                      <Button size="sm" variant={user.artist_profiles?.verified ? "secondary" : "default"}
                                        onClick={() => handleToggleVerification(user.id, user.artist_profiles?.verified || false)}
                                        className="h-7 text-xs">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        {user.artist_profiles?.verified ? 'Unverify' : 'Verify'}
                                      </Button>
                                    )}
                                    <Button size="sm" variant={user.banned ? "outline" : "destructive"}
                                      onClick={() => handleToggleBan(user.id, user.banned)} className="h-7 text-xs">
                                      {user.banned ? 'Unban' : 'Ban'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setDeleteUserId(user.id)} className="h-7 w-7 p-0">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Balance Adjustment Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Adjust Balance — @{adjustDialog?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Current Balance</Label>
              <p className="text-lg font-bold">{adjustDialog?.currentBalance.toFixed(2)} BAK</p>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (positive to add, negative to deduct)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="e.g. 50 or -25" />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (required)</Label>
              <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="e.g. Bonus reward, correction..." />
            </div>
            {adjustAmount && (
              <p className="text-sm">
                New balance: <strong>{((adjustDialog?.currentBalance || 0) + parseFloat(adjustAmount || "0")).toFixed(2)} BAK</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>Cancel</Button>
            <Button onClick={handleAdjustBalance} disabled={adjusting}>
              {adjusting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Coins className="h-4 w-4 mr-1" />}
              Adjust Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ This permanently deletes the user and ALL associated data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
