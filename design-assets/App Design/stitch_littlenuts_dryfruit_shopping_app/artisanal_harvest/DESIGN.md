---
name: Artisanal Harvest
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#424846'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#737876'
  outline-variant: '#c2c8c5'
  surface-tint: '#52625d'
  primary: '#061512'
  on-primary: '#ffffff'
  primary-container: '#1b2a26'
  on-primary-container: '#81928c'
  inverse-primary: '#b9cac4'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#ffb149'
  on-secondary-container: '#704500'
  tertiary: '#001708'
  on-tertiary: '#ffffff'
  tertiary-container: '#002e15'
  on-tertiary-container: '#669974'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e6e0'
  primary-fixed-dim: '#b9cac4'
  on-primary-fixed: '#0f1e1b'
  on-primary-fixed-variant: '#3a4a45'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#b9efc5'
  tertiary-fixed-dim: '#9dd3aa'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#1e5031'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

The brand identity targets health-conscious, design-aware consumers seeking high-grade whole foods, daily dried fruits, and curated nuts. The aesthetic reflects an organic, tactile, and boutique grocery experience translated into a calm mobile commerce interface. It combines modern minimalism with warm, agrarian luxury: crisp typography, soft tactile cards, and grounded botanical palettes that avoid sterile pharmaceutical tropes or generic supermarket loudness.

The emotional tone balances trust, warmth, and quiet abundance. The UI draws primarily from contemporary organic minimalism: generous breathing room, ultra-soft pill and rounded-card silhouettes, warm neutral canvases evoking almond milk and raw parchment, paired with deep botanical contrast and harvest-inspired jewel accents.

## Colors

The palette is anchored by warm nut creams, deep botanical darks, and vibrant natural harvest accents:

- **Primary (`#1B2A26`)**: Deep Botanical Slate-Forest. Serves as the primary anchor for dominant CTA buttons, active state indicators, navigation elements, and primary text headers. Provides grounded contrast against warm cream surfaces.
- **Secondary (`#E59B34`)**: Warm Honey Amber. Utilized for energetic micro-interactions, "Add" button highlights, ratings, promotional tags, and checkout accents.
- **Tertiary (`#4A7C59`)**: Fresh Pistachio Green. Applied to dietary badges (Organic, Raw), freshness markers, stock status, and success confirmations.
- **Neutral Base (`#FAF7F2` & `#F3EFE6`)**: Warm Almond Cream and Oat canvas tones. Used as the main background and card surface tiers, replacing stark digital white with natural warmth.
- **Supportive Neutrals**: Muted hazelnut border strokes (`#E8E2D5`) and soft charcoal body text (`#3C4743`) to ensure high contrast and readability without severe black lines.

## Typography

The design system employs **Plus Jakarta Sans** across all roles to achieve a clean, warm, and contemporary European deli aesthetic. Its geometric clarity combined with subtle humanist curvature complements rounded product imagery and tactile container cards.

- **Headlines & Titles**: Styled with confident semibold and bold weights with slightly negative letter spacing to retain punch and focus on mobile viewports.
- **Body & Product Descriptions**: Kept at balanced regular weights with comfortable line heights, rendering dry fruit tasting notes, origin stories, and nutritional details effortlessly readable.
- **Labels & Badges**: Set in crisp medium-to-bold weights with uppercase or title casing, optimized for small-footprint badges (e.g., "ORGANIC", "ROASTED", "DAILY PACK").

## Layout & Spacing

Layouts adhere to an 8pt-based fluid mobile grid with an outer screen margin of `1.25rem` (20px) to maximize tactile thumb reach while keeping edge boundaries crisp. 

- **Grid Architecture**: Standard 2-column layout for product feeds, catalog browse, and discovery grids; single-column full-bleed card stacks for checkout, cart items, order tracking, and account settings.
- **Horizontal Flow**: Category chips, dietary tags, and daily recommendation carousels use edge-to-edge bleed scroll with snap points aligned to the `1.25rem` screen margin.
- **Vertical Rhythm**: Section groups separate by `space-xl` (32px), internal card padding defaults to `space-md` or `space-lg`, and inline metadata rests at `space-xs` and `space-sm`.

