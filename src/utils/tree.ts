import type { FolderNode } from '../types';

export function createId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function findNode(
  nodes: FolderNode[],
  id: string,
): FolderNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Path from root to the node (inclusive), or empty if not found. */
export function findPath(
  nodes: FolderNode[],
  id: string,
): FolderNode[] {
  for (const node of nodes) {
    if (node.id === id) return [node];
    if (node.children) {
      const childPath = findPath(node.children, id);
      if (childPath.length > 0) return [node, ...childPath];
    }
  }
  return [];
}

export function updateNode(
  nodes: FolderNode[],
  id: string,
  updater: (node: FolderNode) => FolderNode,
): FolderNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children) {
      return { ...node, children: updateNode(node.children, id, updater) };
    }
    return node;
  });
}

export function removeNode(
  nodes: FolderNode[],
  id: string,
): { tree: FolderNode[]; removed: FolderNode | null } {
  let removed: FolderNode | null = null;

  const walk = (list: FolderNode[]): FolderNode[] => {
    const next: FolderNode[] = [];
    for (const node of list) {
      if (node.id === id) {
        removed = node;
        continue;
      }
      if (node.children) {
        next.push({ ...node, children: walk(node.children) });
      } else {
        next.push(node);
      }
    }
    return next;
  };

  return { tree: walk(nodes), removed };
}

export function insertChild(
  nodes: FolderNode[],
  parentId: string | null,
  child: FolderNode,
): FolderNode[] {
  if (parentId == null) {
    return [...nodes, { ...child, parentId: null }];
  }

  return updateNode(nodes, parentId, (parent) => ({
    ...parent,
    children: [...(parent.children ?? []), { ...child, parentId }],
    updatedAt: nowIso(),
  }));
}

export function listFolders(
  nodes: FolderNode[],
  excludeSubtreeId?: string,
): { id: string; title: string; depth: number }[] {
  const result: { id: string; title: string; depth: number }[] = [];
  const walk = (list: FolderNode[], depth: number) => {
    for (const node of list) {
      if (node.type !== 'folder') continue;
      if (excludeSubtreeId && node.id === excludeSubtreeId) continue;
      result.push({ id: node.id, title: node.title, depth });
      if (node.children) walk(node.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return result;
}

/** Returns true if `maybeDescendantId` is inside `node`'s subtree. */
function isDescendant(node: FolderNode, maybeDescendantId: string): boolean {
  if (!node.children) return false;
  for (const child of node.children) {
    if (child.id === maybeDescendantId) return true;
    if (isDescendant(child, maybeDescendantId)) return true;
  }
  return false;
}

export function moveNode(
  nodes: FolderNode[],
  nodeId: string,
  newParentId: string | null,
): FolderNode[] {
  if (newParentId === nodeId) return nodes;
  if (newParentId != null) {
    const moving = findNode(nodes, nodeId);
    if (moving && isDescendant(moving, newParentId)) return nodes;
  }
  const { tree, removed } = removeNode(nodes, nodeId);
  if (!removed) return nodes;
  return insertChild(tree, newParentId, {
    ...removed,
    updatedAt: nowIso(),
  });
}

/** Move a node under a parent at a specific sibling index. */
export function relocateNode(
  nodes: FolderNode[],
  nodeId: string,
  targetParentId: string | null,
  targetIndex: number,
): FolderNode[] {
  if (targetParentId === nodeId) return nodes;
  if (targetParentId != null) {
    const moving = findNode(nodes, nodeId);
    if (moving && isDescendant(moving, targetParentId)) return nodes;
  }

  const { tree, removed } = removeNode(nodes, nodeId);
  if (!removed) return nodes;

  const node: FolderNode = {
    ...removed,
    parentId: targetParentId,
    updatedAt: nowIso(),
  };

  if (targetParentId == null) {
    const next = [...tree];
    const index = Math.max(0, Math.min(targetIndex, next.length));
    next.splice(index, 0, node);
    return next;
  }

  return updateNode(tree, targetParentId, (parent) => {
    const children = [...(parent.children ?? [])];
    const index = Math.max(0, Math.min(targetIndex, children.length));
    children.splice(index, 0, node);
    return { ...parent, children, updatedAt: nowIso() };
  });
}

export function getParentId(
  nodes: FolderNode[],
  nodeId: string,
): string | null {
  const path = findPath(nodes, nodeId);
  if (path.length < 2) return null;
  return path[path.length - 2].id;
}

export function getSiblingIndex(
  nodes: FolderNode[],
  nodeId: string,
): number {
  const parentId = getParentId(nodes, nodeId);
  const siblings =
    parentId == null
      ? nodes
      : (findNode(nodes, parentId)?.children ?? []);
  return siblings.findIndex((n) => n.id === nodeId);
}

export function flattenDocs(nodes: FolderNode[]): FolderNode[] {
  const result: FolderNode[] = [];
  const walk = (list: FolderNode[]) => {
    for (const node of list) {
      if (node.type === 'doc') result.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}
