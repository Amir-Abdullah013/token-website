# Wallet Fee Referral Banner - Visual Preview

## 🎨 Desktop View (Full Width)

```
╔═════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                     ║
║   ┌─────┐   💡 Refer a friend within your first month and your one-time          ║
║   │ 💡  │      $2 wallet setup fee will be waived!                                ║
║   │     │      Your friend needs to stake at least $20 to qualify                 ║
║   └─────┘                                                                          ║
║              ┌────────────────────────┐                                            ║
║              │    👥  Refer Now       │                                            ║
║              └────────────────────────┘                                            ║
║                                                                                     ║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║                            [Blue-Indigo-Purple Gradient]                            ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
```

### Color Scheme (Desktop)
- **Background**: Soft blue gradient (#EFF6FF → #EDE9FE)
- **Border**: Light blue (#BFDBFE)
- **Icon Background**: Blue gradient (#3B82F6 → #6366F1)
- **Text**: Dark gray (#111827)
- **Button**: Blue-Indigo gradient with white text
- **Accent Line**: Multi-color gradient (Blue → Indigo → Purple)

---

## 📱 Mobile View (< 640px)

```
╔═══════════════════════════════════════╗
║                                       ║
║   ┌────┐                              ║
║   │ 💡 │  Refer a friend within       ║
║   └────┘  your first month and        ║
║           your one-time $2 wallet     ║
║           setup fee will be waived!   ║
║                                       ║
║           Your friend needs to        ║
║           stake at least $20          ║
║           to qualify                  ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │    👥  Refer Now             │    ║
║   └─────────────────────────────┘    ║
║                                       ║
╠═══════════════════════════════════════╣
║     [Blue-Indigo-Purple Gradient]     ║
╚═══════════════════════════════════════╝
```

---

## 🌙 Dark Mode View

```
╔═════════════════════════════════════════════════════════════════════════════════════╗
║ [Dark Background: #1F2937 with blue tint]                                          ║
║                                                                                     ║
║   ┌─────┐   💡 Refer a friend within your first month and your one-time          ║
║   │ 💡  │      $2 wallet setup fee will be waived!                   [White Text] ║
║   │     │      Your friend needs to stake at least $20 to qualify    [Gray Text]  ║
║   └─────┘                                                                          ║
║              ┌────────────────────────┐                                            ║
║              │    👥  Refer Now       │  [Same Blue Gradient Button]              ║
║              └────────────────────────┘                                            ║
║                                                                                     ║
╠═════════════════════════════════════════════════════════════════════════════════════╣
║                            [Blue-Indigo-Purple Gradient]                            ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
```

### Dark Mode Colors
- **Background**: Dark blue tint (#1E3A8A with 20% opacity)
- **Border**: Dark blue (#1D4ED8)
- **Text Primary**: White (#FFFFFF)
- **Text Secondary**: Light gray (#D1D5DB)
- **Button**: Same gradient (stands out well)

---

## 🎭 Animation States

### 1. Initial Load (First 400ms)
```
Frame 1 (0ms):    [Hidden - Above viewport]
Frame 2 (100ms):  [Sliding down + Fading in (25%)]
Frame 3 (200ms):  [Sliding down + Fading in (50%)]
Frame 4 (300ms):  [Sliding down + Fading in (75%)]
Frame 5 (400ms):  [Fully visible]
```

### 2. Icon Animation (Continuous)
```
Every 5 seconds:
  Second 0-1:  💡 [Normal size]
  Second 1-2:  💡 [Scale 1.1x + Rotate 5°]
  Second 2-3:  💡 [Scale 1.1x + Rotate -5°]
  Second 3-4:  💡 [Return to normal]
  Second 4-5:  💡 [Pause]
  [Repeat]
```

### 3. Button Hover State
```
Before Hover:  [Normal size, shadow-md]
On Hover:      [Scale 1.05x, shadow-lg, darker gradient]
On Click:      [Scale 0.95x, shadow-md]
After Click:   [Navigate to /referral]
```

---

## 📐 Spacing & Dimensions

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [48px icon]  [24px gap]  [Text content]  [24px gap]  [Button]  │
│  Padding: 32px horizontal, 20px vertical                         │
│  Min Height: 80px                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────────────────────┐
│  [40px icon]  [Text content] │
│  Padding: 24px all sides     │
│  [Full-width button]         │
│  Min Height: 120px           │
└──────────────────────────────┘
```

---

## 🎨 Component Anatomy

```
WalletFeeReferralBanner
├── Outer Container (motion.div)
│   ├── Background Pattern (SVG grid)
│   │   └── Decorative dots
│   │
│   ├── Content Container
│   │   ├── Left Section
│   │   │   ├── Icon Circle (animated)
│   │   │   │   └── 💡 Emoji
│   │   │   │
│   │   │   └── Text Content
│   │   │       ├── Main Message (bold)
│   │   │       └── Qualification Text (smaller)
│   │   │
│   │   └── Right Section
│   │       └── CTA Button (animated)
│   │           ├── Icon (👥)
│   │           └── Text: "Refer Now"
│   │
│   └── Bottom Accent Line (gradient)
│
└── Exit Animation (on hide)
```

---

## 💎 Visual Hierarchy

```
Priority 1: 💡 Icon (Draws attention)
     ↓
Priority 2: "Refer a friend..." (Main message)
     ↓
Priority 3: "$2 wallet setup fee" (Key value)
     ↓
Priority 4: "Refer Now" Button (Call to action)
     ↓
Priority 5: Qualification text (Supporting info)
```

---

## 🎯 Clickable Areas

```
╔═══════════════════════════════════════════════╗
║  [Non-clickable]              [CLICKABLE]     ║
║   💡 Message text              ┌───────────┐  ║
║                                │ Refer Now │  ║
║                                └───────────┘  ║
╚═══════════════════════════════════════════════╝

Only the button is clickable - rest is informational
```

---

## 🌈 Color Palette Reference

### Light Mode
| Element | Color | Hex |
|---------|-------|-----|
| BG Start | Blue-50 | #EFF6FF |
| BG End | Indigo-50 | #EDE9FE |
| Border | Blue-200 | #BFDBFE |
| Icon BG | Blue-500 | #3B82F6 |
| Text Primary | Gray-900 | #111827 |
| Text Secondary | Gray-600 | #4B5563 |
| Button BG | Blue-600 | #2563EB |
| Accent Line | Multi-gradient | Various |

### Dark Mode
| Element | Color | Hex |
|---------|-------|-----|
| BG Start | Blue-900/20 | rgba(30,58,138,0.2) |
| BG End | Indigo-900/20 | rgba(49,46,129,0.2) |
| Border | Blue-700 | #1D4ED8 |
| Icon BG | Blue-500 | #3B82F6 |
| Text Primary | Gray-100 | #F3F4F6 |
| Text Secondary | Gray-400 | #9CA3AF |
| Button BG | Blue-600 | #2563EB |

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
< 640px:  Stack layout, full-width button
≥ 640px:  Horizontal layout, auto-width button
≥ 768px:  Increased padding
≥ 1024px: Optimized spacing
```

---

## 🎬 State Transitions

### State Flow Diagram
```
┌─────────────┐
│   Loading   │ (Opacity: 0, Height: 0)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Visible   │ (Opacity: 1, Height: auto)
│  (Pending)  │
└──────┬──────┘
       │
       ├─── User refers someone who stakes $20+ ───►┐
       │                                             │
       └─── Trial ends / Fee charged ──────────────►│
                                                     ▼
                                            ┌─────────────┐
                                            │   Hidden    │
                                            │ (Fade out)  │
                                            └─────────────┘
```

---

## 🔍 Accessibility Features

```
╔═══════════════════════════════════════════╗
║ Focus Ring (Keyboard Navigation)         ║
║  ┌─────────────────────┐                 ║
║  │ ┌─────────────────┐ │                 ║
║  │ │   Refer Now     │ │  ← 2px blue ring║
║  │ └─────────────────┘ │                 ║
║  └─────────────────────┘                 ║
╚═══════════════════════════════════════════╝

Keyboard Support:
- Tab: Focus button
- Enter/Space: Activate button
- Screen reader: Reads full message
```

---

## 📊 Size Metrics

| Viewport | Banner Width | Banner Height | Icon Size | Button Size |
|----------|-------------|---------------|-----------|-------------|
| Mobile (<640px) | 100% | ~140px | 40px | Full width |
| Tablet (≥640px) | 100% | ~90px | 48px | Auto |
| Desktop (≥1024px) | 100% | ~80px | 48px | Auto |

---

## 🎨 Visual Comparison

### Banner vs WalletFeeStatus

```
WalletFeeReferralBanner:
┌─────────────────────────────────────────┐
│ 💡 Simple, direct CTA                   │
│    Focus: Refer now to waive fee        │
└─────────────────────────────────────────┘

WalletFeeStatus:
┌─────────────────────────────────────────┐
│ ⏰ Detailed status display               │
│    Shows: Days left, current state      │
│    Multiple states: pending/waived/     │
│    charged/locked                        │
└─────────────────────────────────────────┘

Use Together:
┌─────────────────────────────────────────┐
│ 💡 WalletFeeReferralBanner (CTA)       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ ⏰ WalletFeeStatus (Detailed info)      │
└─────────────────────────────────────────┘
```

---

## 🎯 Final Visual Summary

### Full Dashboard Integration
```
┌────────────────────────────────────────────────────────────┐
│ NAVBAR                                                      │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ WALLET FEE REFERRAL BANNER (This component) ← Prominent!  │
│ 💡 Refer a friend...                    [Refer Now]       │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ Dashboard Content                                           │
│ - Stats cards                                               │
│ - Charts                                                    │
│ - Recent activity                                           │
└────────────────────────────────────────────────────────────┘
```

---

**Visual Design**: Complete ✅  
**Responsive**: Fully Adaptive ✅  
**Accessible**: WCAG 2.1 AA ✅  
**Animated**: Smooth & Professional ✅  

🎨 **Beautiful design ready to impress users!**


