import { useState } from 'react'
import { useSchemaStore } from '../../store/schemaStore'
import { Modal } from './Modal'

export function FolderDialog() {
  const dialog = useSchemaStore((s) => s.dialog)
  const setDialog = useSchemaStore((s) => s.setDialog)
  const createFolder = useSchemaStore((s) => s.createFolder)
  const renameWorkspaceItem = useSchemaStore((s) => s.renameWorkspaceItem)

  if (dialog?.type !== 'folder') return null

  const isRename = dialog.mode === 'rename'
  const folderId = dialog.folderId

  return (
    <FolderDialogInner
      key={`${dialog.mode}-${folderId ?? 'new'}`}
      isRename={isRename}
      folderId={folderId}
      parentFolderId={dialog.parentFolderId ?? null}
      onClose={() => setDialog(null)}
      onCreate={(name) => {
        createFolder(name, dialog.parentFolderId ?? null)
        setDialog(null)
      }}
      onRename={(name) => {
        if (folderId) renameWorkspaceItem(folderId, name)
        setDialog(null)
      }}
    />
  )
}

function FolderDialogInner({
  isRename,
  folderId,
  parentFolderId,
  onClose,
  onCreate,
  onRename,
}: {
  isRename: boolean
  folderId?: string
  parentFolderId: string | null
  onClose: () => void
  onCreate: (name: string) => void
  onRename: (name: string) => void
}) {
  const tree = useSchemaStore((s) => s.workspaceTree)
  const existing = isRename && folderId
    ? findFolderName(tree, folderId)
    : ''
  const [name, setName] = useState(existing || '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (isRename) onRename(trimmed)
    else onCreate(trimmed)
  }

  return (
    <Modal
      title={isRename ? 'Rename folder' : 'Create folder'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="themed-label">Folder name</label>
          <input
            autoFocus
            className="themed-input w-full rounded-md px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Katalon Research"
          />
        </div>
        {!isRename && parentFolderId ? (
          <p className="text-xs themed-muted">Inside selected folder.</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary rounded-md px-3 py-1.5 text-sm">
            {isRename ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function findFolderName(
  nodes: { id: string; name: string; children?: unknown[] }[],
  id: string,
): string {
  for (const n of nodes) {
    if (n.id === id) return n.name
    if (n.children) {
      const found = findFolderName(
        n.children as { id: string; name: string; children?: unknown[] }[],
        id,
      )
      if (found) return found
    }
  }
  return ''
}
