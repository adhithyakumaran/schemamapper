/** Backward-compatible re-exports — prefer `layoutBoard` from `./layouts`. */
export {
  layoutBoard,
  boardNeedsInitialLayout,
  boardNeedsInitialLayout as boardNeedsAutoLayout,
} from './layouts'
export { layoutCompactTree as autoLayoutBoard } from './layouts/compactTree'
export { NODE_MIN_WIDTH, NODE_MAX_WIDTH } from './layouts/shared'
