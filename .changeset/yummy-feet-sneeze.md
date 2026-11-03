---
"@meadowmist/seller": patch
"@meadowmist/shared": patch
---

Refactor seller portal layout responsiveness, align topbar, integrate glowing shine skeletons, and delete obsolete css modules:
- Align topbar with main content container using topbarInner to eliminate gaps on wide viewports
- Refactor responsive grid layouts for tablets and large screens
- Center form cards in settings and product forms to eliminate empty voids on wide screens
- Integrate glowing shine skeletons for dashboard, order details, and settings loading states
- Export formatINR alias in shared formatters and centralize currency formatting across seller tabs
- Remove 5 obsolete unimported CSS modules
