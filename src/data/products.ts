export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  sizes: string[];
  colors: string[];
  images: string[];
  isNew?: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Oversized Wool Coat',
    brand: 'FashionUp Studio',
    price: 189.0,
    originalPrice: 249.0,
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
    category: 'Outerwear',
    description:
      'A timeless oversized coat tailored from a soft wool blend. Drop shoulders, single-breasted closure and welt pockets — designed to layer effortlessly through the season.',
    rating: 4.7,
    reviews: 218,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Camel', 'Black', 'Stone'],
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&q=80',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80',
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80',
    ],
    isNew: true,
  },
  {
    id: '2',
    name: 'Relaxed Linen Shirt',
    brand: 'FashionUp Essentials',
    price: 59.0,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
    category: 'Shirts',
    description:
      'Cut from breathable European linen with a relaxed silhouette and mother-of-pearl buttons.',
    rating: 4.5,
    reviews: 142,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['White', 'Sand', 'Olive'],
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&q=80',
    ],
  },
  {
    id: '3',
    name: 'Pleated Midi Skirt',
    brand: 'FashionUp Studio',
    price: 79.0,
    originalPrice: 110.0,
    image: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800&q=80',
    category: 'Skirts',
    description:
      'Fluid pleated midi skirt with elasticated waistband. Crafted from a lightweight satin-finish fabric.',
    rating: 4.8,
    reviews: 309,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Bone', 'Black', 'Olive'],
    images: [
      'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=1200&q=80',
      'https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=1200&q=80',
    ],
  },
  {
    id: '4',
    name: 'Tailored Wide-Leg Trousers',
    brand: 'FashionUp Studio',
    price: 95.0,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
    category: 'Trousers',
    description:
      'High-rise tailored trousers with a fluid wide leg. Pressed crease for a sharp, elongated line.',
    rating: 4.6,
    reviews: 174,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Cream', 'Charcoal'],
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    ],
    isNew: true,
  },
  {
    id: '5',
    name: 'Cashmere Crewneck',
    brand: 'FashionUp Essentials',
    price: 145.0,
    originalPrice: 195.0,
    image: 'https://images.unsplash.com/photo-1631541909061-71e36b3c2d52?w=800&q=80',
    category: 'Knitwear',
    description: 'Pure cashmere crewneck knit in a slightly relaxed fit. Ribbed trims at hem and cuffs.',
    rating: 4.9,
    reviews: 421,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Oat', 'Black', 'Forest'],
    images: [
      'https://images.unsplash.com/photo-1631541909061-71e36b3c2d52?w=1200&q=80',
      'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=1200&q=80',
    ],
  },
  {
    id: '6',
    name: 'Leather Loafers',
    brand: 'FashionUp Studio',
    price: 165.0,
    image: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&q=80',
    category: 'Shoes',
    description: 'Classic penny loafers in soft Italian leather with a leather-stacked heel.',
    rating: 4.4,
    reviews: 96,
    sizes: ['36', '37', '38', '39', '40', '41'],
    colors: ['Black', 'Cognac'],
    images: [
      'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=1200&q=80',
    ],
  },
];

export const categories = [
  { name: 'New In', slug: 'new' },
  { name: 'Women', slug: 'women' },
  { name: 'Men', slug: 'men' },
  { name: 'Sale', slug: 'sale' },
];

export const collections = [
  {
    title: 'New Arrivals',
    subtitle: 'The Spring Edit',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
  },
  {
    title: 'Outerwear',
    subtitle: 'Layer Up',
    image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=1200&q=80',
  },
  {
    title: 'Knitwear',
    subtitle: 'Soft & Refined',
    image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=1200&q=80',
  },
];
