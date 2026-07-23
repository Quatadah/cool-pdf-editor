import { forwardRef } from "react"

import type { AnnotationTool, PageAnnotation } from "./annotation-types"

type BookPageProps = {
  imageUrl: string
  index: number
  annotationTool: AnnotationTool
  annotations: PageAnnotation[]
  onPlaceAnnotation: (pageIndex: number, x: number, y: number) => void
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

export { BookCover, BookPage }