## Elevation & Depth

Visual hierarchy relies on soft tonal surface differentiation combined with ultra-diffused, warm ambient shadows rather than harsh drop shadows or technical blur layers:

- **Surface Tiers**: Base screens rest on Oat White (`#FAF7F2`). Card surfaces sit on Pure Warm Almond (`#FFFFFF` or `#FDFCF9`). Elevated sheets, bottom sheets, and floating sticky bars use clean opaque white with a subtle warm border (`#EFE9DE`).
- **Ambient Nut Tinting**: Shadows utilize an earthy slate-brown cast (`rgba(27, 42, 38, 0.05)`) with broad dispersion (blur radius 16px to 24px) to simulate daylight over natural surfaces.
- **Micro Outlines**: Secondary interactive targets and inactive pills utilize delicate 1px low-contrast strokes (`#E8E2D5`) to establish structure without visual clutter.

## Shapes

The shape system adopts smooth, organic curvature mirroring natural seeds, pods, and kernels. Standard components sit between `16px` and `24px` radius:

- **Product Cards**: Curvature set to `1.25rem` (20px) to cradle product imagery and contain price tags seamlessly.
- **Buttons & Filter Chips**: Fully rounded pill shapes (`9999px`) for category filters and primary CTA bars to enhance touch affordance and thumb friendliness.
- **Bottom Sheets & Modals**: Upper corners rounded at `1.5rem` (24px) to create an approachable presentation when drawn upwards.

## Components

### Buttons
- **Primary CTA**: Full-width or inline rounded pill (`rounded-full`), filled with Deep Botanical Forest (`#1B2A26`), white text (`#FFFFFF`), with an elevation of 0 for a modern flat tactile look or a subtle ambient glow on press.
- **Add to Cart / Quick Add**: Amber (`#E59B34`) or Botanical (`#1B2A26`) squared-pill icon button with a clean `+` glyph, sized at 36x36px for direct grid additions.
- **Secondary / Ghost**: Warm almond surface with a 1px border (`#E8E2D5`) and primary slate text for secondary actions.

### Badges & Category Chips
- **Product Badges**: Small rounded tags (`rounded-md`, 6px) placed over product images:
  - *Organic / Raw*: Pistachio tint background (`#EAF2EC`) with dark pistachio green text (`#386345`).
  - *Salted / Roasted*: Soft honey tint (`#FDF5E8`) with amber-brown text (`#B3721C`).
  - *Daily Pack*: Muted slate tint (`#E8ECEB`) with botanical dark text (`#1B2A26`).
- **Category Filter Chips**: Pill-shaped horizontal scrolls. Active state: `#1B2A26` with crisp white text. Inactive state: `#F3EFE6` or `#FFFFFF` with muted text and subtle border.

### Product Cards
- Contained within an elevated, warm-white container with `20px` corner radius.
- Upper zone reserved for floating badge and high-resolution nut/dried-fruit imagery centered on an off-white circular or soft pedestal tint.
- Lower zone features product title, net weight / daily portion size (e.g., `250g` or `Daily Satchel`), unit pricing, and a quick-add `+` button in the lower-right corner.

### Quantity Selectors
- Inline compact pill combining decrement (`-`), numerical count, and increment (`+`).
- Uses deep botanical `#1B2A26` background with white text or a segmented almond card container with amber action icons.

### Form Inputs & Search Bars
- Background filled with soft cream (`#F3EFE6`), zero border or ultra-soft border (`#E8E2D5`), `16px` radius.
- Left-aligned magnifying or input icons in muted slate (`#6B7A75`), with clean placeholder typography.
- Focused state transitions softly to a 1.5px `#1B2A26` boundary without harsh browser rings.

### Bottom Navigation Bar
- Grounded floating or docked tab bar with warm opaque backing (`#FFFFFF`), top boundary line (`#EFE9DE`), and minimalist botanical icons. Active tab highlighted in `#1B2A26` with a micro dot indicator underneath.