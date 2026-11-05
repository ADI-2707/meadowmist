---
"@meadowmist/storefront": patch
---

Fix initial home page flash before welcome animation:
- Add synchronous anti-flicker script in root layout to set intro-pending state before initial paint
- Set viewport background and hide main content during intro-pending state
- Render static backdrop and synchronize intro-pending state removal with zoom animation stage
- Support instantaneous render for returning visitors and users with prefers-reduced-motion
- Add comprehensive unit test coverage for IntroLoader lifecycle and dismissal
