import type { DefineComponent, Plugin } from "vue";

/** A document read from a file, ready for the host to store. */
export interface ImportedDocument {
  name: string;
  source: string;
  full_text: string;
  /** Whatever a reader or a preparation step attached. Passed through. */
  metadata?: Record<string, unknown>;
}

/** What a reader produces. A bare string is the common case. */
export interface ReadResult {
  text: string;
  metadata?: Record<string, unknown>;
}

/** A file that could not be read, kept so the person importing can see why. */
export interface ImportFailure {
  name: string;
  reason: string;
}

/**
 * How one kind of file becomes a document. Adding PDF or DOCX means adding a
 * reader, not changing the component.
 */
export interface FormatReader {
  extensions: string[];
  label: string;
  read(file: File): Promise<string | ReadResult>;
}

/**
 * Works over everything that was read, before any of it is imported — where a
 * backend step goes when it is about the text rather than the file format.
 * Given every document at once so it can be done in one request.
 */
export type PrepareDocuments = (
  documents: ImportedDocument[],
) => Promise<ImportedDocument[]>;

export declare const textReader: FormatReader;
export declare const defaultReaders: FormatReader[];
export declare function readerFor(readers: FormatReader[], filename: string): FormatReader | undefined;
export declare function extensionOf(filename: string): string;
export declare function baseName(filename: string): string;
/** Strips a BOM and makes line endings LF, so offsets are stable. */
export declare function normalise(text: string): string;

export interface LegalDocsImportProps {
  /** Formats to accept. Defaults to plain text. */
  readers?: FormatReader[];
  /**
   * Runs over everything read, before it is shown as ready. A failure here
   * keeps the documents as they were read rather than losing the upload.
   */
  onPrepare?: PrepareDocuments;
  /**
   * Called with everything read. The host decides what to keep — this
   * component stores nothing and sends nothing anywhere.
   */
  onImport?: (documents: ImportedDocument[]) => Promise<void> | void;
  importLabel?: string;
  clearOnImport?: boolean;
  /** Import as soon as files are read — one button, no review list. Needs onImport. */
  autoImport?: boolean;
  onImported?: (documents: ImportedDocument[]) => void;
  /** v-model:documents, for a host that would rather drive the list itself. */
  documents?: ImportedDocument[];
}

export declare const LegalDocsImport: DefineComponent<LegalDocsImportProps, {}, any>;

export declare const VueLegalDocsImportPlugin: Plugin;
export default VueLegalDocsImportPlugin;
