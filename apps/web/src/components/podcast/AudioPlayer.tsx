'use client'

import { useState, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title: string
  onTimeUpdate?: (time: number) => void
}

export function AudioPlayer({ src, title, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime += seconds
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          setCurrentTime(audioRef.current?.currentTime || 0)
          onTimeUpdate?.(audioRef.current?.currentTime || 0)
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={() => skip(-15)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Tua lại 15 giây"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={togglePlay}
          className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          onClick={() => skip(15)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Tua tới 15 giây"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <div
            className="relative h-2 bg-muted rounded-full cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current) return
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              audioRef.current.currentTime = percent * duration
            }}
          >
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <select
          value={playbackRate}
          onChange={(e) => {
            const rate = Number(e.target.value)
            setPlaybackRate(rate)
            if (audioRef.current) audioRef.current.playbackRate = rate
          }}
          className="text-sm bg-muted rounded-lg px-2 py-1 border-0 focus:ring-1 focus:ring-primary"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      <p className="text-sm font-medium mt-3 truncate">{title}</p>
    </div>
  )
}
