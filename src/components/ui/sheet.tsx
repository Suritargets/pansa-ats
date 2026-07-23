"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: SheetPrimitive.Popup.Props & { side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-0 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none duration-200 data-open:animate-in data-closed:animate-out",
          side === "right" &&
            "inset-y-0 right-0 h-full w-full max-w-md border-l data-open:slide-in-from-right data-closed:slide-out-to-right sm:max-w-lg",
          side === "left" &&
            "inset-y-0 left-0 h-full w-full max-w-md border-r data-open:slide-in-from-left data-closed:slide-out-to-left sm:max-w-lg",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-open:slide-in-from-top data-closed:slide-out-to-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close-x"
          className="absolute top-4 right-4 rounded-xs opacity-70 outline-none ring-offset-background transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Sluiten</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 border-b border-border px-6 py-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex items-center gap-2 border-t border-border bg-muted/30 px-6 py-3", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
