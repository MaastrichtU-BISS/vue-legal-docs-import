// Turning a file into text, one format at a time.
//
// Only plain text for now. The seam exists because the formats people actually
// have are PDF and DOCX, and each of those needs a parser large enough that it
// should not load until a file of that kind turns up — so the component asks
// for a reader rather than knowing how to read anything itself.

import type { FormatReader } from './types'

/** Plain text, read as UTF-8. */
export const textReader: FormatReader = {
  extensions: ['.txt', '.text', '.md'],
  label: 'Text files',
  async read(file: File): Promise<string> {
    return normalise(await file.text())
  },
}

/**
 * Makes text that annotates predictably, wherever it was read.
 *
 * Annotation offsets are character positions into the stored text. A file
 * saved on Windows carries CRLF, so every line before an annotation shifts it
 * by one against the same document read anywhere else — and a byte order mark
 * pushes the whole document along by one invisible character.
 *
 * A host that reads other formats on a server has to do the same thing there,
 * or the same document will land differently depending on which path it took.
 */
export function normalise(text: string): string {
  return text
    .replace(/^\ufeff/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

export const defaultReaders: FormatReader[] = [textReader]

/** The reader for a filename, or undefined when nothing handles it. */
export function readerFor(readers: FormatReader[], filename: string): FormatReader | undefined {
  const ext = extensionOf(filename)
  return readers.find((r) => r.extensions.includes(ext))
}

/** The lowercased extension including the dot, or '' when there is none. */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

/** A filename without its extension, which is what a document gets called. */
export function baseName(filename: string): string {
  const ext = extensionOf(filename)
  return ext ? filename.slice(0, -ext.length) : filename
}

/** Every extension a set of readers accepts, for the file picker. */
export function acceptAttribute(readers: FormatReader[]): string {
  return readers.flatMap((r) => r.extensions).join(',')
}
