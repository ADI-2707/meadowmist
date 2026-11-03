---
"@meadowmist/shared": minor
"@meadowmist/storefront": minor
"@meadowmist/seller": minor
---

UI/UX enhancements, responsive layout, shared primitives, and performance optimizations:
- Shared UI primitives: Skeleton with glowing shine, accessible Modal dialog, reusable Button, and unified Toast notification system
- Centralized utilities: formatINR, formatDate, useDebounce, useThrottle, useAsyncLock, KeepAlive, and PostHogProvider
- Storefront mobile & tablet: compact product cards with horizontal scroll, uniform sizing, centered category stories, and seamless BackToTop footer alignment
- Modal migrations: OrderCancelModal, OrderInvoiceModal, and OrderReturnModal migrated to shared accessible Modal primitive
- Seller performance & stability: root loading skeleton, global-error boundary, Next.js image optimization, and dynamic tab code-splitting
- Server Component compatibility: added 'use client' directives and sideEffects false to shared package
