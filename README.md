# FashionUp

A modern, mobile-first fashion e-commerce platform built with React, Vite, TypeScript, and Tailwind CSS. FashionUp delivers an editorial Zara/H&M-inspired shopping experience with a complete admin portal for catalog and order management. Backed by Lovable Cloud (Supabase) for auth, database and storage, and packaged with Capacitor for native iOS/Android deployment.

> Prices throughout the app are displayed in **Kenyan Shillings (KES)**.

---

## ✨ Features

### Shopper experience
- 🛍 **Editorial home** — full-bleed hero, curated collections, category navigation
- 🔍 **Browse & search** — category pages, product grid with hover-zoom imagery
- 👗 **Product detail** — image gallery, size & color selection, sticky add-to-bag
- ❤️ **Wishlist** — persistent favorites per user
- 🛒 **Shopping bag** — quantity controls, live order summary, free shipping over KES 10,000
- 💳 **2-step checkout** — address → payment → confirmation
- 👤 **Account** — login, register, profile management

### Admin portal (`/admin`)
- 🔐 Role-based access using a dedicated `user_roles` table (`admin` role)
- 📦 Product CRUD — create, edit, delete, manage stock & images
- 📊 Order monitoring — view all orders, line items and totals, update status

### Platform
- 📱 Mobile-first layout: fixed header, fixed bottom nav, scrollable content
- 🌗 Themeable design system with HSL semantic tokens
- 📲 Native iOS / Android builds via **Capacitor**
- ☁️ **Lovable Cloud** backend (auth, Postgres, storage, RLS)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Routing | React Router |
| State | React Context (Auth, Cart, Wishlist) |
| Backend | Lovable Cloud (Supabase) — Postgres, Auth, Storage, RLS |
| Native | Capacitor (iOS & Android) |
| Icons | lucide-react |
| Fonts | Playfair Display (display), Inter (UI) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (or bun)

### Install & run
```bash
npm install
npm run dev
```
The app runs at `http://localhost:5173`.

### Build
```bash
npm run build      # production build
npm run preview    # preview the production build locally
```

---

## 🔐 Lovable Cloud (Backend)

This project uses **Lovable Cloud** for authentication, database, and storage. No external account is needed — it is configured automatically when you open the project in Lovable.

### Database tables
- `profiles` — user profile data (name, etc.)
- `products` — catalog (name, description, price, image_url, category, stock)
- `orders` — order header (user_id, status, total_amount)
- `order_items` — line items (product_id, quantity, price, size, color)
- `user_roles` — role assignments (`admin`, `moderator`, `user`)

Roles are stored in a separate `user_roles` table and validated through the
`has_role(user_id, role)` SECURITY DEFINER function — never on the profile.

### Becoming an admin
1. Register a normal account in the app.
2. In the Lovable Cloud database, insert a row into `user_roles`:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('<your-auth-user-id>', 'admin');
   ```
3. Log out and back in. The `/admin` route will become accessible.

---

## 📱 Native Apps (Capacitor)

The project includes `capacitor.config.ts` for building iOS and Android apps.

```bash
npm run build
npx cap add ios          # first time only
npx cap add android      # first time only
npx cap sync
npx cap open ios         # opens Xcode
npx cap open android     # opens Android Studio
```

Requires Xcode (macOS) for iOS and Android Studio for Android.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/              # Admin-only UI (ProductManagement, OrderManagement)
│   ├── ui/                 # shadcn/ui primitives
│   ├── BottomNavigation.tsx
│   ├── ProductCard.tsx
│   ├── ProductInfo.tsx
│   └── ...
├── contexts/
│   ├── AuthContext.tsx     # Auth state + session
│   ├── CartContext.tsx     # Shopping bag state
│   └── WishlistContext.tsx
├── data/
│   └── products.ts         # Demo catalogue + Product type
├── hooks/
│   └── useUserRole.tsx     # Reads user role from Cloud
├── integrations/supabase/  # Generated Cloud client + types
├── lib/
│   ├── format.ts           # KES currency formatter
│   └── utils.ts
├── pages/
│   ├── Home.tsx
│   ├── Categories.tsx
│   ├── ProductDetail.tsx
│   ├── ShoppingBag.tsx
│   ├── Checkout.tsx
│   ├── Wishlist.tsx
│   ├── Profile.tsx
│   ├── Login.tsx / Register.tsx
│   └── AdminDashboard.tsx
├── index.css               # Design tokens (HSL)
└── main.tsx
```

---

## 🎨 Design System

All colors are defined as HSL semantic tokens in `src/index.css` and surfaced
via Tailwind in `tailwind.config.ts`. **Never hard-code colors in components**
(e.g. `text-white`, `bg-black`); always use tokens like `bg-background`,
`text-foreground`, `text-muted-foreground`, `bg-secondary`, `text-accent`.

The aesthetic targets a **Modern Trendy** look (Zara / H&M):
- Neutral palette with a warm terracotta `--accent`
- `Playfair Display` for editorial headings, `Inter` for UI
- Square-edged components (`rounded-none`)
- Subtle hover-zoom on product imagery

---

## 💱 Currency

Prices are displayed in **KES** (Kenyan Shillings) via the
`formatKES(amount)` helper in `src/lib/format.ts`. Stored prices in the
database are numeric values in KES (no decimals shown by default).

---

## 🗺 Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Home | Public |
| `/categories` | Browse categories | Public |
| `/product/:id` | Product detail | Public |
| `/bag` | Shopping bag | Public |
| `/checkout` | Checkout flow | User |
| `/wishlist` | Saved items | User |
| `/profile` | Account | User |
| `/login` · `/register` | Auth | Public |
| `/admin` | Admin dashboard | Admin role |

---

## 📜 Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview built app |
| `npm run lint` | Lint sources |

---

## 🤝 Contributing

This project is developed on [Lovable](https://lovable.dev). You can:
- Edit through the Lovable chat interface (changes are auto-committed)
- Clone the repo and push from your local IDE
- Edit directly in GitHub

---

## 📄 License

Private project. All rights reserved.
