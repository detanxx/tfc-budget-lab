# TFC App Design System

This is the design reference for TFC Budget Lab. Use it for all new UI and changes to existing UI.

## Brand / feel
Friendly, modern, youthful and educational. Polished but not corporate. Designed primarily for teenagers, parents and facilitators.

## Colours
| Role | Colour |
| --- | --- |
| Primary Navy | #1A1A57 |
| Deep Indigo | #161633 |
| Coral / Primary CTA | #F9735C |
| Aquamarine / Success | #6ED9B3 |
| Mustard / Highlight | #FCD34D |
| Background | #FBF6EE |
| Secondary Background | #F2E9DD |
| Light Neutral | #E2E2EB |

## Typography
Use one font family throughout the product. Preferred: Inter or a similar clean sans-serif.

| Style | Size / weight |
| --- | --- |
| Page title | 32px / 700 |
| Section heading | 24px / 700 |
| Card heading | 18px / 600 |
| Body | 16px / 400 |
| Small text | 14px / 400 |

## Layout
Maximum content width: 1200px. Horizontal padding: desktop 32px, tablet 24px, mobile 16px.

Use the spacing scale: 4, 8, 16, 24, 32, 48, 64px.

## Component style
### Cards
- White or floral-white background
- 12px border radius
- 1px subtle neutral border
- Very light shadow
- 24px padding

### Primary button
- Coral #F9735C
- White text (see accessibility resolution below)
- 10px border radius
- Medium/semibold weight
- 44–48px minimum height

### Secondary button
- White/light background
- Navy border
- Navy text

### Inputs
- 44–48px height
- 8–10px border radius
- Neutral border
- Strong coral/navy focus state

## Navigation
Navy text, clear active state, no overly complex sidebars. Use the same header structure across applications where possible.

## Data visualization
Navy = primary data; aquamarine = positive; coral = warning/attention; mustard = secondary highlight. Always include text labels or symbols alongside colour.

Budget-specific mapping: income uses aquamarine with dark green text, expenses use coral with dark red text, savings use mustard with dark gold text, and investments use lavender with dark indigo text. Keep savings visibly distinct from income and spending.

## Accessibility
Maintain WCAG AA contrast. Do not communicate status through colour alone. All form fields must have labels. Buttons should have clear descriptive text. All controls and expandable More info explanations must work with a keyboard and show visible focus.

### Accessibility resolution
White text on #F9735C has approximately 2.7:1 contrast, below AA for normal text. Keep the exact brand coral for primary buttons and use Deep Indigo text (approximately 6.3:1) to meet the contrast requirement. This is the documented exception to the white-text specification.

## Responsive design
Verify at 375px mobile, 768px tablet, 1024px laptop, and 1440px desktop. Inputs and long labels must fit their containers. Stack fields on small screens and preserve at least 44px touch targets.

## Language
Use clear, teen-friendly language with practical examples. Put necessary finance definitions in expandable More info callouts beside the relevant controls. Keep account choices explicitly simulated and all amounts in Canadian dollars.
