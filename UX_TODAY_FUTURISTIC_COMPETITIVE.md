# UX_TODAY_FUTURISTIC_COMPETITIVE.md
# Competitive Design-Language Intelligence — May 2026

> Purpose: inform BAM-X "Today" page redesign direction.
> Research date: 2026-05-14.
> Products covered: Linear, Notion Calendar, Arc, Apple Vision Pro / Liquid Glass,
>   Stripe, Vercel, Apple Calendar / macOS Tahoe, Motion, Sunsama,
>   Pitch / Figma Slides, Raycast.

---

## 1. Per-Product Feature Matrix

### Linear (March 2026 UI refresh)

| Dimension | Detail |
|---|---|
| Typography | Inter Display for headings; Inter for body. Compact sizing; negative tracking at display scale. Warmer neutral baseline. |
| Color | Moved from cool blue-gray to warmer gray with minimal saturation. Brand accent purple-violet. User-selectable accent + contrast. Light + dark both shipped; dark preferred by power users. |
| Depth | Near-flat. Borders softened, rounded further. Shadows largely removed. Sidebar dimmed (luminance hierarchy: chrome recedes, content dominates). |
| Motion | Not a signature strength. Transitions fast and unobtrusive. No theatrical animation. |
| Customization | User selects base mode (light/dark), accent color, contrast level. Comment-send behavior configurable. Internal design-token color picker (not user-facing). |
| Signature | "Calmer interface" principle: chrome explicitly designed to disappear. Sidebar is intentionally dimmer than content — luminance hierarchy formalized as a principle. |

### Notion Calendar (formerly Cron, 2025-2026)

| Dimension | Detail |
|---|---|
| Typography | NotionInter (custom Inter variant). Dramatic typographic scale: 64px H1 at weight 700, -2.125px letter-spacing. 5.3:1 ratio between H1 and H2 — far more extreme than typical 2-3:1. |
| Color | White-default; neutral palette with sparse color. Calendar items carry source color (Google Cal integration colors dominate). Restrained own-UI color. |
| Depth | Essentially flat. Calendar grid geometric and precise — "Swiss precision." |
| Motion | Keyboard-first: 'S' to schedule, command menu. Transitions fast but unremarkable. |
| Customization | Light/dark toggle in Settings > Calendar > General. Database views selectable per calendar. Color schemes configurable per Notion database view. |
| Signature | Extreme typographic scale contrast as primary expressive lever — not color, not depth. Dramatic H1-to-body ratio signals "time is important" without decoration. |

### Arc Browser (maintenance mode since May 2025; acquired by Atlassian Sept 2025)

| Dimension | Detail |
|---|---|
| Typography | Purposeful sans-serif; SF Pro on macOS. Chrome type subordinate; page content dominates. |
| Color | Sidebar takes user's chosen workspace color (full hue freedom). Content area neutral. Dark-first launch. |
| Depth | Subtle borders instead of shadows. Luminance hierarchy. Sidebar as ambient colored container rather than structural element. |
| Motion | Two-finger swipe Space switching — gesture-native, no button tap required. Smooth, app-like transitions. |
| Customization | Workspaces with distinct colors and tab sets. Boosts (per-site CSS/JS overrides). Full keyboard shortcut remapping. User-chosen themes per Space. |
| Signature | Color-as-context: each workspace is a distinct ambient color. Chrome BECOMES the context signal, not content labels. No other browser or productivity tool does this at this fidelity. |

> Arc is frozen. Design lessons remain valid; product is a dead reference.

### Apple Liquid Glass / visionOS influence (iOS 26 / macOS Tahoe 26, June 2025)

| Dimension | Detail |
|---|---|
| Typography | SF Pro / SF Compact. Type now layered on translucent materials — contrast handled by material refracting surrounding color. |
| Color | System-adaptive. Liquid Glass material takes hue of what's behind it. Controls shift warm/cool based on wallpaper. |
| Depth | **The era-defining depth story.** Liquid Glass: real-time rendered, refracts and reflects surroundings, specular highlights on movement. Evolved from visionOS glass panels. Apple fabricated physical glass samples to match digital material properties. |
| Motion | Specular highlights animate on pointer proximity and window movement. Glass panels shift color as content scrolls behind. Real-time rendering. |
| Customization | Icon appearance: clear look, light tint, dark tint, colorful tint. Widget depth configurable. Menu bar transparency. Dark/light/adaptive. |
| Signature | OS-level glass material that responds to real content behind it in real-time. Reference all flat-screen products will be compared against for next 2-3 years. |

### Stripe (dashboard 2025-2026)

