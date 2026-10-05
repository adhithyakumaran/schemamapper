import { layoutSubtree } from '../lib/tree'
import { DEFAULT_BOARD_COLOR } from '../types/schema'
import type { Board, SchemaNode } from '../types/schema'

const BOARD_ID = 'board-katalon-example'

function node(
  id: string,
  name: string,
  parentId: string | null,
): SchemaNode {
  return {
    id,
    name,
    parentId,
    position: { x: 0, y: 0 },
    note: '',
    screenshots: [],
  }
}

/** Fallback seed when project JSON is unavailable (mirrors katalon-example.json). */
export function createKatalonExampleBoard(): Board {
  const root = node('node-katalon-studio', 'Katalon Studio', null)
  const menuBar = node('node-menu-bar', 'Menu Bar', root.id)
  const file = node('node-file', 'File', menuBar.id)
  const newNode = node('node-new', 'New', file.id)
  const project = node('node-project', 'Project', newNode.id)
  const folder = node('node-folder', 'Folder', newNode.id)
  const testCase = node('node-test-case', 'Test Case', newNode.id)
  const openProject = node('node-open-project', 'Open Project', file.id)
  const action = node('node-action', 'Action', menuBar.id)
  const spy = node('node-spy', 'Spy', action.id)
  const record = node('node-record', 'Record', action.id)
  const run = node('node-run', 'Run', action.id)
  const debug = node('node-debug', 'Debug', action.id)

  let nodes: SchemaNode[] = [
    root,
    menuBar,
    file,
    newNode,
    project,
    folder,
    testCase,
    openProject,
    action,
    spy,
    record,
    run,
    debug,
  ]

  nodes = layoutSubtree(nodes, root.id, 80, 40)

  return {
    id: BOARD_ID,
    name: 'Katalon Example',
    color: DEFAULT_BOARD_COLOR,
    nodes,
    connections: [],
  }
}
