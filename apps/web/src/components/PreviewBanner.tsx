'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

export function PreviewBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-3 text-sm">
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Preview Mode
      </span>
      <Link
        href="/api/exit-preview"
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <X className="w-4 h-4" />
        Exit
      </Link>
    </div>
  )
}