| Dimension | Detail |
|---|---|
| Typography | Sohne-var (variable weight). Weight 300 for all display and large heading typography. Single typeface entire system. |
| Color | Clean white base + single vibrant violet for actions/CTAs. Highly descriptive gradients in hero and product showcase. Accessible color update: all text/icon colors meet contrast. |
| Depth | Moved AWAY from cards. Card-less dashboard. Subtle shadows on key elements only. "No heavy card edges." |
| Motion | Not a motion-first brand. Data clarity dominates over animation. |
| Customization | Low user customization — Stripe's aesthetic IS the product signal. Developer-facing Stripe Elements allow checkout styling. |
| Signature | Card-less layout — removing all card containers from a complex financial dashboard. Information organized by semantic sections, not visual boxes. Feels more like editorial design than SaaS. |

### Vercel (dashboard; Geist system; sidebar redesign Feb 2026)

| Dimension | Detail |
|---|---|
| Typography | **Geist Sans** (custom, open-source; inspired by Inter, Univers, SF Pro). **Geist Mono** for code. **Geist Pixel** (bitmap-grid) for expressive technical brand moments. Three-register type system. |
| Color | Dark-first. Near-black surfaces. Accent: white + brand green for deploy success. Minimal palette — monochrome with function-color only. |
| Depth | Flat with functional shadow. No glassmorphism. Borders define hierarchy. Sidebar collapsible to full-screen content mode. |
| Motion | Functional micro-interactions on deploy status. No decorative animation. |
| Customization | Light/dark toggle (system-adaptive default). Sidebar collapse. Mobile: floating bottom bar for one-handed use. Projects-as-filters navigation. |
| Signature | Three-register type system: Sans for prose, Mono for data/code, Pixel for expressive identity moments. No other productivity dashboard uses a bitmap-inspired typeface as identity layer. |

### Apple Calendar (macOS Sequoia / Tahoe 26)

| Dimension | Detail |
|---|---|
| Typography | SF Pro. Calendar numerals are key expressive element — large date numbers anchor the grid. |
| Color | Calendar color per source. Today highlight is system accent color. Tahoe adds Liquid Glass materials to chrome: sidebar, toolbar are now glass. |
| Depth | Liquid Glass in toolbar and sidebar (Tahoe). Translucent panels. Widget support with configurable depth. |
| Motion | Smooth month/week transitions. Day number animation when crossing midnight in widget. |
| Customization | Calendar color per source. Time zone display. Show/hide declined events. Week number display. Default alert times. Limited compared to third-party tools. |
| Signature | Material-aware calendar chrome: sidebar and toolbar refract desktop wallpaper color. A calendar that literally reflects its environment. |

### Motion (usemotion.com; 2025-2026)

| Dimension | Detail |
|---|---|
| Typography | Standard modern sans-serif; not a typographic brand. UI is functional over expressive. |
| Color | Light default. Blue as primary action color. Color on calendar = task urgency / project assignment. |
| Depth | Flat with light card elevation. Standard SaaS visual vocabulary. |
| Motion | Ironically not motion-forward for a product called Motion. The AI re-planning moment is the signature interaction — not animated dramatically. |
| Customization | Redesigned navigation (Dec 2025). Bulk task editing. Calendar integrations. AI scheduling preferences. No deep visual customization. |
| Signature | The autonomous re-planning event: when Motion re-slots tasks, the calendar visibly rewrites itself. Product's core value expressed as UI behavior — not visual design. |

> Motion ($60M Series C, Dec 2025, $550M valuation) is an AI-behavior product wearing SaaS-standard visual clothes.

### Sunsama (2025-2026)

| Dimension | Detail |
|---|---|
| Typography | Clean, restrained sans-serif. Not a typographic brand statement. |
| Color | Warm, minimal palette. Light default. Intentionally calm — no aggressive accent colors. |
| Depth | Flat. No material effects. The calm IS the feature. |
| Motion | Smooth drag-and-drop. Minimal transitions. Mindful positioning means deliberate slowness in animation. |
| Customization | Moderate: integrations, color coding, tagging, keyboard shortcuts. 2026 calendar is new Timeboxing 2.0 view. No theme or color scheme customization. |
| Signature | Intentional restraint as brand identity. Sunsama is the product that deliberately refuses to be visually exciting — "mindful" positioning carried entirely in design quietness. Counter-trend. |

### Pitch (Pitch 2.0; 2025)

