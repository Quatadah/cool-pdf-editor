# Design QA — Paper book reader

## Visual target

- Source: `/var/folders/xx/mj2s6z_d3b331m885wc0crj80000gn/T/codex-clipboard-0bbcbf63-2f25-4fc0-9567-086125e44d6e.png`
- Target qualities: matte paper, warm cream stock, visible center gutter, large physical spread, restrained controls.

## Verified implementation

- Cover state: `design-qa-cover.png`
- Open spread, default viewport (1280 × 720): `design-qa-open.png`
- Open spread, reference viewport (2048 × 1229): `design-qa-open-reference-viewport.png`
- Side-by-side comparison: `design-qa-comparison.png`
- Test document: `/private/tmp/folio-sample.pdf` (4 pages)

## Findings and corrections

1. Replaced the glossy page treatment with a real seamless uncoated-paper texture, warm cream base, multiply grain, and lower-contrast shadows.
2. Added separate textured hard covers that use the embedded PDF title (falling back to the filename), plus a matching back cover.
3. Kept the title visible in the reader header after the book opens.
4. Added a persistent center gutter with a narrow separator and soft inward page shadows.
5. Centered the closed cover, enlarged the desktop spread to match the reference scale, and added height-aware scaling so the book is not cropped on laptop displays.
6. Reduced page-turn shadow opacity to avoid a plastic or lacquered appearance.
7. Re-tuned soft-page turns from the previous shortened snap to an approximately 850 ms physical settle, with a lower gesture threshold and lighter moving shadow.
8. Added synchronized local paper audio: a filtered fiber rustle during the fold and a soft contact sound when the page lands, with a persistent mute control.

## Final verification

- Cover title and page count: passed
- Open spread and center gutter: passed
- Cream paper texture and matte lighting: passed
- Responsive fit at 1280 × 720: passed
- Reference-size comparison at 2048 × 1229: passed
- Browser console errors: none
- Page-turn state and settle timing: passed
- Page-sound toggle and persisted enabled state: passed

## Rounded-spread iteration — 2026-07-23

- Source visual truth: `/var/folders/xx/mj2s6z_d3b331m885wc0crj80000gn/T/TemporaryItems/NSIRD_screencaptureui_COK1dX/Screenshot 2026-07-23 at 01.12.52.png`
- Source pixels: 1157 × 806.
- Implementation: `design-qa-rounded-spread.png` at 1157 × 806 CSS pixels and 1× density.
- Turning-state evidence: `design-qa-rounded-turning.png` at 1157 × 806 CSS pixels and 1× density.
- Same-size comparison: `design-qa-rounded-comparison.png`.
- State: pages 3–4 open; page 2 turning backward for occlusion verification.
- Full-view evidence: the page crowns rise gently away from the outer edges and dip into the spine, matching the annotated silhouette. The gutter reads as a recessed physical seam with the stronger shadow falling across the left leaf.
- Focused-region evidence: a separate crop was not necessary because the annotated top contour and full-height gutter remain clearly readable at the source's native 1157 × 806 size.
- Typography, copy, cream-paper color, and texture remain unchanged from the supplied app screenshot.
- Image assets remain the generated uncoated-paper and woven-cloth rasters; no asset substitution was introduced.

### Comparison history

1. Earlier P1: the page silhouette was a straight rectangle and the gutter rendered above the turning sheet.
2. Fix: applied mirrored shallow page crowns to soft leaves, moved the physical gutter behind the page stack, opened a narrow spine gap, and moved asymmetric gutter shadows onto the page surfaces.
3. Post-fix evidence: `design-qa-rounded-spread.png` shows the curved crown and recessed seam; `design-qa-rounded-turning.png` shows the turning sheet covering the seam instead of the seam drawing over the sheet.

### Final checks

- Rounded outer page silhouette: passed
- Center dip into the spine: passed
- Stronger left-leaf gutter shadow: passed
- Turning-page gutter occlusion: passed
- Browser console errors: none

final result: passed

## Persistent-cover and paper-control iteration — 2026-07-23

- Source visual truth: `/var/folders/xx/mj2s6z_d3b331m885wc0crj80000gn/T/codex-clipboard-1216bebb-f096-4152-bc91-dd453740a413.png` (2048 × 1245).
- Open-book evidence: `design-qa-cover-underlay.png` (1280 × 720 CSS pixels, 1× density).
- Paper-control evidence: `design-qa-paper-panel.png` (1280 × 720 CSS pixels, 1× density).
- Side-by-side comparison: `design-qa-cover-comparison.png`; the reference was center-cropped to 16:9 and normalized to 1280 × 720 before comparison.
- State: first PDF spread open, paper warmth at 0%, hard cover visible beneath all four page edges.
- Full-view evidence: the green cloth cover forms a continuous, shadowed perimeter beneath the open page block and retains a darker reinforced spine.
- Focused-region evidence: the open popover shows a functional warmth slider, a live percentage, explicit source-color guidance, and a reset action.

### Comparison history

1. Earlier P1: the open page block visually replaced the cover and the fixed cream filter altered the source PDF color.
2. Fix: added a persistent cloth-covered hardback underlay, changed the default page pipeline to unfiltered PDF colors, and moved warmth/texture into a persisted shadcn popover control.
3. Post-fix evidence: `design-qa-cover-underlay.png` shows the exposed cover perimeter; `design-qa-paper-panel.png` shows the neutral 0% default and working control.

### Final checks

- Cover visible behind open pages: passed
- Reinforced center spine beneath page block: passed
- Original PDF colors at 0% warmth: passed
- Warmth slider from 0–100%: passed
- “Use PDF colors” reset and persisted preference: passed
- Popover keyboard/accessible role state: passed
- Typecheck, lint, unit test, and production build: passed
- Visible browser runtime errors: none

