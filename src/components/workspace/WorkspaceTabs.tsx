import { DEFAULT_WORKSPACE_UI, EMPTY_WORKSPACE_DOCUMENTS } from '../../store/stableDefaults'
import { useSchemaStore } from '../../store/schemaStore'

export function WorkspaceTabs() {
  const tabs = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).tabs,
  )
  const activeId = useSchemaStore(
    (s) => (s.workspaceUi ?? DEFAULT_WORKSPACE_UI).activeDocumentId,
  )
  const docs = useSchemaStore((s) => s.workspaceDocuments ?? EMPTY_WORKSPACE_DOCUMENTS)
  const setActive = useSchemaStore((s) => s.setActiveWorkspaceTab)
  const closeTab = useSchemaStore((s) => s.closeWorkspaceTab)

  if (tabs.length === 0) return null

  return (
    <div
      className="workspace-tabs flex shrink-0 items-end gap-0.5 overflow-x-auto border-b px-2 pt-1"
      style={{ borderColor: 'var(--border)' }}
    >
      {tabs.map((tab) => {
        const doc = docs[tab.documentId]
        if (!doc) return null
        const active = tab.documentId === activeId
        const glyph = doc.type === 'pdf' ? '📕' : '📄'
        return (
          <div
            key={tab.documentId}
            className={`workspace-tab ${active ? 'workspace-tab-active' : ''}`}
          >
            <button
              type="button"
              className="workspace-tab-label"
              onClick={() => setActive(tab.documentId)}
            >
              <span className="ui-glyph" aria-hidden>{glyph} </span>
              <span className="max-w-[160px] truncate">{doc.name}</span>
            </button>
            <button
              type="button"
              className="workspace-tab-close"
              aria-label="Close tab"
              onClick={() => closeTab(tab.documentId)}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
