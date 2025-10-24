import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Crown, Music, Ban, Trash2, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  banned: boolean;
  user_roles: Array<{ role: string }>;
  artist_profiles?: { stage_name: string; total_earnings: number };
  wallets?: { balance: number };
  tracks?: Array<{ id: string }>;
}

export function UsersPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalArtists: 0,
    bannedUsers: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchMetrics();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role),
        artist_profiles(stage_name, total_earnings),
        wallets(balance),
        tracks(id)
      `)
      .order('created_at', { ascending: false }) as any;

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalArtists } = await supabase
      .from('artist_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: bannedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('banned', true);

    setMetrics({
      totalUsers: totalUsers || 0,
      totalArtists: totalArtists || 0,
      bannedUsers: bannedUsers || 0,
    });
  };

  const handleToggleBan = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    const confirmed = confirm(`${action.toUpperCase()} this user?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('profiles')
      .update({ banned: !currentBanStatus })
      .eq('id', userId);

    if (error) {
      toast.error(`Failed to ${action} user`);
    } else {
      toast.success(`User ${action}ned successfully`);
      fetchUsers();
      fetchMetrics();
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      // Delete all related data manually (cascading deletes)
      // This is a simplified version - in production you'd want more comprehensive cleanup
      
      // Delete user's tracks
      await supabase.from('tracks').delete().eq('artist_id', deleteUserId);
      
      // Delete user's submissions
      await supabase.from('submissions').delete().eq('artist_id', deleteUserId);
      
      // Delete user's comments
      await supabase.from('comments').delete().eq('user_id', deleteUserId);
      
      // Delete user's subscriptions
      await supabase.from('user_subscriptions').delete().eq('user_id', deleteUserId);
      
      // Delete user's transactions
      const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', deleteUserId).single();
      if (wallet) {
        await supabase.from('transactions').delete().eq('wallet_id', wallet.id);
        await supabase.from('wallets').delete().eq('id', wallet.id);
      }
      
      // Delete user's profile
      const { error } = await supabase.from('profiles').delete().eq('id', deleteUserId);
      
      if (error) throw error;
      
      toast.success('User account deleted successfully');
      setDeleteUserId(null);
      fetchUsers();
      fetchMetrics();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete user account: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRole = (user: UserProfile) => {
    return user.user_roles?.[0]?.role || 'fan';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Artists</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalArtists}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bannedUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => {
                        const role = getUserRole(user);
                        const isArtist = role === 'artist';
                        const isAdmin = role === 'admin';
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {user.username}
                                  {isAdmin && <Crown className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                {isArtist && user.artist_profiles && (
                                  <div className="text-xs text-muted-foreground">
                                    Stage: {user.artist_profiles.stage_name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={isAdmin ? 'default' : 'secondary'}>
                                {role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.banned ? (
                                <Badge variant="destructive">
                                  <Ban className="w-3 h-3 mr-1" />
                                  Banned
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.wallets?.balance || 0} BAK
                            </TableCell>
                            <TableCell>
                              {isArtist ? (user.tracks?.length || 0) : '-'}
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {!isAdmin && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant={user.banned ? "outline" : "destructive"}
                                      onClick={() => handleToggleBan(user.id, user.banned)}
                                    >
                                      {user.banned ? 'Unban' : 'Ban'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setDeleteUserId(user.id)}
                                    >
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ This will permanently delete the user account and ALL associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information</li>
                <li>Uploaded tracks</li>
                <li>Wallet and transaction history</li>
                <li>Comments and interactions</li>
                <li>Subscriptions</li>
              </ul>
              <strong className="block mt-2 text-destructive">This action cannot be undone!</strong>
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
