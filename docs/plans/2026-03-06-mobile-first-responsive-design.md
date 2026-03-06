# Mobile-First Responsive Design

## Overview

Make the news aggregator frontend fully responsive using a mobile-first approach. Replace the fixed desktop sidebar with a bottom tab bar on mobile and restore the sidebar on desktop. Simultaneously replace the blue-based color palette with a warm brick/cream/teal palette.

## Color Palette

| Token | Hex | Role |
|---|---|---|
| `primary` | `#BF4646` | Active nav, buttons, links, primary accent |
| `surface` | `#EDDCC6` | Sidebar background, card borders, secondary surfaces |
| `background` | `#FFF4EA` | App background (replaces gray-50/gray-950 base) |
| `secondary` | `#7EACB5` | Secondary actions, hover highlights |

Dark mode retains existing dark grays but uses `#BF4646` as the primary accent.

## Layout

### Mobile (< lg)
- Sidebar is hidden (`hidden lg:flex`)
- Fixed bottom tab bar (`fixed bottom-0 inset-x-0 h-16`) with 4 nav icons: Dashboard, News, Bookmarks, Settings
- Main content area gets `pb-16` padding to clear the tab bar
- Profile/user accessible via a top-right avatar button in the page header or profile nav item

### Desktop (lg+)
- Full `w-64` left sidebar as today
- Bottom tab bar hidden (`lg:hidden`)
- No bottom padding on main content

## Components Changed

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `primary`, `surface`, `bg`, `secondary` color tokens; add dark shades for primary |
| `AppLayout.tsx` | Add `pb-16 lg:pb-0`; import and render `BottomNav` |
| `Sidebar.tsx` | Change background to `surface`, hide on mobile (`hidden lg:flex`) |
| `Sidebar.tsx` (colors) | Replace all blue/gray tokens with new palette |
| New: `BottomNav.tsx` | Fixed bottom nav bar, visible only on mobile (`flex lg:hidden`) |
| `ArticleCard.tsx` | Update primary color references |
| `ArticleList.tsx` | No layout changes needed (grid already responsive) |
| Auth pages | No changes needed (already mobile-friendly) |
| Global styles | Update body background to use new `bg` token |

## Breakpoints

Using Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px — this is the primary breakpoint for sidebar/bottom-nav switch

## Non-Goals

- No animated drawer/hamburger
- No icon-only collapsed sidebar at md
- No changes to backend, API, or data fetching
