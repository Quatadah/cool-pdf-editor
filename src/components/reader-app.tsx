import { lazy, Suspense, useEffect, useRef, useState } from "react"
import {
  ArrowUpRightIcon,
  FileTextIcon,
  LockKeyholeIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type BookData = {
  fileName: string
  title: string
  pages: string[]
}

type LoadState =
  | { kind: "idle" }
  | { kind: "loading"; fileName: string; page: number; total: number }
  | { kind: "ready"; book: BookData }

const MAX_FILE_SIZE = 80 * 1024 * 1024

const loadPdfBook = () => import("@/components/pdf-book")
const PdfBook = lazy(async () => ({
  default: (await loadPdfBook()).PdfBook,
}))

function Brand() {
  return (
    <div className="brand-lockup" aria-label="Folio">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="brand-name">Folio</span>
    </div>
  )
}

function PrototypeBook() {
  return (
    <div className="prototype-scene" aria-hidden="true">
      <div className="prototype-glow" />
      <div className="prototype-book">
        <div className="prototype-book__pages" />
        <div className="prototype-book__cover">
          <span className="prototype-book__kicker">A private library</span>
          <strong>Made to be held.</strong>
          <span className="prototype-book__rule" />
          <small>Folio Editions · No. 01</small>
        </div>
        <div className="prototype-book__spine">Folio</div>
        <div className="prototype-book__bookmark" />
      </div>
      <p>Drag the corner. Keep your place.</p>
    </div>
  )
}

async function renderPdf(
  file: File,
  onProgress: (page: number, total: number) => void
) {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const document = await loadingTask.promise
  const pageUrls: string[] = []
  const metadata = await document.getMetadata().catch(() => null)
  const info = metadata?.info as Record<string, unknown> | undefined
  const title = typeof info?.Title === "string" ? info.Title.trim() : ""

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(1.8, 1400 / baseViewport.width)
    const viewport = page.getViewport({ scale })
    const canvas = window.document.createElement("canvas")
    const context = canvas.getContext("2d", { alpha: false })

    if (!context) throw new Error("Canvas rendering is not available.")

    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, canvasContext: context, viewport }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Page rendering failed.")),
        "image/webp",
        0.9
      )
    })

    pageUrls.push(URL.createObjectURL(blob))
    page.cleanup()
    onProgress(pageNumber, document.numPages)
  }

  await document.cleanup()
  await loadingTask.destroy()
  return { pages: pageUrls, title }
}

export function ReaderApp() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [state, setState] = useState<LoadState>({ kind: "idle" })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    return () => {
      if (state.kind === "ready") {
        state.book.pages.forEach((page) => URL.revokeObjectURL(page))
      }
    }
  }, [state])

  const openFile = async (file?: File) => {
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Choose a PDF file.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("This PDF is over 80 MB. Choose a smaller file.")
      return
    }

    void loadPdfBook()
    setState({ kind: "loading", fileName: file.name, page: 0, total: 0 })

    try {
      const rendered = await renderPdf(file, (page, total) => {
        setState({ kind: "loading", fileName: file.name, page, total })
      })
      setState({
        kind: "ready",
        book: {
          fileName: file.name,
          title: rendered.title || file.name.replace(/\.pdf$/i, ""),
          pages: rendered.pages,
        },
      })
      toast.success("Your book is ready.")
    } catch (error) {
      console.error(error)
      setState({ kind: "idle" })
      toast.error("This PDF could not be opened.", {
        description: "Try exporting it again or choose a different file.",
      })
    }
  }

  const reset = () => {
    if (state.kind === "ready") {
      state.book.pages.forEach((page) => URL.revokeObjectURL(page))
    }
    if (inputRef.current) inputRef.current.value = ""
    setState({ kind: "idle" })
  }

  if (state.kind === "ready") {
    return (
      <Suspense fallback={null}>
        <PdfBook
          fileName={state.book.fileName}
          title={state.book.title}
          pages={state.book.pages}
          onChooseAnother={reset}
        />
      </Suspense>
    )
  }

  const loadingPercent =
    state.kind === "loading" && state.total > 0
      ? Math.round((state.page / state.total) * 100)
      : 6

  return (
    <main
      className="landing-shell"
      data-dragging={dragging || undefined}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void openFile(event.dataTransfer.files[0])
      }}
    >
      <header className="landing-header">
        <Brand />
        <div className="header-note">
          <LockKeyholeIcon aria-hidden="true" />
          Your PDF never leaves this device
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <Badge variant="secondary">
            <FileTextIcon data-icon="inline-start" />
            PDF, reimagined
          </Badge>
          <h1>
            Turn a PDF
            <br />
            into a <em>book.</em>
          </h1>
          <p>
            A tactile, distraction-free reader with real page depth, natural
            shadows, and the satisfying pull of paper beneath your finger.
          </p>

          {state.kind === "loading" ? (
            <div className="loading-panel" aria-live="polite">
              <div>
                <span>Building your book</span>
                <strong>{loadingPercent}%</strong>
              </div>
              <Progress value={loadingPercent} />
              <p>
                {state.page > 0
                  ? `Rendering page ${state.page} of ${state.total}`
                  : `Opening ${state.fileName}`}
              </p>
            </div>
          ) : (
            <div className="hero-actions">
              <Button size="lg" onClick={() => inputRef.current?.click()}>
                <UploadIcon data-icon="inline-start" />
                Choose a PDF
              </Button>
              <span>
                or drop it anywhere
                <ArrowUpRightIcon aria-hidden="true" />
              </span>
            </div>
          )}

          <p className="hero-footnote">
            Up to 80 MB · Rendered locally · Nothing uploaded
          </p>
        </div>

        <PrototypeBook />
      </section>

      <div className="drop-hint" aria-hidden={!dragging}>
        <div>
          <UploadIcon />
          <strong>Release to make your book</strong>
          <span>PDF files up to 80 MB</span>
        </div>
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="application/pdf,.pdf"
        style={{}}
        suppressHydrationWarning
        onChange={(event) => void openFile(event.target.files?.[0])}
      />
    </main>
  )
}
