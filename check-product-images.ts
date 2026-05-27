import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, images, image_url")
      .limit(5);

    if (error) {
      console.error("Database error:", error);
      return;
    }

    console.log("Products in database:");
    data?.forEach((product: any) => {
      console.log(`\nProduct: ${product.name}`);
      console.log(`  image_url: ${product.image_url}`);
      console.log(`  images array:`, product.images);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
