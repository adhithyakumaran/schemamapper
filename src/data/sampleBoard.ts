import { createId } from '../lib/ids'
import { layoutSubtree, syncEdgesFromParents } from '../lib/tree'
import type { Board, SchemaNode } from '../types/schema'

function node(
  name: string,
  parentId: string | null,
  id?: string,
): SchemaNode {
  return {
    id: id ?? createId('node'),
    name,
    parentId,
    position: { x: 0, y: 0 },
    note: '',
    image: null,
  }
}

export function createKatalonExampleBoard(): Board {
  const boardId = createId('board')
  const root = node('Katalon Studio', null, createId('node'))
  const menuBar = node('Menu Bar', root.id)
  const file = node('File', menuBar.id)
  const newNode = node('New', file.id)
  const project = node('Project', newNode.id)
  const folder = node('Folder', newNode.id)
  const testCase = node('Test Case', newNode.id)
  const openProject = node('Open Project', file.id)
  const action = node('Action', menuBar.id)
  const spy = node('Spy', action.id)
  const record = node('Record', action.id)
  const run = node('Run', action.id)
  const debug = node('Debug', action.id)

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
    id: boardId,
    name: 'Katalon Example',
    nodes,
    edges: syncEdgesFromParents(nodes),
  }
}
