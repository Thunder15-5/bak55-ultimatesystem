import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEO/SEOHead";
import { ShoppingBag, Crown, Star, Timer, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "apparel", label: "Apparel" },
  { key: "accessories", label: "Accessories" },
  { key: "art", label: "Art & Prints" },
];

export default function MerchStore() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["merch-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = activeCategory === "all"
    ? products
    : products.filter((p: any) => p.category === activeCategory);

  const featured = products.filter((p: any) => p.is_featured);

  return (
    <>
      <SEOHead
        title="Born African Royalty — Merch Store"
        description="Premium Afrocentric streetwear celebrating African creativity, power, and talent. Shop hoodies, tees, caps, and art."
        url="/merch"
        keywords={["African merch", "Born African Royalty", "BAK55 merch", "African streetwear"]}
      />
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        {/* Hero Banner */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 via-black to-black" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('/merch/born-african-royalty-logo.png')", backgroundSize: "400px", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
          <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-semibold">Premium Collection</span>
              <Crown className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent">
                Born African Royalty
              </span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-8 text-sm md:text-base">
              Wear your heritage. Celebrate African creativity, power, and talent with premium streetwear.
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#D4AF37]" /> Premium Quality</span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-[#D4AF37]" /> Limited Drops</span>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeCategory === cat.key
                    ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                    : "bg-transparent text-gray-400 border-gray-800 hover:border-[#D4AF37]/50 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Banner */}
        {featured.length > 0 && activeCategory === "all" && (
          <div className="max-w-7xl mx-auto px-4 mb-12">
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/5 via-black to-[#C1121F]/5 p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img
                  src="/merch/born-african-royalty-logo.png"
                  alt="Born African Royalty"
                  className="w-32 h-32 md:w-40 md:h-40 object-contain"
                />
                <div className="text-center md:text-left flex-1">
                  <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 mb-2">
                    <Timer className="w-3 h-3 mr-1" /> Featured Drop
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{featured[0]?.title}</h2>
                  <p className="text-gray-400 text-sm mb-4 max-w-lg">{featured[0]?.description}</p>
                  <Link to={`/merch/product/${featured[0]?.id}`}>
                    <Button className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-semibold">
                      Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900 rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No products in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((product: any) => (
                <Link
                  key={product.id}
                  to={`/merch/product/${product.id}`}
                  className="group relative bg-gray-950 border border-gray-800/50 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition-all duration-300"
                >
                  {product.is_limited && (
                    <Badge className="absolute top-3 left-3 z-10 bg-[#C1121F] text-white text-[10px]">
                      LIMITED DROP
                    </Badge>
                  )}
                  <div className="aspect-square bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={product.images?.[0] || "/merch/born-african-royalty-logo.png"}
                      alt={product.title}
                      className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm md:text-base mb-1 group-hover:text-[#D4AF37] transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[#D4AF37] font-bold text-sm">
                        ${product.price_min}
                        {product.price_max > product.price_min && ` – $${product.price_max}`}
                      </span>
                    </div>
                    {product.colors?.length > 1 && (
                      <div className="flex gap-1 mt-2">
                        {product.colors.map((color: string) => (
                          <span
                            key={color}
                            className="w-3 h-3 rounded-full border border-gray-700"
                            style={{
                              backgroundColor:
                                color === "Black" ? "#111" :
                                color === "Red" ? "#C1121F" :
                                color === "Green" ? "#2E7D32" :
                                color === "White" ? "#eee" :
                                color === "Gold" ? "#D4AF37" : "#666",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <section className="border-t border-gray-800 bg-gradient-to-b from-black to-gray-950">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Represent <span className="text-[#D4AF37]">African Royalty</span>
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Every purchase supports African artists and the Born African Royalty movement.
            </p>
            <Link to="/">
              <Button variant="outline" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10">
                Explore BAK55 Platform
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
