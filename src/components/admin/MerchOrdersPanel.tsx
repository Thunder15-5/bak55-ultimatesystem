import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Package, Truck, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function MerchOrdersPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-merch-orders", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("merch_orders")
        .select("*, profiles:user_id(username, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, tracking }: { id: string; status: string; tracking?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "shipped") updates.shipped_at = new Date().toISOString();
      if (status === "delivered") updates.delivered_at = new Date().toISOString();
      if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
      if (tracking) updates.tracking_number = tracking;
      const { error } = await supabase.from("merch_orders").update(updates).eq("id", id);
      if (error) throw error;

      // Notify customer
      const order = orders.find(o => o.id === id);
      if (order) {
        const messages: Record<string, string> = {
          confirmed: "Your order has been confirmed and is being prepared.",
          shipped: `Your order has been shipped!${tracking ? ` Tracking: ${tracking}` : ""}`,
          delivered: "Your order has been delivered. Enjoy!",
          cancelled: "Your order has been cancelled.",
        };
        if (messages[status]) {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            type: "merch_order_update",
            title: `📦 Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: messages[status],
            link: "/merch/orders",
            priority: "normal",
            category: "merch",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merch-orders"] });
      toast.success("Order updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const processRefund = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const order = orders.find(o => o.id === id);
      if (!order) throw new Error("Order not found");

      // If paid with BAKCoins, refund to wallet
      if (order.payment_method === "bakcoin" && order.total_bak > 0) {
        const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", order.user_id).single();
        if (wallet) {
          await supabase.from("wallets").update({ balance: wallet.balance + order.total_bak }).eq("id", wallet.id);
          await supabase.from("transactions").insert({
            wallet_id: wallet.id,
            type: "income",
            amount: order.total_bak,
            description: `Merch refund: Order #${id.slice(0, 8)}`,
            reference_id: id,
          });
        }
      }

      const { error } = await supabase.from("merch_orders").update({
        status: "cancelled",
        refund_status: "refunded",
        refund_reason: reason,
        refund_amount: order.total,
        cancelled_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "merch_refund",
        title: "💰 Order Refunded",
        message: `Your order #${id.slice(0, 8)} has been refunded.`,
        link: "/merch/orders",
        priority: "high",
        category: "merch",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merch-orders"] });
      toast.success("Refund processed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{orders.length} orders</span>
      </div>

      {/* Orders List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Management</CardTitle>
          <CardDescription className="text-xs">View and manage all merch orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No orders found</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => {
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="p-4 bg-muted/30 rounded-lg border border-border/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                          {order.payment_method === "bakcoin" && (
                            <Badge variant="outline" className="text-[10px]">BAK</Badge>
                          )}
                          {order.refund_status && (
                            <Badge variant="destructive" className="text-[10px]">{order.refund_status}</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          {order.profiles?.username || "Unknown"} 
                          <span className="text-muted-foreground font-normal text-xs ml-1">({order.profiles?.email})</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {items.length} item{items.length !== 1 ? "s" : ""} • 
                          {order.payment_method === "bakcoin" ? ` ${order.total_bak} BAK` : ` $${Number(order.total).toFixed(2)}`} • 
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs text-primary mt-0.5">📦 {order.tracking_number}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {order.status === "pending" && (
                          <Button size="sm" variant="default" onClick={() => updateStatus.mutate({ id: order.id, status: "confirmed" })}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <ShipDialog orderId={order.id} onShip={(tracking) => updateStatus.mutate({ id: order.id, status: "shipped", tracking })} />
                        )}
                        {order.status === "shipped" && (
                          <Button size="sm" variant="default" onClick={() => updateStatus.mutate({ id: order.id, status: "delivered" })}>
                            <Package className="w-3 h-3 mr-1" /> Delivered
                          </Button>
                        )}
                        {!["cancelled", "delivered"].includes(order.status) && !order.refund_status && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt("Refund reason:");
                              if (reason) processRefund.mutate({ id: order.id, reason });
                            }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" /> Refund
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Items */}
                    <div className="mt-2 space-y-1">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.title} ×{item.quantity} {item.variant?.color && `(${item.variant.color}${item.variant?.size ? `, ${item.variant.size}` : ""})`}</span>
                          <span>${((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ShipDialog({ orderId, onShip }: { orderId: string; onShip: (tracking?: string) => void }) {
  const [tracking, setTracking] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Truck className="w-3 h-3 mr-1" /> Ship
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Ship Order</DialogTitle></DialogHeader>
        <Input placeholder="Tracking number (optional)" value={tracking} onChange={e => setTracking(e.target.value)} />
        <Button onClick={() => onShip(tracking || undefined)} className="w-full">
          <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
        </Button>
      </DialogContent>
    </Dialog>
  );
}
