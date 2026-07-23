export type AnnotationTool = "none" | "text" | "signature"

export type PageAnnotation = {
  id: string
  pageIndex: number
  type: Exclude<AnnotationTool, "none">
  text: string
  x: number
  y: number
}
