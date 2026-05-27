import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

export default async function handler(req: any, res: any) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: "Missing slug parameter" });
  }

  try {
    // Fetch all products and find by slug
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .limit(500);

    if (error) throw error;

    // Generate slug from product name
    const generateSlug = (name: string) =>
      name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const product = products?.find((p: any) => generateSlug(p.name) === slug);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get first image
    const imageUrl =
      product.images?.[0] || product.image_url || "/placeholder.png";
    const price = product.discount_price || product.price;

    // Return JSON with meta data
    return res.status(200).json({
      title: product.name,
      description: product.description || `${product.name} - KES ${price}`,
      image: imageUrl,
      url: `https://fashionapp-tau.vercel.app/product/${slug}`,
      price: price,
      currency: "KES",
      brand: product.brand || "FashionUp",
    });
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
