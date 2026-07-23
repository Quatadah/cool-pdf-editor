import type { CSSProperties } from "react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  FileUpIcon,
  MousePointer2Icon,
  PaletteIcon,
  SignatureIcon,
  TypeIcon,
  Undo2Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import HTMLFlipBook from "react-pageflip"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { PaperSoundEngine } from "@/lib/paper-sound"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PageFlipApi = {
  flipNext: (corner?: "top" | "bottom") => void
  flipPrev: (corner?: "top" | "bottom") => void
  turnToNextPage: () => void
  turnToPrevPage: () => void
  turnToPage: (page: number) => void
}

type FlipBookHandle = {
  pageFlip: () => PageFlipApi
}

type PdfBookProps = {
  fileName: string
  title?: string
  pages: string[]
  onChooseAnother: () => void
}

type BookPageProps = {
  imageUrl: string
  index: number
  annotationTool: AnnotationTool
  annotations: PageAnnotation[]
  onPlaceAnnotation: (pageIndex: number, x: number, y: number) => void
}

type AnnotationTool = "none" | "text" | "signature"

type PageAnnotation = {
  id: string
  pageIndex: number
  type: Exclude<AnnotationTool, "none">
  text: string
  x: number
  y: number
}

const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage(
  { imageUrl, index, annotationTool, annotations, onPlaceAnnotation },
  ref
) {
  return (
    <div
      ref={ref}
      className="book-page"
      data-density="soft"
      data-page-side={index % 2 === 0 ? "right" : "left"}
    >
      <div className="book-page__paper">
        <img src={imageUrl} alt={`PDF page ${index + 1}`} draggable={false} />
        {annotations.map((annotation) => (
          <span
            key={annotation.id}
            className="book-page__annotation"
            data-annotation-type={annotation.type}
            style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
          >
            {annotation.text}
          </span>
        ))}
        {annotationTool !== "none" && (
          <button
            type="button"
            className="book-page__annotation-surface"
            aria-label={`Place ${annotationTool === "signature" ? "signature" : "text"} on page ${index + 1}`}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              const bounds = event.currentTarget.getBoundingClientRect()
              const x = ((event.clientX - bounds.left) / bounds.width) * 100
              const y = ((event.clientY - bounds.top) / bounds.height) * 100
              onPlaceAnnotation(index, x, y)
            }}
          />
        )}
        <span className="book-page__number" aria-hidden="true">
          {index + 1}
        </span>
      </div>
    </div>
  )
})

type BookCoverProps = {
  title: string
  pageCount: number
  side: "front" | "back"
}

const BookCover = forwardRef<HTMLDivElement, BookCoverProps>(function BookCover(
  { title, pageCount, side },
  ref
) {
  return (
    <div
      ref={ref}
      className="book-page book-cover"
      data-density="hard"
      data-cover-side={side}
    >
      <div className="book-cover__surface">
        {side === "front" ? (
          <>
            <span className="book-cover__edition">A Folio private edition</span>
            <strong>{title}</strong>
            <span className="book-cover__rule" />
            <small>{pageCount} pages · Rendered locally</small>
          </>
        ) : (
          <div className="book-cover__colophon">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <strong>Folio</strong>
            <small>Made to be held.</small>
          </div>
        )}
      </div>
    </div>
  )
})

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return reduced
}

const SOUND_PREFERENCE_KEY = "folio:page-sounds"
const PAPER_WARMTH_KEY = "folio:paper-warmth"

function usePaperSounds() {
  const engineRef = useRef<PaperSoundEngine | null>(null)
  const enabledRef = useRef(true)
  const [enabled, setEnabled] = useState(true)

  const getEngine = useCallback(() => {
    engineRef.current ??= new PaperSoundEngine()
    return engineRef.current
  }, [])

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(SOUND_PREFERENCE_KEY)
    if (storedPreference === "off") {
      enabledRef.current = false
      setEnabled(false)
    }

    return () => {
      void engineRef.current?.close()
    }
  }, [])

  const prime = useCallback(() => {
    if (!enabledRef.current) return
    void getEngine().prime()
  }, [getEngine])

  const playRustle = useCallback(() => {
    if (enabledRef.current) getEngine().playRustle()
  }, [getEngine])

  const playSettle = useCallback(() => {
    if (enabledRef.current) getEngine().playSettle()
  }, [getEngine])

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current
      enabledRef.current = next
      window.localStorage.setItem(SOUND_PREFERENCE_KEY, next ? "on" : "off")
      if (next) void getEngine().prime()
      return next
    })
  }, [getEngine])

  return { enabled, playRustle, playSettle, prime, toggle }
}

