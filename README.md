# vue-legal-docs-import

Bringing documents into a platform: pick or drop files, read them in the
browser, hand them to whoever mounted the component.

```bash
npm install vue-legal-docs-import
```

```vue
<script setup lang="ts">
import { LegalDocsImport } from 'vue-legal-docs-import'
import type { ImportedDocument } from 'vue-legal-docs-import'
import 'vue-legal-docs-import/style.css'

async function save(documents: ImportedDocument[]) {
  await fetch('/api/datasets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'My documents', documents }),
  })
}
</script>

<template>
  <LegalDocsImport :on-import="save" />
</template>
```

Each document comes back as `{ name, source, full_text }` — the filename
without its extension, the filename, and the text.

## It stores nothing and sends nothing

Files are read in the browser, because a file somebody picked is already
theirs: no upload, no round trip, nothing to authenticate. What happens next
is the host's decision, and this component does not know or care whether the
documents become rows in a database, a session in a tab, or a download.

That is the same arrangement `vue-legal-query-builder` uses for search. A
component that talks to a server needs to know which server and often needs a
credential, and neither belongs in a package that renders a file picker.

## Doing the work on a backend

There are two places a server belongs, and they are not the same place.

**Extracting text from a format** is a reader. `read` is async and the
component never calls anything itself, so a reader is free to post the file to
an endpoint you own and let a real parser handle it — a Go or Python library
will do more with a PDF than anything that fits in a page, and OCR is not
happening in a browser at all:

```ts
const pdfReader: FormatReader = {
  extensions: ['.pdf'],
  label: 'PDF',
  async read(file) {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/services/docs/extract', { method: 'POST', body })
    if (!res.ok) throw new Error('could not read this PDF')
    // Return metadata alongside the text when the parser knows more.
    return res.json() as Promise<{ text: string; metadata: { pages: number } }>
  },
}
```

**Doing something to the text** is `onPrepare`. Summarising, cleaning
boilerplate, splitting a long judgment into sections, detecting a language,
redacting names. It receives every document at once, so a backend can do it in
one request rather than one per file — which matters most for exactly the
expensive steps worth sending away:

```vue
<LegalDocsImport :readers="[...defaultReaders, pdfReader]" :on-prepare="summarise" :on-import="save" />
```

```ts
async function summarise(documents: ImportedDocument[]) {
  const res = await fetch('/api/services/docs/summarise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents }),
  })
  if (!res.ok) throw new Error('the summariser is not answering')
  return res.json() as Promise<ImportedDocument[]>
}
```

It returns documents rather than changing them in place, so it may return fewer
— dropping what turned out to be unusable — or more, one file becoming a
document per section.

The result is shown in the list *before* anything is imported, which is why
this is separate from `onImport`. Whoever is importing gets to see what the
backend made of their files and remove what came back wrong, while it is still
a decision rather than a correction.

If `onPrepare` throws, the documents are kept as they were read and the reason
is shown. A summariser being down is not a reason to lose somebody's upload.

**The component still makes no requests.** Every one of these is a function you
write, pointed at an endpoint you own — the same arrangement
`vue-legal-query-builder` uses for search, and for the same reason: a package
that renders a file picker should not be choosing a server or holding a
credential.

## Adding a format

Only plain text is read today. The formats people actually have are PDF and
DOCX, and each needs a parser large enough that it should not load until a file
of that kind turns up — so the component takes readers rather than knowing how
to read anything itself:

```ts
import type { FormatReader } from 'vue-legal-docs-import'
import { defaultReaders } from 'vue-legal-docs-import'

const pdfReader: FormatReader = {
  extensions: ['.pdf'],
  label: 'PDF',
  async read(file) {
    const { extractText } = await import('./my-pdf-parser')  // loaded on demand
    return extractText(await file.arrayBuffer())
  },
}
```

```vue
<LegalDocsImport :readers="[...defaultReaders, pdfReader]" :on-import="save" />
```

A file nothing can read is listed as skipped with the reason, rather than
disappearing — files vanishing without explanation is what makes an import feel
broken.

## Props

| Prop | Type | Description |
|---|---|---|
| `readers` | `FormatReader[]` | Formats to accept. Defaults to plain text. A reader may call your server. |
| `onPrepare` | `(docs) => Promise<docs>` | Runs over everything read, before it is shown as ready. Where a backend step goes. |
| `onImport` | `(docs) => Promise<void>` | Called with everything read. Without it, no button is shown and `v-model:documents` is how the host reads the list. |
| `importLabel` | `string` | The button's text. |
| `clearOnImport` | `boolean` | Empty the list once the host has taken them. Default `true`. |
| `v-model:documents` | `ImportedDocument[]` | The list, for a host that would rather drive it. |
