import type { CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  FileUpIcon,
  PaletteIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import HTMLFlipBook from "react-pageflip"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { PaperSoundEngine } from "@/lib/paper-sound"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { AnnotationTool, PageAnnotation } from "./annotation-types"
import { BookCover, BookPage } from "./book-leaves"
import { PdfTools } from "./pdf-tools"

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

        <PdfTools
          tool={annotationTool}
          annotationText={annotationText}
          signatureText={signatureText}
          annotationCount={annotations.length}
          onToolChange={setAnnotationTool}
          onAnnotationTextChange={setAnnotationText}
          onSignatureTextChange={setSignatureText}
          onUndo={() => setAnnotations((current) => current.slice(0, -1))}
          onClear={() => setAnnotations([])}
        />

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
