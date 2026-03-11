import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Crown, Package, CheckCircle } from "lucide-react";

export default function MerchCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    address: "", city: "", country: "Kenya", postalCode: "",
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["merch-cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("merch_cart_items")
        .select("*, merch_products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const total = cartItems.reduce((sum: number, item: any) => {
    return sum + (item.merch_products?.price_min || 0) * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cartItems.length === 0) return;
    if (!form.fullName || !form.email || !form.phone || !form.address || !form.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setPlacing(true);
    try {
      const items = cartItems.map((item: any) => ({
        product_id: item.product_id,
        title: item.merch_products?.title,
        variant: item.variant,
        quantity: item.quantity,
        price: item.merch_products?.price_min,
      }));

      const { error: orderError } = await supabase.from("merch_orders").insert({
        user_id: user.id,
        total,
        items,
        shipping_info: form,
        status: "pending",
      });
      if (orderError) throw orderError;

      // Clear cart
      await supabase.from("merch_cart_items").delete().eq("user_id", user.id);
      queryClient.invalidateQueries({ queryKey: ["merch-cart"] });

      setOrderPlaced(true);
      toast.success("Order placed successfully!");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 text-center px-4">
          <p className="text-gray-400">Please log in to checkout.</p>
          <Link to="/login"><Button className="mt-4 bg-[#D4AF37] text-black">Log In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 max-w-lg mx-auto px-4 text-center pb-20">
          <div className="w-20 h-20 rounded-full bg-[#2E7D32]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#2E7D32]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Order Confirmed!</h1>
          <p className="text-gray-400 mb-2">Thank you for your purchase. Your order has been received.</p>
          <p className="text-gray-500 text-sm mb-8">We'll contact you at <span className="text-white">{form.email}</span> with shipping updates.</p>
          <div className="flex flex-col gap-3">
            <Link to="/merch/orders">
              <Button className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-semibold">
                <Package className="w-4 h-4 mr-2" /> View Orders
              </Button>
            </Link>
            <Link to="/merch">
              <Button variant="outline" className="w-full border-gray-800 text-gray-300 hover:border-[#D4AF37]/30">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Checkout — Born African Royalty" url="/merch/checkout" noindex />
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
          <Link to="/merch/cart" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <Crown className="w-7 h-7 text-[#D4AF37]" /> Checkout
          </h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p>Your cart is empty.</p>
              <Link to="/merch" className="text-[#D4AF37] hover:underline mt-2 inline-block">Browse Store</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
              {/* Shipping Form */}
              <div className="md:col-span-3 space-y-4">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-2">Shipping Information</h2>
                <Input
                  placeholder="Full Name *"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Email *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                    required
                  />
                  <Input
                    placeholder="Phone *"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                    required
                  />
                </div>
                <Input
                  placeholder="Street Address *"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                  required
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="City *"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                    required
                  />
                  <Input
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                  />
                  <Input
                    placeholder="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="bg-gray-950 border-gray-800 focus:border-[#D4AF37] text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="pt-4">
                  <p className="text-xs text-gray-500 mb-3">
                    Payment will be arranged after order confirmation. We'll contact you with payment details.
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="md:col-span-2">
                <div className="p-5 bg-gray-950 border border-[#D4AF37]/20 rounded-xl sticky top-24">
                  <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#D4AF37]" /> Order Summary
                  </h3>
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-400 truncate mr-2">
                          {item.merch_products?.title} ×{item.quantity}
                        </span>
                        <span className="text-white flex-shrink-0">
                          ${((item.merch_products?.price_min || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-800 pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#D4AF37]">${total.toFixed(2)}</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={placing}
                    className="w-full mt-4 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-5"
                  >
                    {placing ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
