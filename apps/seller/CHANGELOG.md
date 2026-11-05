# @meadowmist/seller

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

- 175d235: Refactor seller portal layout responsiveness, align topbar, integrate glowing shine skeletons, and delete obsolete css modules:
  - Align topbar with main content container using topbarInner to eliminate gaps on wide viewports
  - Refactor responsive grid layouts for tablets and large screens
  - Center form cards in settings and product forms to eliminate empty voids on wide screens
  - Integrate glowing shine skeletons for dashboard, order details, and settings loading states
  - Export formatINR alias in shared formatters and centralize currency formatting across seller tabs
  - Remove 5 obsolete unimported CSS modules
- Updated dependencies [96dd8bc]
- Updated dependencies [175d235]
  - @meadowmist/shared@0.2.0

## 0.3.0

### Minor Changes

- ce92ec8: Seller admin fulfillment queue, damage photo gallery, cancellation reason alert, and TOTP 2FA

## 0.2.0

### Minor Changes

- d719aa7: - Implement authenticated newsletter subscribers viewer API route for store administration.
  - Synchronize product inventory stock tracking with atomic order placement decrements and restock on cancellation.
  - Add review moderation workflows and customer relationship features.
  - Add comprehensive unit test coverage for newsletter subscribers API endpoint and authorization guards.
