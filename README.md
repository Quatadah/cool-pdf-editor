# Folio

Folio turns a local PDF into a tactile, responsive 3D book. Pages are rendered in the browser and are never uploaded.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), choose a PDF, then drag or tap a page corner to read.

## Stack

- TanStack Start and React 19
- shadcn/ui with Radix UI primitives
- PDF.js for local page rendering
- StPageFlip through `react-pageflip` for the book interaction
- Tailwind CSS v4

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
