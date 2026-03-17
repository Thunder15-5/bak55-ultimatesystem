import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Package, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price_min: number;
  price_max: number;
  price_bak_min: number;
  price_bak_max: number;
  images: string[];
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  is_limited: boolean;
  is_active: boolean;
  stock_quantity: number;
  stock_status: string;
  total_sold: number;
  low_stock_threshold: number;
  sort_order: number;
  artist_id: string | null;
  created_at: string;
}

const CATEGORIES = ["apparel", "accessories", "art", "digital"];

export function MerchManagementPanel() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-merch-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_products")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-merch-stats"],
    queryFn: async () => {
      const [ordersRes, revenueRes, pendingRes] = await Promise.all([
        supabase.from("merch_orders").select("*", { count: "exact", head: true }),
        supabase.from("merch_orders").select("total, total_bak, payment_method").in("status", ["confirmed", "shipped", "delivered"]),
        supabase.from("merch_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const totalRevenue = revenueRes.data?.reduce((s, o) => s + Number(o.total), 0) || 0;
      const totalBakRevenue = revenueRes.data?.reduce((s, o) => s + Number(o.total_bak || 0), 0) || 0;
      const lowStock = products.filter(p => p.stock_quantity >= 0 && p.stock_quantity <= p.low_stock_threshold).length;
      return {
        totalOrders: ordersRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        totalRevenue,
        totalBakRevenue,
        lowStock,
        totalProducts: products.length,
      };
    },
    enabled: products.length >= 0,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("merch_products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merch-products"] });
      toast.success("Product updated");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("merch_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-merch-products"] });
      toast.success("Product deleted");
    },
  });

  const stockBadge = (p: Product) => {
    if (p.stock_quantity < 0) return <Badge variant="outline" className="text-[10px]">Unlimited</Badge>;
    if (p.stock_quantity === 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
    if (p.stock_quantity <= p.low_stock_threshold) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Low ({p.stock_quantity})</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{p.stock_quantity} in stock</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Products</p>
            <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
            {(stats?.pendingOrders || 0) > 0 && <p className="text-xs text-amber-400">{stats?.pendingOrders} pending</p>}
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Revenue (USD)</p>
            <p className="text-2xl font-bold">${(stats?.totalRevenue || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold">{stats?.lowStock || 0}</p>
            {(stats?.lowStock || 0) > 0 && <AlertTriangle className="w-4 h-4 text-amber-400 inline ml-1" />}
          </CardContent>
        </Card>
      </div>

      {/* Product List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Product Management</CardTitle>
            <CardDescription className="text-xs">Add, edit, and manage merch products</CardDescription>
          </div>
          <ProductFormDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-merch-products"] });
              setShowAddDialog(false);
            }}
          >
            <Button size="sm"><Plus className="w-3 h-3 mr-1" /> Add Product</Button>
          </ProductFormDialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No products yet</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-contain" />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                      {!p.is_active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Hidden</Badge>}
                      {p.is_featured && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Featured</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">${p.price_min}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground capitalize">{p.category}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      {stockBadge(p)}
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{p.total_sold || 0} sold</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                      title={p.is_active ? "Hide product" : "Show product"}
                    >
                      {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                    </Button>
                    <ProductFormDialog
                      product={p}
                      onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ["admin-merch-products"] });
                        setEditingProduct(null);
                      }}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </ProductFormDialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm("Delete this product?")) deleteProduct.mutate(p.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Product Form Dialog ──
function ProductFormDialog({
  product,
  children,
  onSaved,
  open,
  onOpenChange,
}: {
  product?: Product;
  children: React.ReactNode;
  onSaved: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "apparel",
    price_min: product?.price_min || 0,
    price_max: product?.price_max || 0,
    price_bak_min: product?.price_bak_min || 0,
    price_bak_max: product?.price_bak_max || 0,
    images: product?.images?.join(", ") || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
    is_featured: product?.is_featured || false,
    is_limited: product?.is_limited || false,
    stock_quantity: product?.stock_quantity ?? -1,
    sort_order: product?.sort_order || 0,
  });

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price_min: form.price_min,
        price_max: form.price_max || form.price_min,
        price_bak_min: form.price_bak_min || Math.round(form.price_min / 0.16),
        price_bak_max: form.price_bak_max || Math.round((form.price_max || form.price_min) / 0.16),
        images: form.images ? form.images.split(",").map(s => s.trim()).filter(Boolean) : [],
        sizes: form.sizes ? form.sizes.split(",").map(s => s.trim()).filter(Boolean) : [],
        colors: form.colors ? form.colors.split(",").map(s => s.trim()).filter(Boolean) : [],
        is_featured: form.is_featured,
        is_limited: form.is_limited,
        stock_quantity: form.stock_quantity,
        sort_order: form.sort_order,
        stock_status: form.stock_quantity < 0 ? "in_stock" : form.stock_quantity === 0 ? "out_of_stock" : "in_stock",
      };

      if (product) {
        const { error } = await supabase.from("merch_products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("merch_products").insert(payload);
        if (error) throw error;
        toast.success("Product created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Price Min ($)</label>
              <Input type="number" min={0} step={0.01} value={form.price_min} onChange={e => setForm({ ...form, price_min: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price Max ($)</label>
              <Input type="number" min={0} step={0.01} value={form.price_max} onChange={e => setForm({ ...form, price_max: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">BAK Price Min</label>
              <Input type="number" min={0} value={form.price_bak_min} onChange={e => setForm({ ...form, price_bak_min: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">BAK Price Max</label>
              <Input type="number" min={0} value={form.price_bak_max} onChange={e => setForm({ ...form, price_bak_max: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Stock Quantity (-1 = unlimited)</label>
            <Input type="number" min={-1} value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: parseInt(e.target.value) })} />
          </div>
          <Input placeholder="Image URLs (comma-separated)" value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} />
          <Input placeholder="Sizes (comma-separated: S, M, L, XL)" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} />
          <Input placeholder="Colors (comma-separated: Black, Red)" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_limited} onChange={e => setForm({ ...form, is_limited: e.target.checked })} /> Limited Drop
            </label>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sort Order</label>
            <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
