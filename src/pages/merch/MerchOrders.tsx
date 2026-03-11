import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Crown } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function MerchOrders() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["merch-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("merch_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 text-center px-4">
          <p className="text-gray-400">Please log in to view orders.</p>
          <Link to="/login"><Button className="mt-4 bg-[#D4AF37] text-black">Log In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="My Orders — Born African Royalty" url="/merch/orders" noindex />
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
          <Link to="/merch" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <Package className="w-7 h-7 text-[#D4AF37]" /> My Orders
          </h1>

          {isLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-28 bg-gray-900 rounded-xl animate-pulse" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 mb-6">No orders yet</p>
              <Link to="/merch"><Button className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">Browse Store</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="p-5 bg-gray-950 border border-gray-800/50 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Crown className="w-4 h-4 text-[#D4AF37]" />
                          <span className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <Badge className={statusColors[order.status] || statusColors.pending}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-400">{item.title} ×{item.quantity}</span>
                          <span className="text-gray-300">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-800 pt-2 flex justify-between font-bold">
                      <span className="text-sm">Total</span>
                      <span className="text-[#D4AF37]">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
