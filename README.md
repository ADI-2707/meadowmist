# Meadow Mist — Handcrafted Candles & Ceramic Décor

> **"Things made by hand, grown like something living."**

An e-commerce storefront demo for **Meadow Mist**, an artisan brand specializing in small-batch hand-poured soy candles and wheel-thrown ceramic home décor. 

Built with **Next.js 16 (App Router)**, **TypeScript**, **Vanilla CSS Modules**, **Framer Motion**, and **Zustand**.

---

## 🎨 Design Philosophy & Aesthetics

- **Color System**: Warm parchment canvas (`#F7F2E7`), deep forest green (`#33422A`), hand-painted gold (`#B4903F`), terracotta clay (`#C97B5B`), dusty lavender-mauve (`#B48AAE`), and blush ceramic (`#D98FA0`).
- **Typography**: 
  - **Display**: *Fraunces* (variable optical serif)
  - **Script Accent**: *Beau Rivage*
  - **Body**: *Jost* (geometric sans)
- **Zero Utility-First Libraries**: Built with **100% Vanilla CSS Modules** and CSS Custom Property design tokens for max design control and performance.

---

## ✨ Features Built in Demo Version

- 🌟 **First-Load Logo Zoom Reveal Intro (`IntroLoader`)**:
  - Full-screen animated opening overlay featuring the gold emblem logo.
  - Smooth zoom-reveal transition (`scale: 1 → 22`) that dissolves away to reveal the storefront.
  - Session-aware (`sessionStorage`) and respects `prefers-reduced-motion`.

- 🖼️ **Interactive 3D Product Cards**:
  - Pointer-tracking 3D tilt perspective (`rotateX` / `rotateY`).
  - Dynamic radial sheen overlay simulating glazed light.
  - Lifted depth shadows and smooth hover scale.

- 🛍️ **Inline Quantity Controls on Buttons**:
  - When an item is added to the bag, the `Add to bag` button transforms into an inline **`-` `QTY` `+`** control pill.
  - Decreasing quantity to `0` automatically reverts the button back to `Add to bag`.

- 🔔 **Floating Toast Notification System (`CartToast`)**:
  - Top-right glassmorphism pop-up banner showing product thumbnail, price, and `View Bag →` CTA.
  - Clicking `View Bag →` smoothly slides the toast off-screen to the right while opening the side bag drawer.

- 🧼 **Seamless Fixed Header**:
  - Borderless, 100% solid parchment navbar (`var(--color-canvas)`).
  - Page content cleanly disappears underneath without any lines or translucency clutter when scrolling.

- 📜 **Scroll Animation System (`ScrollProgressBar` & Parallax)**:
  - Fixed spring-animated golden scroll progress line at top of viewport.
  - Scroll-driven parallax depth on Hero text and floating product image.
  - Staggered `whileInView` section entrance reveals.

- 🛒 **Persistent Shopping Bag (`useCartStore`)**:
  - Zustand cart state with `localStorage` persistence.
  - Slide-out Cart Drawer, full `/cart` page, item quantity controls, and price calculations in INR (`₹`).

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16 (App Router)** | Framework, SSG, Routing, Image Optimization |
| **TypeScript** | Strict Type Safety |
| **Vanilla CSS Modules** | Component-Scoped Styling & Design Tokens |
| **Framer Motion** | Complex UI Animations, Spring Dynamics & Scroll Tracking |
| **Zustand** | Global Cart & Wishlist State Management with `persist` |
| **React Hook Form + Zod** | Form Validation (Newsletter & Contact Form) |

---

## 📁 Directory Structure

```
meadow_mist/
├── public/
│   └── images/
│       ├── logo.jpg               # Official brand emblem logo
│       └── products/              # 13 handcrafted product images
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── candles/               # Candles category grid with filter pills
│   │   ├── ceramics/              # Ceramics category grid with filter pills
│   │   ├── product/[slug]/        # Dynamic SSG Product Detail Pages (PDP)
│   │   ├── cart/                  # Full shopping cart page
│   │   ├── our-story/             # Brand story & logo showcase
│   │   ├── contact/               # Validated contact form
│   │   ├── journal/               # Studio journal coming soon stub
│   │   ├── account/               # User account coming soon stub
│   │   ├── globals.css            # Global CSS custom properties design tokens
│   │   └── layout.tsx             # Root layout with fonts, IntroLoader & header/footer
│   ├── components/                # Modular React components with CSS Modules
│   │   ├── SiteHeader/            # Responsive header with brand logo & cart trigger
│   │   ├── Footer/                # Brand footer with newsletter signup
│   │   ├── Hero/                  # Floating hero product & parallax scroll
│   │   ├── ProductCard/           # 3D tilt perspective card with inline quantity pill
│   │   ├── CartDrawer/            # Slide-in cart panel
│   │   ├── CartToast/             # Floating toast notification with slide-off
│   │   ├── IntroLoader/           # First-load logo zoom reveal overlay
│   │   └── ScrollProgressBar/     # Top golden scroll progress bar
│   ├── data/
│   │   └── products.json          # 13 typed product catalog items
│   ├── lib/
│   │   └── getProducts.ts         # Data access abstraction layer
│   ├── store/
│   │   ├── cartStore.ts           # Zustand cart store
│   │   └── wishlistStore.ts       # Zustand wishlist store
│   └── types/
│       └── product.ts             # Product TypeScript interface
└── next.config.ts                 # Next.js configuration
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ADI-2707/meadowmist.git
cd meadow_mist
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
npm run start
```

---

## 📄 License

Created for **Meadow Mist** — Handcrafted Candles & Ceramic Home Décor. All rights reserved.
