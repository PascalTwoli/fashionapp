import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProduct } from "@/hooks/useProducts";

const Gallery: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startIndex = Number(searchParams.get("index") || 0);

  const { data: product, isLoading } = useProduct(id);
  const images = product?.images || [];

  const [activeIndex, setActiveIndex] = React.useState<number>(startIndex);
  const [columns, setColumns] = React.useState<number>(1); // default: large single column
  const containerRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  React.useEffect(() => {
    setActiveIndex(startIndex);
  }, [startIndex]);

  React.useEffect(() => {
    if (containerRefs.current[activeIndex]) {
      containerRefs.current[activeIndex]!.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading gallery…</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-foreground">
              ×
            </Button>
            <h2 className="text-lg font-medium">{product.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="decrease columns"
              onClick={() => setColumns((c) => Math.max(1, c - 1))}
              className="px-3 py-1 border rounded"
            >
              -
            </button>
            <span className="text-sm">Columns: {columns}</span>
            <button
              aria-label="increase columns"
              onClick={() => setColumns((c) => Math.min(4, c + 1))}
              className="px-3 py-1 border rounded"
            >
              +
            </button>
          </div>
        </div>

        <div className="lg:flex gap-6">
          {/* Thumbnails - left on large screens */}
          <aside className="hidden lg:block w-20 shrink-0">
            <div className="flex flex-col gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "h-20 w-16 overflow-hidden transition-all",
                    activeIndex === i ? "opacity-100" : "opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </aside>

          {/* Main gallery area */}
          <main className="flex-1">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {images.map((src, i) => (
                <div
                  key={i}
                  ref={(el) => (containerRefs.current[i] = el)}
                  className="bg-gray-50 overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`${product.name} - view ${i + 1}`}
                    className="w-full h-auto object-contain cursor-pointer"
                    onClick={() => setActiveIndex(i)}
                  />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