| Dimension | Detail |
|---|---|
| Typography | Bold, gestural type. Large confident display type as primary expression. Variable weight usage. Single-typeface multi-weight hierarchy. |
| Color | Works across all colors (tool for other people's brands). Own UI is neutral canvas — dark canvas mode for focused work. Transparent/shadow-ring borders that blend into dark backgrounds. |
| Depth | Canvas-metaphor depth: slides feel like objects on a workspace surface. Shadow rings instead of borders allow dark slide backgrounds. |
| Motion | Real-time collaborative cursors (Figma-style presence). Smooth transition between slides. |
| Customization | Templates (limited vs Canva). Live polls, clickable prototypes embedded in slides. Export to every format. |
| Signature | Transparent border system: borders become shadow rings, so any slide background color (including black) works without visible edge artifacts. |

### Raycast (Raycast 2.0 public beta, May 2026)

| Dimension | Detail |
|---|---|
| Typography | Inter with tight negative tracking at display sizes (-0.11em at 56px). Two-register system: compressed headlines / loose positive tracking on micro labels. |
| Color | **#040506** near-void dark background. UI surfaces as barely-lighter charcoal strata — no conventional card backgrounds. Brand red (#FF6363) as logo/status accent only (not CTA). Primary actions: near-white (#E6E6E6) pill on black. Radial blue/purple gradients at very low opacity create effect of colored light sources behind dark canvas. |
| Depth | "Frozen obsidian" aesthetic: dark glass. Radial gradients simulate light sources. Vibrant gradient accents pop against the void. Under 50ms activation on Apple Silicon — speed itself is a depth signal. |
| Motion | Sub-50ms activation. Speed IS the motion signature. Command palette types and filters at keystroke speed. |
| Customization | Full theme system (community themes). AI provider choice per user. Extension API rebuilt in 2.0. macOS + Windows 2.0 (first time). Per-extension configuration. |
| Signature | Near-void dark + colored light-source gradients: aesthetic feels like a terminal that learned to glow. No other productivity tool uses #040506 as base. |

---

## 2. Cross-Cutting 2026 Design Trends

These are signals of "current" in mid-2026. If your product lacks them, it reads as 2023.

### T1 — Attention Hierarchy Through Luminance, Not Weight
Linear, Arc, Vercel, Raycast use luminance differential rather than borders/shadows. Navigation chrome dimmer than content. Result: content appears to float forward without depth effect.

### T2 — Warmer Neutral Palettes
Linear's 2026 refresh moved from blue-tinted grays to warmer grays. Sunsama (warm calm), Stripe (clean white), Apple (wallpaper-reactive materials carry warmth). Cool dark grays now read as "2022-era developer tool."

### T3 — Dark-First (But Not Dark-Only) With Semantic Adaptive Tokens
Raycast, Vercel, Arc, Linear all launched dark-first. 2026 signal is deeper: semantic color tokens that adapt rather than hard-coded dark/light pairs. Over 80% of mobile users keep dark mode on.

### T4 — Liquid Glass / Material Translucency Is The Platform Standard
Apple's Liquid Glass (June 2025) set platform-level expectation. Glassmorphism matured past "heavy blur" into: subtle translucent surfaces that reflect real content behind them, with specular highlights on interaction. Any blur effect that does NOT respond to underlying content reads as "old glassmorphism."

### T5 — Card-Less Information Architecture
Stripe eliminated cards. Linear eliminated heavy card containers. Vercel uses section-based layouts. Information organized by semantic section, spatial breathing room, typographic hierarchy — not visual boxes.

### T6 — Dramatic Typographic Scale As Primary Visual Lever
Notion Calendar's 5.3:1 H1-to-H2 ratio, Pitch's gestural display type, Raycast's -0.11em negative tracking. Typography doing work that icons and illustration used to do.

### T7 — Single Custom Typeface as Brand Anchor
Vercel (Geist), Stripe (Sohne-var), Notion Calendar (NotionInter), Raycast (Inter with custom tracking). Premium move is named custom or heavily-customized typeface signaling investment in brand craft.

### T8 — Functional Motion, Not Decorative Motion
Across all 11 products, theatrical animation absent or minimal. Motion serves: feedback, state transition, spatial orientation. Raycast's speed IS its motion signature.

---

## 3. Customization Patterns Survey

| Product | Settings Location | Customization Depth |
|---|---|---|
| Linear | Preferences modal + theme picker in sidebar | Medium: mode, accent, contrast, send-key |
| Notion Cal | Settings > Calendar > General | Low-medium: theme, database views, colors per source |
| Arc | Settings + per-Space sidebar customization | High: themes, Boosts, shortcuts, workspace color |
| Apple System | System Settings > Appearance; per-app options | Medium: appearance, accent, icon look |
| Stripe | Minimal (brand-controlled aesthetic) | Low: developer-facing Elements only |
| Vercel | Profile settings + sidebar collapse toggle | Low-medium: light/dark, layout |
| Motion | Settings > Scheduling + integrations | Medium: AI preferences, integrations |
| Sunsama | Sidebar settings | Medium: integrations, colors per project |
| Raycast | Raycast Preferences + Extension configs | High: themes, AI providers, per-extension |

### What Dimensions Are Configurable? 2026 Pattern
1. Dark/light/adaptive mode — table stakes
2. Accent color — becoming common; still differentiating
3. Layout density (compact/comfortable) — emerging
4. Typography weight/size — rare in workflow tools
5. Per-context color (project, calendar source) — standard in calendar tools
6. Theme (full palette override) — Raycast does this fully
7. Component visibility (show/hide sidebar items) — Vercel, Raycast, Linear all do this
8. AI behavior preferences — emerging (Motion, Raycast)

### The Default Matters Most
The default is what 90% of users see. Raycast's default dark void is a brand statement. Sunsama's default warm minimal is a brand statement. Customization options are table stakes — the **default** is the design.

---

## 4. Dark Mode Survey

| Product | Default Mode | Notes |
|---|---|---|
| Linear | Light default (2026 refresh) | Power users run dark; adaptive option |
| Notion Cal | Light default | Toggle in settings |
| Arc | Dark-first | Now frozen; design choice was dark |
| Apple System | Adaptive (follows system) | Liquid Glass adapts to wallpaper color |
| Stripe | Light | Brand identity is white + violet |
| Vercel | Dark default | Geist is dark-native |
| Motion | Light default | Standard productivity tool default |
| Sunsama | Light default | Warmth is the brand; dark would break it |
| Raycast | Dark (no choice — IS the aesthetic) | Themes add variation but all dark-based |

### Reading for BAM-X
Developer/technical tools (Vercel, Raycast) default dark. Productivity/calendar/scheduling tools (Linear, Notion Cal, Motion, Sunsama) default light. BAM-X is hybrid: workflow execution tool with strong visual identity. **Light default with polished dark is right call for broad adoption — but dark must be first-class, not afterthought.**

Strong "Phil's colors" perform differently by mode. Saturated colors on white tend to read as energetic and clear. Same colors on dark (#040506 Raycast-style) read as glowing and premium. Neither is wrong; they signal different things.

---

## 5. Innovation Patterns Survey

One thing each product does that no competitor copies:

- **Linear**: Chrome luminance hierarchy formalized as a principle
- **Notion Calendar**: 5.3:1 typographic scale ratio
- **Arc**: Color-as-workspace-context — sidebar hue tells you which "Space"
- **Apple Liquid Glass**: Real-time glass material refracting actual live content
- **Stripe**: Full card elimination from complex financial dashboard
- **Vercel**: Three-register type system (Sans / Mono / Pixel)
- **Raycast**: Near-void #040506 base with colored radial light-source gradients
- **Motion**: AI re-planning event as UI behavior (not visual design)
- **Sunsama**: Intentional visual restraint as competitive positioning
- **Pitch**: Shadow-ring borders adapting to any background color including black
- **Figma Slides**: Live polls and clickable prototypes embedded in presentation mode

---

## 6. Top 5 Patterns BAM-X Should Adopt

### P1 — Luminance Hierarchy as a Structural Principle
Fit-to-positioning: High. Risk: Low.
Formalize that chrome (header, sidebar, navigation) is always dimmer than content. The Today hour-grid should be brighter than chrome around it. Costs nothing; immediately signals "calmer, more modern."

### P2 — Semantic Adaptive Dark Mode (Not Just Color Inversion)
Fit-to-positioning: High. Fit-to-customizability: High. Risk: Medium.
Dark mode using semantic tokens — not hard-coded hex pairs — so same token "surface-elevated" becomes warm charcoal in dark and cool white in light. Foundation for Phil's-colors-translate-to-dark requirement.

### P3 — Dramatic Typographic Scale in Today Header
Fit-to-positioning: High. Risk: Low.
Adopt Notion Calendar's principle: today's date should be at scale that feels like newspaper masthead. If "Thursday, May 14" is 14px it reads as chrome. At 48px+ with weight 700 and -1px tracking it reads as "this moment matters." Cheapest innovation-signal available.

### P4 — Accent Color Customization with System-Level Token Architecture
Fit-to-positioning: Medium. Fit-to-customizability: Very High. Risk: Medium.
Linear and Arc both allow user-selected accent colors propagating through interface via design tokens. For BAM-X: one accent token touches CTAs, active states, time-block color, today highlight. User picks color; system propagates.

### P5 — Card Elimination in Dense List Areas
Fit-to-positioning: High. Risk: Low.
Following Stripe and Linear: remove card containers from task lists and backlog items. Use section spacing, typographic weight, and a single left-border accent instead. Today page backlog and activity list candidates.

---

## 7. Top 3 Anti-Patterns to Avoid

### A1 — Heavy Glassmorphism on Functional Elements
Blur effects on task cards, event blocks, or input areas kill readability and slow perceived performance. Glass belongs on chrome overlays (modals, tooltips, sidebars) — NOT on primary content surface.

### A2 — Kinetic Typography / Animated Headlines
Animated, morphing text headers (a 2026 trend in marketing/editorial) are deeply inappropriate for a workflow tool. Motion in BAM-X must always serve: state change, feedback, spatial orientation.

### A3 — The "Dark Galaxy" Aesthetic Without the Speed Budget
Raycast's near-void dark works because product activates in <50ms. A calendar/scheduler that opens slowly in dark void reads as broken, not premium.

---

## 8. What BAM-X Already Exceeds

- **Motion-style week-grid hour blocking** (Sprint 15) — ahead of most competitors
- **Duration and time-range display on activity blocks** (Sprint 16a) — ahead of Notion Calendar, Apple Calendar, Motion
- **Configurable start-time editing inline** (Sprint 14) — ahead of Sunsama and Motion (both route through settings panels)

### Lags
- Dark mode token architecture — most important gap relative to where field is in 2026
- Accent color customization — Linear, Arc, Apple all do this; BAM-X doesn't

---

## 9. The "Futuristic vs Workflow Tool" Tension

### Products That Resolve It Gracefully
- **Raycast**: futuristic aesthetic AND <50ms performance. The aesthetic earns its intensity because experience delivers on speed.
- **Linear (2026 refresh)**: moved AWAY from futurism toward "calmer." Restraint is precise, not lazy. Calmer-but-precise is futurism of reduction.
- **Notion Calendar**: distinction through one typographic choice — extreme scale ratio. One dramatic element earns "feels considered" without distracting.

### Products That Fail It
- **Generic "glassmorphism dashboards"**: blur on content, neon accents on dark, used as aesthetic without functional grounding. Age immediately and visually confuse dense information.
- **Over-animated productivity tools**: tools animating state transitions theatrically delay user. 80ms slower per interaction × 50 interactions = 4 seconds lost to animation.

### The Core Tension Stated Plainly
Futurism in marketing-facing design (landing pages) appropriate. Futurism in workflow itself is a tax. Resolution pattern (Raycast, Linear, Notion Calendar): invest futurism-level craft into details of functional design (type scale, color tokens, luminance hierarchy) rather than into decorative effects.

**Phil's wish — "more futuristic, modern, innovative, customizable" — is NOT a positioning trap IF interpreted as: craft-level elevation of functional design, not surface decoration.**

The BAM-X upgrade path: dramatic typographic date header, semantic dark mode tokens, accent color customization, luminance hierarchy formalization. Zero of these are decorative. All are what best products in this field currently do. **That is the correct futurism for a workflow tool.**

---

## Sources

- https://linear.app/now/how-we-redesigned-the-linear-ui
- https://linear.app/changelog/2026-03-12-ui-refresh
- https://linear.app/now/behind-the-latest-design-refresh
- https://blog.logrocket.com/ux-design/linear-design/
- https://blakecrosley.com/guides/design/notion-calendar
- https://medium.com/design-bootcamp/arc-browser-rethinking-the-web-through-a-designers-lens-f3922ef2133e
- https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- https://en.wikipedia.org/wiki/Liquid_Glass
- https://www.macrumors.com/roundup/macos-26/
- https://uwux.medium.com/behind-the-gradient-design-at-stripe-476dcf61a51a
- https://vercel.com/changelog/dashboard-navigation-redesign-rollout
- https://vercel.com/font
- https://basement.studio/post/the-birth-of-geist-a-typeface-crafted-for-the-web
- https://raycast-discount-code.com/blog/raycast-2026-updates
- https://alternativeto.net/news/2026/5/raycast-launches-public-beta-with-new-ui-search-dictation-and-ai-upgrades/
- https://design-foundations.com/domains/www-raycast-com
- https://www.sunsama.com/blog/sunsama-2025-task-manager-roadmap
- https://max-productive.ai/ai-tools/motion-ai/
- https://pitch.com/blog/pitch-2-0-a-behind-the-scenes-look-at-the-products-redesign
- https://midrocket.com/en/guides/ui-design-trends-2026/
- https://www.wearetenet.com/blog/ui-ux-design-trends
