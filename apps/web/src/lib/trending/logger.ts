interface PipelineLogEntry {
  timestamp: string
  pipeline: 'daily' | 'weekly'
  phase: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}

export function pipelineLog(entry: Omit<PipelineLogEntry, 'timestamp'>): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${entry.pipeline}:${entry.phase}]`
  const msg = `${timestamp} ${prefix} ${entry.message}`

  switch (entry.level) {
    case 'error':
      console.error(msg, entry.metadata ? JSON.stringify(entry.metadata) : '')
      break
    case 'warn':
      console.warn(msg, entry.metadata ? JSON.stringify(entry.metadata) : '')
      break
    default:
      console.log(msg, entry.metadata ? JSON.stringify(entry.metadata) : '')
  }
}

export type { PipelineLogEntry }
