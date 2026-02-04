'use client'

import { Share2, Link2, Twitter } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  title: string
  url: string
}

export function SocialShare({ title, url }: Props) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link đã được copy!')
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    toast.success('Link đã được copy!')
  }

  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    window.open(tweetUrl, '_blank', 'width=550,height=420')
  }

  return (
    <div className="flex items-center gap-2 py-6 border-t border-border">
      <span className="text-sm text-muted-foreground mr-2">Chia sẻ:</span>
      <button
        onClick={handleShare}
        className="p-2 rounded-full hover:bg-muted transition-colors"
        title="Chia sẻ"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-full hover:bg-muted transition-colors"
        title="Copy link"
      >
        <Link2 className="w-5 h-5" />
      </button>
      <button
        onClick={handleTwitterShare}
        className="p-2 rounded-full hover:bg-muted transition-colors"
        title="Chia sẻ trên Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>
    </div>
  )
}
