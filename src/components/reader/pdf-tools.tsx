import {
  MousePointer2Icon,
  SignatureIcon,
  TypeIcon,
  Undo2Icon,
} from "lucide-react"

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
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { AnnotationTool } from "./annotation-types"

type PdfToolActionProps = React.ComponentProps<typeof Button> & {
  label: string
  active?: boolean
}

function PdfToolAction({
  label,
  active,
  children,
  ...props
}: PdfToolActionProps) {
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

type PdfToolsProps = {
  tool: AnnotationTool
  annotationText: string
  signatureText: string
  annotationCount: number
  onToolChange: (tool: AnnotationTool) => void
  onAnnotationTextChange: (text: string) => void
  onSignatureTextChange: (text: string) => void
  onUndo: () => void
  onClear: () => void
}

export function PdfTools({
  tool,
  annotationText,
  signatureText,
  annotationCount,
  onToolChange,
  onAnnotationTextChange,
  onSignatureTextChange,
  onUndo,
  onClear,
}: PdfToolsProps) {
  return (
    <Popover
      open={tool !== "none"}
      onOpenChange={(open) => {
        if (!open) onToolChange("none")
      }}
    >
      <PopoverAnchor asChild>
        <div className="pdf-tools" role="toolbar" aria-label="PDF tools">
          <PdfToolAction
            label="Pointer"
            active={tool === "none"}
            onClick={() => onToolChange("none")}
          >
            <MousePointer2Icon />
          </PdfToolAction>
          <Separator />
          <PdfToolAction
            label="Add text"
            active={tool === "text"}
            onClick={() => onToolChange("text")}
          >
            <TypeIcon />
          </PdfToolAction>
          <PdfToolAction
            label="Sign PDF"
            active={tool === "signature"}
            onClick={() => onToolChange("signature")}
          >
            <SignatureIcon />
          </PdfToolAction>
          <Separator />
          <PdfToolAction
            label="Undo last annotation"
            disabled={annotationCount === 0}
            onClick={onUndo}
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
            {tool === "signature" ? "Sign PDF" : "Add text"}
          </PopoverTitle>
          <PopoverDescription>
            Enter the content, then click where it belongs on a page.
          </PopoverDescription>
        </PopoverHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="annotation-content">
              {tool === "signature" ? "Signature" : "Text"}
            </FieldLabel>
            <Input
              id="annotation-content"
              autoFocus
              autoComplete="off"
              value={tool === "signature" ? signatureText : annotationText}
              placeholder={
                tool === "signature" ? "Your full name" : "Type something…"
              }
              onChange={(event) => {
                if (tool === "signature") {
                  onSignatureTextChange(event.target.value)
                } else {
                  onAnnotationTextChange(event.target.value)
                }
              }}
            />
            <FieldDescription>
              {tool === "signature"
                ? "Rendered as ink on the page."
                : "You can place the same text more than once."}
            </FieldDescription>
          </Field>
        </FieldGroup>

        <div className="pdf-tools__popover-actions">
          <Button
            variant="ghost"
            size="sm"
            disabled={annotationCount === 0}
            onClick={onClear}
          >
            Clear all
          </Button>
          <Button size="sm" onClick={() => onToolChange("none")}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
