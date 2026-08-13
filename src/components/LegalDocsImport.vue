<template>
    <div class="ldi">
        <div
            class="ldi-drop"
            :class="{ 'ldi-drop--over': dragging, 'ldi-drop--busy': reading }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
        >
            <input
                ref="picker"
                type="file"
                multiple
                class="ldi-picker"
                :accept="accept"
                @change="onPick"
            />
            <p class="ldi-drop-title">
                <button type="button" class="ldi-link" @click="picker?.click()">
                    Choose files
                </button>
                or drop them here
            </p>
            <p class="ldi-drop-hint">{{ hint }}</p>
        </div>

        <p v-if="reading" class="ldi-status">Reading {{ reading }}…</p>

        <!-- What was skipped, and why. Files vanishing without explanation is
             the thing that makes an import feel broken. -->
        <ul v-if="failures.length" class="ldi-failures">
            <li v-for="f in failures" :key="f.name">
                <strong>{{ f.name }}</strong> — {{ f.reason }}
            </li>
        </ul>

        <div v-if="documents.length" class="ldi-list">
            <div class="ldi-list-head">
                <span>{{ documents.length }} document{{ documents.length === 1 ? '' : 's' }} ready</span>
                <button type="button" class="ldi-link" @click="clear">Clear</button>
            </div>
            <ul>
                <li v-for="(doc, i) in documents" :key="doc.source + i" class="ldi-item">
                    <span class="ldi-item-name">{{ doc.name }}</span>
                    <span class="ldi-item-size">{{ words(doc.full_text) }} words</span>
                    <button
                        type="button"
                        class="ldi-remove"
                        :aria-label="`Remove ${doc.name}`"
                        @click="remove(i)"
                    >
                        ×
                    </button>
                </li>
            </ul>
        </div>

        <div v-if="documents.length && onImport" class="ldi-actions">
            <button type="button" class="ldi-button" :disabled="importing" @click="submit">
                {{ importing ? 'Importing…' : importLabel }}
            </button>
            <span v-if="error" class="ldi-error">{{ error }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
// Reads files the person chooses and hands the text to whoever mounted this.
//
// Reading happens here, in the browser, because a file the user picked is
// already theirs — no upload, no server round trip, nothing to authenticate.
// What happens to the documents afterwards is the host's business: this
// component has no idea whether they become a dataset, a session, or a
// download, and does not store them anywhere itself.

import { computed, ref } from 'vue'
import type { ImportedDocument, ImportFailure, FormatReader } from './types'
import { acceptAttribute, baseName, defaultReaders, readerFor } from './readers'

const props = withDefaults(
    defineProps<{
        /** Formats to accept. Defaults to plain text. */
        readers?: FormatReader[]
        /** Called with everything read. The host decides what to keep. */
        onImport?: (documents: ImportedDocument[]) => Promise<void> | void
        importLabel?: string
        /** Clear the list once the host has taken them. */
        clearOnImport?: boolean
    }>(),
    { importLabel: 'Import documents', clearOnImport: true },
)

const documents = defineModel<ImportedDocument[]>('documents', { default: () => [] })

const picker = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const reading = ref('')
const importing = ref(false)
const error = ref('')
const failures = ref<ImportFailure[]>([])

const readers = computed(() => props.readers ?? defaultReaders)
const accept = computed(() => acceptAttribute(readers.value))
const hint = computed(() => readers.value.map((r) => r.label).join(', '))

function words(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).length : 0
}

async function add(files: File[]): Promise<void> {
    failures.value = []
    error.value = ''

    for (const file of files) {
        const reader = readerFor(readers.value, file.name)
        if (!reader) {
            failures.value.push({ name: file.name, reason: 'not a kind of file this can read' })
            continue
        }
        reading.value = file.name
        try {
            const text = await reader.read(file)
            if (!text.trim()) {
                failures.value.push({ name: file.name, reason: 'the file is empty' })
                continue
            }
            documents.value = [
                ...documents.value,
                { name: baseName(file.name), source: file.name, full_text: text },
            ]
        } catch (e) {
            failures.value.push({
                name: file.name,
                reason: e instanceof Error ? e.message : 'could not be read',
            })
        } finally {
            reading.value = ''
        }
    }
}

function onPick(event: Event): void {
    const input = event.target as HTMLInputElement
    void add(Array.from(input.files ?? []))
    // Reset, so choosing the same file twice in a row still fires a change.
    input.value = ''
}

function onDrop(event: DragEvent): void {
    dragging.value = false
    void add(Array.from(event.dataTransfer?.files ?? []))
}

function remove(index: number): void {
    documents.value = documents.value.filter((_, i) => i !== index)
}

function clear(): void {
    documents.value = []
    failures.value = []
    error.value = ''
}

async function submit(): Promise<void> {
    if (!props.onImport) return
    importing.value = true
    error.value = ''
    try {
        await props.onImport(documents.value)
        if (props.clearOnImport) clear()
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'could not import these documents'
    } finally {
        importing.value = false
    }
}
</script>

<style scoped>
/* Every surface sets its own colours. A component library that inherits them
   renders dark text on a dark page the moment somebody mounts it in a theme it
   never saw — which is exactly what happened the first time this was tried. */
.ldi {
    font-family: inherit;
    color-scheme: light;
    color: #1f2937;
}

.ldi-drop {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 28px 16px;
    text-align: center;
    background: #f9fafb;
    transition: border-color 0.15s, background-color 0.15s;
}

.ldi-drop--over {
    border-color: #3b82f6;
    background: #eff6ff;
}

.ldi-drop--busy {
    opacity: 0.7;
}

.ldi-picker {
    display: none;
}

.ldi-drop-title {
    margin: 0;
    font-size: 14px;
    color: #1f2937;
}

.ldi-drop-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: #6b7280;
}

.ldi-link {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: #2563eb;
    cursor: pointer;
    text-decoration: underline;
}

.ldi-status {
    margin: 8px 0 0;
    font-size: 13px;
    color: #6b7280;
}

.ldi-failures {
    margin: 10px 0 0;
    padding: 10px 12px;
    list-style: none;
    border: 1px solid #fecaca;
    background: #fef2f2;
    border-radius: 6px;
    font-size: 13px;
    color: #991b1b;
}

.ldi-list {
    margin-top: 14px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
}

.ldi-list ul {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 260px;
    overflow-y: auto;
}

.ldi-list-head {
    color: #1f2937;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f3f4f6;
    font-size: 13px;
    font-weight: 600;
}

.ldi-item {
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
}

.ldi-item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ldi-item-size {
    color: #6b7280;
    font-size: 12px;
}

.ldi-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: #9ca3af;
    padding: 0 4px;
}

.ldi-remove:hover {
    color: #dc2626;
}

.ldi-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
}

.ldi-button {
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
}

.ldi-button:disabled {
    opacity: 0.6;
    cursor: default;
}

.ldi-error {
    color: #b91c1c;
    font-size: 13px;
}
</style>
