import type { App, Plugin } from 'vue'

import LegalDocsImport from './components/LegalDocsImport.vue'
export { LegalDocsImport }

export type {
  ImportedDocument,
  ImportFailure,
  FormatReader,
  ReadResult,
  PrepareDocuments,
} from './components/types'
export { textReader, defaultReaders, readerFor, extensionOf, baseName } from './components/readers'

export const VueLegalDocsImportPlugin: Plugin = {
  install(app: App) {
    app.component('LegalDocsImport', LegalDocsImport)
  },
}

export default VueLegalDocsImportPlugin
