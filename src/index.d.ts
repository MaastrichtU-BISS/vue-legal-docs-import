import type { DefineComponent, Plugin } from "vue";

/** A document read from a file, ready for the host to store. */
export interface ImportedDocument {
  name: string;
  source: string;
  full_text: string;
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
  read(file: File): Promise<string>;
}

export declare const textReader: FormatReader;
export declare const defaultReaders: FormatReader[];
export declare function readerFor(readers: FormatReader[], filename: string): FormatReader | undefined;
export declare function extensionOf(filename: string): string;
export declare function baseName(filename: string): string;

export interface LegalDocsImportProps {
  /** Formats to accept. Defaults to plain text. */
  readers?: FormatReader[];
  /**
   * Called with everything read. The host decides what to keep — this
   * component stores nothing and sends nothing anywhere.
   */
  onImport?: (documents: ImportedDocument[]) => Promise<void> | void;
  importLabel?: string;
  clearOnImport?: boolean;
  /** v-model:documents, for a host that would rather drive the list itself. */
  documents?: ImportedDocument[];
}

export declare const LegalDocsImport: DefineComponent<LegalDocsImportProps, {}, any>;

export declare const VueLegalDocsImportPlugin: Plugin;
export default VueLegalDocsImportPlugin;