function IconAction({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function PdfToolAction({
  label,
  active,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-lg"
          variant={active ? "secondary" : "ghost"}
          aria-label={label}
          aria-pressed={active === undefined ? undefined : active}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function PdfBook({
  fileName,
  title,
  pages,
  onChooseAnother,
}: PdfBookProps) {
  const bookRef = useRef<FlipBookHandle | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [bookState, setBookState] = useState("Ready")
  const [paperWarmth, setPaperWarmth] = useState(0)
  const [annotationTool, setAnnotationTool] = useState<AnnotationTool>("none")
  const [annotationText, setAnnotationText] = useState("")
  const [signatureText, setSignatureText] = useState("")
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([])
  const reducedMotion = useReducedMotion()
  const {
    enabled: soundEnabled,
    playRustle,
    playSettle,
    prime: primePaperSound,
    toggle: togglePaperSound,
  } = usePaperSounds()
  const leafCount = pages.length + 2
  const pageMax = leafCount - 1

  useEffect(() => {
    const storedWarmth = Number(
      window.localStorage.getItem(PAPER_WARMTH_KEY) ?? 0
    )
    if (Number.isFinite(storedWarmth)) {
      setPaperWarmth(Math.min(100, Math.max(0, storedWarmth)))
    }
  }, [])

  const paperAppearance = useMemo(
    () =>
      ({
        "--paper-surface": `color-mix(in srgb, #ead9ad ${Math.round(
          paperWarmth * 0.72
        )}%, #ffffff)`,
        "--paper-texture-opacity": String(paperWarmth * 0.0028),
        "--paper-sepia": String(paperWarmth * 0.00075),
        "--paper-saturation": String(1 - paperWarmth * 0.00115),
        "--paper-contrast": String(1 - paperWarmth * 0.0003),
        "--paper-brightness": String(1 - paperWarmth * 0.00012),
      }) as CSSProperties,
    [paperWarmth]
  )

  const readableName = useMemo(
    () =>
      (typeof title === "string" ? title.trim() : "") ||
      fileName.replace(/\.pdf$/i, ""),
    [fileName, title]
  )

  const pageLabel = useMemo(() => {
    if (currentPage === 0) return "Cover"
    if (currentPage >= leafCount - 1) return "Back cover"
    return `${currentPage} / ${pages.length}`
  }, [currentPage, leafCount, pages.length])

  const isBookOpen = currentPage > 0 && currentPage < leafCount - 1

  const placeAnnotation = useCallback(
    (pageIndex: number, x: number, y: number) => {
      const text = (
        annotationTool === "text" ? annotationText : signatureText
      ).trim()
      if (annotationTool === "none" || !text) return

      setAnnotations((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          pageIndex,
          type: annotationTool,
          text,
          x: Math.min(96, Math.max(4, x)),
          y: Math.min(97, Math.max(3, y)),
        },
      ])
    },
    [annotationText, annotationTool, signatureText]
  )

  const goNext = useCallback(
    (instant = false) => {
      primePaperSound()
      const api = bookRef.current?.pageFlip()
      if (!api) return
      if (instant || reducedMotion) api.turnToNextPage()
      else api.flipNext("bottom")
    },
    [primePaperSound, reducedMotion]
  )

  const goPrevious = useCallback(
    (instant = false) => {
      primePaperSound()
      const api = bookRef.current?.pageFlip()
      if (!api) return
      if (instant || reducedMotion) api.turnToPrevPage()
      else api.flipPrev("bottom")
    },
    [primePaperSound, reducedMotion]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target?.matches("input, textarea, select") ||
        target?.isContentEditable
      ) {
        return
      }
      if (event.key === "ArrowRight") goNext(true)
      if (event.key === "ArrowLeft") goPrevious(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [goNext, goPrevious])

  const enterFullscreen = async () => {
    if (!document.fullscreenElement) await stageRef.current?.requestFullscreen()
    else await document.exitFullscreen()
  }

  return (
    <main className="reader-shell">
      <section
        ref={stageRef}
        className="reader-stage"
        style={paperAppearance}
        aria-label="3D PDF reader"
        onPointerDownCapture={primePaperSound}
      >
        <Button
          className="reader-open-button"
          variant="secondary"
          aria-label="Open another PDF"
          onClick={onChooseAnother}
        >
          <FileUpIcon data-icon="inline-start" />
          <span>Open another</span>
        </Button>

        <div className="reader-book-chip" aria-live="polite">
          <strong>{readableName}</strong>
          <span>{pages.length} pages</span>
        </div>

        <div className="reader-stage__meta" aria-live="polite">
          <Badge variant="secondary">{bookState}</Badge>
          <span>
            {annotationTool === "none"
              ? "Drag a corner to turn the page"
              : `Click a page to place ${annotationTool === "signature" ? "your signature" : "text"}`}
          </span>
        </div>

        <div className="paper-controls">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="paper-controls__trigger"
                variant="secondary"
                size="sm"
                aria-label="Adjust paper appearance"
              >
                <PaletteIcon data-icon="inline-start" />
                <span>Paper</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="paper-controls__popover"
              align="end"
              side="bottom"
              sideOffset={10}
            >
              <PopoverHeader>
                <PopoverTitle>Paper appearance</PopoverTitle>
                <PopoverDescription>
                  Add warmth without changing the PDF itself.
                </PopoverDescription>
              </PopoverHeader>

              <Field className="paper-controls__field">
                <FieldLabel htmlFor="paper-warmth">
                  <span>Warmth</span>
                  <output htmlFor="paper-warmth">{paperWarmth}%</output>
                </FieldLabel>
                <Slider
                  id="paper-warmth"
                  value={[paperWarmth]}
                  min={0}
                  max={100}
                  step={1}
                  aria-label="Paper warmth"
                  onValueChange={([value]) => {
                    if (typeof value === "number") setPaperWarmth(value)
                  }}
                  onValueCommit={([value]) => {
                    if (typeof value === "number") {
                      window.localStorage.setItem(
                        PAPER_WARMTH_KEY,
                        String(value)
                      )
                    }
                  }}
                />
                <FieldDescription>
                  0 keeps the original PDF colors.
                </FieldDescription>
              </Field>

              <Button
                variant="ghost"
                size="sm"
                disabled={paperWarmth === 0}
                onClick={() => {
                  setPaperWarmth(0)
                  window.localStorage.setItem(PAPER_WARMTH_KEY, "0")
                }}
              >
                Use PDF colors
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <Popover
          open={annotationTool !== "none"}
          onOpenChange={(open) => {
            if (!open) setAnnotationTool("none")
          }}
        >
          <PopoverAnchor asChild>
            <div className="pdf-tools" role="toolbar" aria-label="PDF tools">
              <PdfToolAction
                label="Pointer"
                active={annotationTool === "none"}
                onClick={() => setAnnotationTool("none")}
              >
                <MousePointer2Icon />
              </PdfToolAction>
              <Separator />
              <PdfToolAction
                label="Add text"
                active={annotationTool === "text"}
                onClick={() => setAnnotationTool("text")}
              >
                <TypeIcon />
              </PdfToolAction>
              <PdfToolAction
                label="Sign PDF"
                active={annotationTool === "signature"}
                onClick={() => setAnnotationTool("signature")}
              >
                <SignatureIcon />
              </PdfToolAction>
              <Separator />
              <PdfToolAction
                label="Undo last annotation"
                disabled={annotations.length === 0}
                onClick={() =>
                  setAnnotations((current) => current.slice(0, -1))
                }
              >
                <Undo2Icon />
              </PdfToolAction>
            </div>
          </PopoverAnchor>

          <PopoverContent
            className="pdf-tools__popover"
            side="right"
            align="center"
            sideOffset={12}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <PopoverHeader>
              <PopoverTitle>
                {annotationTool === "signature" ? "Sign PDF" : "Add text"}
              </PopoverTitle>
              <PopoverDescription>
                Enter the content, then click where it belongs on a page.
              </PopoverDescription>
            </PopoverHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="annotation-content">
                  {annotationTool === "signature" ? "Signature" : "Text"}
                </FieldLabel>
                <Input
                  id="annotation-content"
                  autoFocus
                  autoComplete="off"
                  value={
                    annotationTool === "signature"
                      ? signatureText
                      : annotationText
                  }
                  placeholder={
                    annotationTool === "signature"
                      ? "Your full name"
                      : "Type something…"
                  }
                  onChange={(event) => {
                    if (annotationTool === "signature") {
                      setSignatureText(event.target.value)
                    } else {
                      setAnnotationText(event.target.value)
                    }
                  }}
                />
                <FieldDescription>
                  {annotationTool === "signature"
                    ? "Rendered as ink on the page."
                    : "You can place the same text more than once."}
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="pdf-tools__popover-actions">
              <Button
                variant="ghost"
                size="sm"
                disabled={annotations.length === 0}
                onClick={() => setAnnotations([])}
              >
                Clear all
              </Button>
              <Button size="sm" onClick={() => setAnnotationTool("none")}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div
          className="book-pedestal"
          data-book-open={isBookOpen}
          data-book-state={bookState.toLowerCase()}
        >
          <div className="book-shadow" aria-hidden="true" />
          <HTMLFlipBook
            ref={bookRef}
            className="pdf-book"
            style={{}}
            width={720}
            height={980}
            minWidth={280}
            maxWidth={720}
            minHeight={380}
            maxHeight={980}
            size="stretch"
            startPage={0}
            drawShadow
            flippingTime={reducedMotion ? 300 : 850}
            usePortrait
            startZIndex={0}
            autoSize
            maxShadowOpacity={0.36}
            showCover
            mobileScrollSupport
            clickEventForward
            useMouseEvents={annotationTool === "none"}
            swipeDistance={12}
            showPageCorners={!reducedMotion}
            disableFlipByClick={false}
            onFlip={(event) => {
              setCurrentPage(Number(event.data))
              playSettle()
            }}
            onChangeState={(event) => {
              const isTurning = event.data === "flipping"
              setBookState(isTurning ? "Turning" : "Ready")
              if (isTurning) playRustle()
            }}
          >
            <BookCover
              title={readableName}
              pageCount={pages.length}
              side="front"
            />
            {pages.map((page, index) => (
              <BookPage
                key={`${index}-${page}`}
                imageUrl={page}
                index={index}
                annotationTool={annotationTool}
                annotations={annotations.filter(
                  (annotation) => annotation.pageIndex === index
                )}
                onPlaceAnnotation={placeAnnotation}
              />
            ))}
            <BookCover
              title={readableName}
              pageCount={pages.length}
              side="back"
            />
          </HTMLFlipBook>
          <div className="book-gutter" aria-hidden="true" />
        </div>

        <div
          className="reader-controls"
          role="group"
          aria-label="Page controls"
        >
          <IconAction
            label="Previous page"
            onClick={() => goPrevious()}
            disabled={currentPage <= 0}
          >
            <ChevronLeftIcon />
          </IconAction>

          <span className="page-count" aria-live="polite">
            {pageLabel}
          </span>

          <Slider
            value={[currentPage]}
            min={0}
            max={pageMax}
            step={1}
            aria-label="Go to page"
            onValueChange={([value]) => {
              if (typeof value !== "number") return
              bookRef.current?.pageFlip().turnToPage(value)
              setCurrentPage(value)
            }}
          />

          <IconAction
            label="Next page"
            onClick={() => goNext()}
            disabled={currentPage >= pageMax}
          >
            <ChevronRightIcon />
          </IconAction>

          <IconAction
            label={soundEnabled ? "Mute page sounds" : "Enable page sounds"}
            aria-pressed={soundEnabled}
            onClick={togglePaperSound}
          >
            {soundEnabled ? <Volume2Icon /> : <VolumeXIcon />}
          </IconAction>

          <IconAction label="Toggle fullscreen" onClick={enterFullscreen}>
            <ExpandIcon />
          </IconAction>
        </div>
      </section>
    </main>
  )
}
