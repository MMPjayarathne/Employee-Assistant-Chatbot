import { useCallback, useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

type UploadItem = { file: File; progress: number }

type RemoteFile = { name: string; size: number; url: string }

export default function Upload() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [status, setStatus] = useState('')
  const [files, setFiles] = useState<RemoteFile[]>([])

  async function loadFiles() {
    try {
      const res = await fetch(`${API_BASE}/files`)
      const data = await res.json()
      setFiles(data)
    } catch (e) {
      setFiles([])
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const next: UploadItem[] = Array.from(files).map((f) => ({ file: f, progress: 0 }))
    setItems(next)
  }, [])

  async function upload() {
    if (items.length === 0) return
    setStatus('Uploading...')

    const form = new FormData()
    items.forEach(({ file }) => form.append('files', file))

    const res = await fetch(`${API_BASE}/ingest`, {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    setStatus(`Uploaded: ${(data.saved || []).length}. Vectorstore rebuilt.`)
    setItems([])
    await loadFiles()
  }

  return (
    <div className="px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Upload Documents</h1>
        <div
          className="border-2 border-dashed rounded p-6 text-center bg-white dark:bg-gray-900 dark:border-gray-800"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFiles(e.dataTransfer.files)
          }}
        >
          <p className="mb-3 text-gray-600 dark:text-gray-300">Drag & drop PDFs here, or select files</p>
          <input type="file" multiple accept="application/pdf" onChange={(e) => onFiles(e.target.files)} />
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            <h2 className="font-medium mb-2">Ready to upload</h2>
            <ul className="space-y-2">
              {items.map((it, i) => (
                <li key={i} className="border rounded p-2 flex justify-between text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <span className="truncate max-w-[70%]">{it.file.name}</span>
                  <span>{Math.round(it.progress)}%</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={upload}>Upload & Ingest</button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-medium mb-2">Existing documents</h2>
          {files.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((f, i) => (
                <div key={i} className="relative border rounded bg-white dark:bg-gray-900 dark:border-gray-800 overflow-hidden group">
                  <div className="aspect-[4/3] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                    {/* PDF placeholder icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-red-500">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L18.5 9H15Z" />
                    </svg>
                  </div>
                  <div className="p-2 border-t dark:border-gray-800">
                    <div className="truncate text-sm">{f.name}</div>
                    <div className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <a
                    href={`${API_BASE}${f.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View"
                    aria-label="View document"
                  >
                    {/* Eye icon */}
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-gray-900/80 border dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                      </svg>
                    </span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {status && <p className="mt-4 text-sm">{status}</p>}
      </div>
    </div>
  )
}
