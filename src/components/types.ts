/** A document read from a file, ready for the host to store. */
export interface ImportedDocument {
  /** What to call it. The filename without its extension, by default. */
  name: string
  /** Where it came from — the filename here, an ECLI or URL elsewhere. */
  source: string
  full_text: string
}

/** A file that could not be read, kept so the person importing can see why. */
export interface ImportFailure {
  name: string
  reason: string
}

/**
 * How one kind of file becomes a document.
 *
 * Adding PDF or DOCX means adding a reader here, not changing the component.
 * A reader is async because most formats worth adding need a parser that is
 * worth loading only when a file of that kind actually turns up.
 */
export interface FormatReader {
  /** Extensions it handles, lowercased and dotted: ['.txt', '.md']. */
  extensions: string[]
  /** Shown in the file picker's accept list and in the empty state. */
  label: string
  read(file: File): Promise<string>
}
