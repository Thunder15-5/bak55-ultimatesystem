import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBag, Trash2, ArrowLeft, ArrowRight, Crown, Minus, Plus } from "lucide-react";

export default function MerchCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["merch-cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("merch_cart_items")
        .select("*, merch_products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      if (qty < 1) {
        await supabase.from("merch_cart_items").delete().eq("id", id);
      } else {
        await supabase.from("merch_cart_items").update({ quantity: qty }).eq("id", id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merch-cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("merch_cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merch-cart"] });
      toast.success("Item removed");
    },
  });

  const total = cartItems.reduce((sum: number, item: any) => {
    const price = item.merch_products?.price_min || 0;
    return sum + price * item.quantity;
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 text-center px-4">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-700 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your Cart</h1>
          <p className="text-gray-400 mb-6">Please log in to view your cart.</p>
          <Link to="/login"><Button className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">Log In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Cart — Born African Royalty" description="Your shopping cart" url="/merch/cart" noindex />
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
          <Link to="/merch" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-[#D4AF37]" />
            Your Cart
            {cartItems.length > 0 && (
              <span className="text-sm font-normal text-gray-500">({cartItems.length} item{cartItems.length > 1 ? "s" : ""})</span>
            )}
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse" />)}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 mb-6">Your cart is empty</p>
              <Link to="/merch">
                <Button className="bg-[#D4AF37] text-black hover:bg-[#B8962E]">Browse Store</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-950 border border-gray-800/50 rounded-xl">
                  <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.merch_products?.images?.[0] || "/merch/born-african-royalty-logo.png"}
                      alt={item.merch_products?.title}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{item.merch_products?.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.variant?.color && <span>{item.variant.color}</span>}
                      {item.variant?.size && <span> / {item.variant.size}</span>}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty.mutate({ id: item.id, qty: item.quantity - 1 })}
                          className="w-7 h-7 rounded border border-gray-700 flex items-center justify-center hover:border-[#D4AF37]/50 text-gray-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty.mutate({ id: item.id, qty: item.quantity + 1 })}
                          className="w-7 h-7 rounded border border-gray-700 flex items-center justify-center hover:border-[#D4AF37]/50 text-gray-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#D4AF37] font-bold text-sm">
                          ${((item.merch_products?.price_min || 0) * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem.mutate(item.id)}
                          className="text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="mt-8 p-6 bg-gray-950 border border-[#D4AF37]/20 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-semibold text-sm uppercase tracking-wider">Order Summary</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-gray-800 pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Link to="/merch/checkout">
                  <Button className="w-full mt-4 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-5">
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
