import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

interface Props {
  content: SerializedEditorState
  className?: string
}

export function RichText({ content, className }: Props) {
  if (!content) return null

  return (
    <div className={className}>
      <PayloadRichText data={content} />
    </div>
  )
}
