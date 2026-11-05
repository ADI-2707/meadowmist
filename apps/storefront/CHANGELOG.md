# @meadowmist/storefront

## 0.4.0

### Minor Changes

- 96dd8bc: UI/UX enhancements, responsive layout, shared primitives, and performance optimizations:
  - Shared UI primitives: Skeleton with glowing shine, accessible Modal dialog, reusable Button, and unified Toast notification system
  - Centralized utilities: formatINR, formatDate, useDebounce, useThrottle, useAsyncLock, KeepAlive, and PostHogProvider
  - Storefront mobile & tablet: compact product cards with horizontal scroll, uniform sizing, centered category stories, and seamless BackToTop footer alignment
  - Modal migrations: OrderCancelModal, OrderInvoiceModal, and OrderReturnModal migrated to shared accessible Modal primitive
  - Seller performance & stability: root loading skeleton, global-error boundary, Next.js image optimization, and dynamic tab code-splitting
  - Server Component compatibility: added 'use client' directives and sideEffects false to shared package

### Patch Changes

- 4c5cce4: Fix initial home page flash before welcome animation:
  - Add synchronous anti-flicker script in root layout to set intro-pending state before initial paint
  - Set viewport background and hide main content during intro-pending state
  - Render static backdrop and synchronize intro-pending state removal with zoom animation stage
  - Support instantaneous render for returning visitors and users with prefers-reduced-motion
  - Add comprehensive unit test coverage for IntroLoader lifecycle and dismissal
- Updated dependencies [96dd8bc]
- Updated dependencies [175d235]
  - @meadowmist/shared@0.2.0

## 0.3.0

### Minor Changes

- ce92ec8: Storefront artisanal catalog, verified reviews with damage photo evidence, and 7-day return flow

## 0.2.0

### Minor Changes

- d719aa7: - Integrate dynamic CMS synchronization for hero banners, store settings, and FAQ accordions.
  - Add live customer reviews elevation on homepage and customer account review management tab.
  - Implement live store settings shipping fee calculations and free shipping threshold enforcement at checkout.
  - Implement database-backed newsletter subscription pipeline with customer feedback notifications.
  - Add comprehensive unit and integration tests across all newly introduced storefront components and API routes.
