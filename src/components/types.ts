/** A document read from a file, ready for the host to store. */
export interface ImportedDocument {
  /** What to call it. The filename without its extension, by default. */
  name: string
  /** Where it came from — the filename here, an ECLI or URL elsewhere. */
  source: string
  full_text: string
  /**
   * Whatever a reader or a preparation step attached: a summary, a page
   * count, a detected language, the parser's own confidence. Opaque here and
   * passed through untouched, because the component has no opinion about what
   * a backend knows that it does not.
   */
  metadata?: Record<string, unknown>
}

/** A file that could not be read, kept so the person importing can see why. */
export interface ImportFailure {
  name: string
  reason: string
}

/** What a reader produces. A bare string is the common case. */
export interface ReadResult {
  text: string
  metadata?: Record<string, unknown>
}

/**
 * How one kind of file becomes text.
 *
 * This is the seam for format support, and it is deliberately not limited to
 * things a browser can do. `read` is async and returns a promise, so a reader
 * is free to post the file to your own server and let a real parser handle it:
 * pdf extraction is better done by a Go or Python library than by anything
 * that fits in a page, and OCR is not happening in a browser at all.
 *
 * The component never makes a request itself. A reader that talks to a server
 * is one you write, pointed at an endpoint you own — same arrangement as
 * onPrepare below.
 */
export interface FormatReader {
  /** Extensions it handles, lowercased and dotted: ['.txt', '.md']. */
  extensions: string[]
  /** Shown in the file picker's accept list and in the empty state. */
  label: string
  read(file: File): Promise<string | ReadResult>
}

/**
 * Works over everything that was read, before any of it is imported.
 *
 * Where a backend step belongs when it is about the *text* rather than the
 * file format: summarising, cleaning boilerplate, splitting one long judgment
 * into sections, detecting a language, redacting names. Given every document
 * at once, so a backend can do it in one request instead of one per file —
 * which matters most for exactly the expensive steps worth sending away.
 *
 * It returns documents rather than mutating them, so it may return fewer
 * (dropping what turned out to be unusable) or more (one file becoming a
 * document per section).
 *
 * The result is shown in the list before anything is imported. That is the
 * point of it being separate from onImport: whoever is importing gets to see
 * what the backend made of their files, and to remove what came back wrong,
 * while it is still a decision rather than a correction.
 */
export type PrepareDocuments = (documents: ImportedDocument[]) => Promise<ImportedDocument[]>
