import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingBag, Share2, ArrowLeft, Crown, Check, Minus, Plus } from "lucide-react";

export default function MerchProduct() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["merch-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      if (data.colors?.length) setSelectedColor(data.colors[0]);
      if (data.sizes?.length) setSelectedSize(data.sizes[0]);
      return data;
    },
    enabled: !!id,
  });

  const addToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to your cart");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("merch_cart_items").insert({
        user_id: user.id,
        product_id: id!,
        variant: { color: selectedColor, size: selectedSize },
        quantity,
      });
      if (error) throw error;
      toast.success("Added to cart!", { description: `${product?.title} — ${selectedColor} / ${selectedSize}` });
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/merch/product/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: product?.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const colorMap: Record<string, string> = {
    Black: "#111", Red: "#C1121F", Green: "#2E7D32", White: "#eee", Gold: "#D4AF37",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-gray-900 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-900 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-900 rounded w-1/2 animate-pulse" />
              <div className="h-20 bg-gray-900 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <Link to="/merch" className="text-[#D4AF37] hover:underline">Back to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={product.title}
        description={product.description || "Born African Royalty premium merchandise"}
        image={product.images?.[0]}
        url={`/merch/product/${id}`}
      />
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
          {/* Breadcrumb */}
          <Link to="/merch" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl border border-gray-800/50 flex items-center justify-center p-10 md:p-16">
                <img
                  src={product.images?.[0] || "/merch/born-african-royalty-logo.png"}
                  alt={product.title}
                  className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(212,175,55,0.2)]"
                />
              </div>
              {product.is_limited && (
                <Badge className="absolute top-4 left-4 bg-[#C1121F] text-white">LIMITED DROP</Badge>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs">
                  <Crown className="w-3 h-3 mr-1" /> Born African Royalty
                </Badge>
                <button onClick={handleShare} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.title}</h1>

              <div className="text-2xl font-bold text-[#D4AF37] mb-4">
                ${product.price_min}
                {product.price_max > product.price_min && <span className="text-lg text-gray-500"> – ${product.price_max}</span>}
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-6">{product.description}</p>

              {/* Color Selector */}
              {product.colors?.length > 0 && (
                <div className="mb-5">
                  <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                    Color — <span className="text-white">{selectedColor}</span>
                  </label>
                  <div className="flex gap-2">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === color ? "border-[#D4AF37] scale-110" : "border-gray-700 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: colorMap[color] || "#666" }}
                      >
                        {selectedColor === color && <Check className="w-4 h-4 text-[#D4AF37]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {product.sizes?.length > 0 && (
                <div className="mb-5">
                  <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          selectedSize === size
                            ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                            : "bg-transparent text-gray-300 border-gray-700 hover:border-[#D4AF37]/50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-700 flex items-center justify-center hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-lg border border-gray-700 flex items-center justify-center hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={addToCart}
                disabled={adding}
                className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold py-6 text-base rounded-xl"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {adding ? "Adding..." : "Add to Cart"}
              </Button>

              <Link to="/merch/cart" className="mt-3">
                <Button variant="outline" className="w-full border-gray-800 text-gray-300 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]">
                  View Cart
                </Button>
              </Link>

              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {["Premium Quality", "Afrocentric Design", "Artist Support"].map((t) => (
                  <div key={t} className="py-3 px-2 rounded-lg bg-gray-950 border border-gray-800/50">
                    <Crown className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