final result: passed

## Travelling page-shadow iteration — 2026-07-23

- Turning-state evidence: `design-qa-travelling-shadow.png` and `design-qa-travelling-shadow-early.png` at 1280 × 720 CSS pixels and 1× density.
- State: automatic forward and backward turns captured while the soft leaf crosses the stationary spread.
- The cast shadow is driven by the flip engine's live fold position, angle, width, and direction; it is not a fixed animation overlay.
- The broader outer shadow now travels over the destination page while a tighter inner shadow remains attached to the fold.
- Shadow layers use multiply blending, a soft blur, and a restrained projected falloff so the page continues to read as matte paper.

### Final checks

- Shadow travels with page position: passed
- Shadow crosses the stationary leaf: passed
- Forward and backward direction handling: passed
- Shadow clears after page settles: passed
- Reduced-motion instant turn remains supported: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed

## Top-spine headband iteration — 2026-07-23

- Source visual truth: `/var/folders/xx/mj2s6z_d3b331m885wc0crj80000gn/T/TemporaryItems/NSIRD_screencaptureui_Uj86Np/Screenshot 2026-07-23 at 01.50.22.png` (1821 × 1298).
- Material asset: `public/textures/book-headband-source.png`, extracted from the supplied top-center binding detail with no document text retained.
- Open-spread evidence: `design-qa-headband-final.png` at 1280 × 720 CSS pixels and 1× density.
- Turning-state evidence: `design-qa-headband-turning.png` at 1280 × 720 CSS pixels and 1× density.
- Focused comparison: `design-qa-headband-comparison.png`; it contains only the top book edge and excludes the document's personal content.
- State: first spread open, then the following soft leaf crossing the top-center spine.

### Comparison history

1. Earlier P1: the curved page crowns met at an empty top-center notch, so the binding construction was missing.
2. Fix: placed a source-derived ribbed headband between the cloth cover and page layers, aligned to the center dip and blended into the existing cover material.
3. Post-fix evidence: the headband is visible only through the open crown, scales with the book, and is naturally hidden by a turning leaf.

### Final checks

- Ribbed binding visible at top-center curve: passed
- Placement tracks responsive book scaling: passed
- Layered behind stationary and turning paper: passed
- Material integrates with green cloth cover: passed
- Source crop contains no personal document text: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed

## Full-screen floating-reader iteration — 2026-07-23

- Open-spread evidence: `design-qa-fullscreen-reader-final.png` at 1280 × 720 CSS pixels and 1× density.
- Removed the fixed reader header and expanded the stage to the full `100svh` viewport.
- Replaced the header with independent floating controls: Open another at top-left, book identity at top-center, Paper at top-right, reading status at bottom-left, and page navigation at bottom-center.
- Increased the short-viewport book scale from 0.52 to 0.62 to use the reclaimed vertical space without colliding with controls.
- Verified the paper popover still opens from its floating trigger and preserves accessible dialog/slider state.

### Final checks

- No fixed navbar or reserved header row: passed
- Reader fills the complete viewport: passed
- Book remains the dominant visual surface: passed
- Floating controls avoid the page crown and one another: passed
- Mobile labels collapse to icon controls: passed
- Reduced-transparency and increased-contrast fallbacks: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed

## Reduced spread-scale iteration — 2026-07-23

- Source feedback: the full-screen spread in `Screenshot 2026-07-23 at 02.22.15.png` occupied too much of the viewport.
- Updated evidence: `design-qa-reduced-scale.png` at 1280 × 720 CSS pixels and 1× density.
- Reduced the tall-desktop book scale to 0.90, the compact desktop scale to 0.65, and the short laptop scale to 0.57.
- Updated the center-gutter height at each breakpoint so it remains aligned with the smaller page block.

### Final checks

- Additional breathing room on all four sides: passed
- Page, cover, headband, shadow, and gutter proportions preserved: passed
- Floating controls remain clear of the spread: passed
- Closed-cover centering remains consistent: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed

## Reader safe-area iteration — 2026-07-23

- Source feedback: `Screenshot 2026-07-23 at 02.26.21.png` showed a tall spread still touching the stage edges despite visual scaling.
- Final evidence: `design-qa-reader-safe-area-final.png`.
- Added a real pedestal safe area: 6.5–9rem above, 5–10rem on each side, and 8–11rem below on desktop.
- Lowered the tall-screen book cap to 0.78 and aligned the responsive gutter height with the padded page block.
- Compact desktop widths now collapse the instructional text while keeping the Ready state visible, preventing overlap with the bottom controls.

### Final checks

- Visible top, side, and bottom space around the spread: passed
- Tall PDFs cannot touch the stage boundary: passed
- Center gutter ends with the page block: passed
- Bottom status and page controls do not overlap: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed

## Vertical PDF tools iteration — 2026-07-23

- Final interaction evidence: `design-qa-pdf-tools.png`.
- Added a shadcn-based floating tool rail in the reserved left safe margin with Pointer, Add text, Sign PDF, and Undo actions.
- Text and typed signatures are placed at the exact clicked page coordinates and remain attached to their PDF page while the book turns.
- Annotation mode pauses page-turn gestures; Pointer and Done restore normal book physics immediately.
- The editing popover uses accessible fields, clear placement instructions, tooltips, active states, undo, and clear-all controls.

### Final checks

- Vertical rail remains separate from the page content: passed
- Text placement on either visible page: passed
- Signature placement with ink styling: passed
- Undo removes only the latest annotation: passed
- Annotations persist through forward and backward page turns: passed
- Pointer mode restores page turning: passed
- Typecheck, lint, unit test, and production build: passed

final result: passed
