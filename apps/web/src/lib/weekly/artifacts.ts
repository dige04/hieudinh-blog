/**
 * Artifact-based recovery system for the weekly pipeline.
 *
 * Each pipeline phase writes an artifact file on completion.
 * If the pipeline is interrupted and re-run, completed phases
 * are skipped based on artifact file existence.
 *
 * Artifacts are stored in `pipeline-artifacts/{weekId}/` and
 * are gitignored -- they are ephemeral recovery aids, not
 * version-controlled output.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

// Base dir for pipeline artifacts (gitignored)
const ARTIFACTS_BASE = path.resolve(process.cwd(), 'pipeline-artifacts')

/** Ensure the artifact directory for a given week exists and return its path. */
export function getArtifactDir(weekId: string): string {
  const dir = path.join(ARTIFACTS_BASE, weekId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/** Check whether an artifact file exists for a given phase. */
export function checkArtifact(weekId: string, phase: string): boolean {
  // Check both with and without extension
  const base = path.join(ARTIFACTS_BASE, weekId, phase)
  if (existsSync(base)) return true
  if (existsSync(`${base}.json`)) return true
  if (existsSync(`${base}.md`)) return true
  return false
}

/** Save an artifact (JSON or plain text). */
export function saveArtifact(weekId: string, phase: string, data: unknown): void {
  const dir = getArtifactDir(weekId)
  const isTextPhase = phase.endsWith('.md')
  const ext = isTextPhase ? '' : '.json'
  const filePath = path.join(dir, `${phase}${ext}`)
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  writeFileSync(filePath, content, 'utf-8')
}

/** Load a JSON artifact. Returns null if the file does not exist. */
export function loadArtifact<T>(weekId: string, phase: string): T | null {
  const filePath = path.join(ARTIFACTS_BASE, weekId, `${phase}.json`)
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

/** Load a text artifact (e.g. markdown). Returns null if the file does not exist. */
export function loadArtifactText(weekId: string, phase: string): string | null {
  const filePath = path.join(ARTIFACTS_BASE, weekId, phase)
  if (!existsSync(filePath)) return null
  return readFileSync(filePath, 'utf-8')
}

/** Create an empty marker file to indicate a phase is complete. */
export function markPhaseComplete(weekId: string, phase: string): void {
  const dir = getArtifactDir(weekId)
  writeFileSync(path.join(dir, phase), '', 'utf-8')
}
