---
name: FastLife
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e4e2e5'
  on-surface-variant: '#c5c6ce'
  inverse-surface: '#e4e2e5'
  inverse-on-surface: '#303033'
  outline: '#8e9098'
  outline-variant: '#44474e'
  surface-tint: '#b4c7ed'
  primary: '#b4c7ed'
  on-primary: '#1e304f'
  primary-container: '#0a1f3d'
  on-primary-container: '#7587ab'
  inverse-primary: '#4d5f80'
  secondary: '#84cfff'
  on-secondary: '#00344c'
  secondary-container: '#009ad7'
  on-secondary-container: '#002d42'
  tertiary: '#45dfa4'
  on-tertiary: '#003825'
  tertiary-container: '#002517'
  on-tertiary-container: '#009a6c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#b4c7ed'
  on-primary-fixed: '#061b39'
  on-primary-fixed-variant: '#354767'
  secondary-fixed: '#c7e7ff'
  secondary-fixed-dim: '#84cfff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6c'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#131316'
  on-background: '#e4e2e5'
  surface-variant: '#343537'
typography:
  display-timer:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin_mobile: 20px
---

## Brand & Style

The brand personality is rooted in "Scientific Precision meets Human Wellness." It avoids the aggressive, high-energy tropes of fitness apps in favor of a calm, clinical, and premium aesthetic that feels like a professional medical tool designed for daily life.

The design system utilizes a **Modern Corporate** foundation blended with **Glassmorphism**. This combination establishes trust through structured layouts while maintaining a high-end, futuristic feel through translucent layers and subtle background blurs. The interface must remain uncluttered to reduce cognitive load during fasting periods, using ample negative space to emphasize key biometric data and time-remaining metrics.

## Colors

The palette is built exclusively for a **Mandatory Dark Mode** experience. The primary Deep Blue (#0A1F3D) serves as the structural foundation, used for deep backgrounds and large containers to provide a sense of stability and depth. Cyan Blue (#3DB4F2) acts as the active "pulse" of the app, used for primary actions, active states, and focus elements.

Success states utilize Mint Green (#34D399) to provide a soft, positive reinforcement that contrasts against the deep blues without being jarring. Amber (#F59E0B) is reserved for critical alerts or transition periods (e.g., the final hour of a fast). Use Off-white (#F5F7FA) for high-readability text and subtle borders to maintain a premium, crisp finish.

## Typography

The typography system uses a dual-font approach to balance utility with a high-tech edge. **Inter** is the workhorse for the interface, providing exceptional legibility for French text, which often requires more horizontal space than English.

For the fasting timer and data-heavy metrics, **Space Grotesk** is used to evoke a technical, scientific feel. This font's geometric construction ensures that numerical digits remain perfectly aligned and legible at a glance. All headlines should utilize tighter tracking (letter-spacing) to maintain a cohesive, "locked-in" look, while labels use slightly expanded tracking for better scannability in dark mode.

## Layout & Spacing

This design system employs an **8px linear spacing scale** to ensure mathematical consistency across all components. The layout follows a **Fluid Grid** model, with a standard 16px gutter. Mobile views should maintain a 20px safe-area margin to give the content "breathing room."

Vertical rhythm is critical: use larger spacing increments (32px+) to separate distinct sections like the timer from the daily log, while using smaller increments (8px-16px) for internal card content. This creates a clear visual hierarchy where "fasting status" is the clear primary focus.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.

1. **Base Layer:** The deepest blue (#050F1D) acts as the canvas.
2. **Surface Layer:** Cards and containers use a slightly lighter blue (#0D2547) with a subtle 1px border (#F5F7FA at 10% opacity) to define edges.
3. **Glass Layer:** Floating elements (like navigation bars or active modals) use a background blur (20px-30px) and a semi-transparent Cyan fill at 5% opacity.

Shadows, where used for modals, should be diffused and tinted with the primary Cyan (#3DB4F2) at a very low opacity (15%) to create a "glow" effect rather than a black drop-shadow, reinforcing the app's luminescent dark-mode aesthetic.

## Shapes

The shape language is primarily **Rounded (Option 2)**. Standard cards and containers use a 1rem (16px) corner radius to feel approachable. Interactive elements like buttons and chips transition into a **Pill-shaped** (full-round) aesthetic to clearly distinguish them from informational containers.

The most prominent shape in the system is the **Circular Gauge**. This should be a geometric ring with a stroke thickness of 12px-16px, using rounded caps on the progress indicator to match the overall softness of the UI.

## Components

- **Pill Buttons:** Primary buttons are fully rounded, using a Cyan Blue gradient or solid fill with high-contrast text. Secondary buttons use a "ghost" style with a 1px border.
- **Circular Gauges:** Used for the main timer. The "unfilled" track should be the Deep Blue surface color, while the "filled" track uses a Cyan Blue to Mint Green gradient to indicate progress toward the goal.
- **Expandable Cards:** Default state shows high-level metrics (e.g., "Dernier repas"). Upon tapping, the card expands downward using a spring animation to reveal detailed scientific breakdowns of current metabolic states (Ketosis, Autophagy).
- **Iconography:** Use 1.5pt thin line icons. Icons should be monochrome Off-white or Cyan. Avoid filled icons unless they represent an active toggle state.
- **Glassmorphic Navigation:** A bottom navigation bar with a high-intensity backdrop blur, ensuring content remains visible but obscured as it scrolls beneath.
- **Input Fields:** Search and data entry fields should use a subtle inset shadow and the Surface Blue color to look "carved" into the interface, maintaining the sleek, professional look.
