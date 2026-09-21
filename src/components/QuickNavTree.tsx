import { useEffect, useState } from 'react';
import type { FolderNode } from '../types';
import {
  findNode,
  getParentId,
  getSiblingIndex,
} from '../utils/tree';

type DropPosition = 'before' | 'after' | 'inside';

type QuickNavTreeProps = {
  nodes: FolderNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  rootLabel: string;
  enableDrag?: boolean;
  onRelocate?: (
    nodeId: string,
    parentId: string | null,
    index: number,
  ) => void;
};

function collectExpandedDefaults(nodes: FolderNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (list: FolderNode[]) => {
    for (const node of list) {
      if (node.type === 'folder' && (node.children?.length ?? 0) > 0) {
        ids.add(node.id);
        walk(node.children!);
      }
    }
  };
  walk(nodes);
  return ids;
}

function NavBranch({
  nodes,
  selectedId,
  onSelect,
  expandedIds,
  onToggle,
  enableDrag,
  dragId,
  setDragId,
  dropTarget,
  setDropTarget,
  onDropNode,
}: {
  nodes: FolderNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  enableDrag: boolean;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  dropTarget: { id: string; position: DropPosition } | null;
  setDropTarget: (t: { id: string; position: DropPosition } | null) => void;
  onDropNode: (targetId: string, position: DropPosition) => void;
}) {
  return (
    <ul className="quick-nav-list">
      {nodes.map((node) => {
        const hasChildren =
          node.type === 'folder' && (node.children?.length ?? 0) > 0;
        const isExpanded = expandedIds.has(node.id);
        const isActive = selectedId === node.id;
        const dropHere =
          dropTarget?.id === node.id ? dropTarget.position : null;

        return (
          <li key={node.id} className="quick-nav-item">
            <div
              className={[
                'quick-nav-row',
                isActive ? 'active' : '',
                dragId === node.id ? 'dragging' : '',
                dropHere === 'before' ? 'drop-before' : '',
                dropHere === 'after' ? 'drop-after' : '',
                dropHere === 'inside' ? 'drop-inside' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={enableDrag}
              onDragStart={(e) => {
                if (!enableDrag) return;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', node.id);
                setDragId(node.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropTarget(null);
              }}
              onDragOver={(e) => {
                if (!enableDrag || !dragId || dragId === node.id) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const ratio = y / rect.height;
                let position: DropPosition = 'after';
                if (node.type === 'folder') {
                  if (ratio < 0.25) position = 'before';
                  else if (ratio > 0.75) position = 'after';
                  else position = 'inside';
                } else {
                  position = ratio < 0.5 ? 'before' : 'after';
                }
                setDropTarget({ id: node.id, position });
              }}
              onDragLeave={() => {
                if (dropTarget?.id === node.id) setDropTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!dropTarget || dropTarget.id !== node.id) return;
                onDropNode(node.id, dropTarget.position);
                setDragId(null);
                setDropTarget(null);
              }}
            >
              {node.type === 'folder' && hasChildren ? (
                <button
                  type="button"
                  className={`tree-chevron${isExpanded ? ' open' : ''}`}
                  aria-label={isExpanded ? 'Contraer' : 'Desplegar'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(node.id);
                  }}
                >
                  ▸
                </button>
              ) : (
                <span className="tree-chevron-spacer" aria-hidden />
              )}
              <button
                type="button"
                className="quick-nav-label"
                onClick={() => {
                  onSelect(node.id);
                  if (node.type === 'folder' && hasChildren && !isExpanded) {
                    onToggle(node.id);
                  }
                }}
              >
                <span className="icon" aria-hidden>
                  {node.type === 'folder' ? '▣' : '▪'}
                </span>
                <span className="tree-item-title">{node.title}</span>
              </button>
            </div>
            {hasChildren && isExpanded && (
              <NavBranch
                nodes={node.children!}
                selectedId={selectedId}
                onSelect={onSelect}
                expandedIds={expandedIds}
                onToggle={onToggle}
                enableDrag={enableDrag}
                dragId={dragId}
                setDragId={setDragId}
                dropTarget={dropTarget}
                setDropTarget={setDropTarget}
                onDropNode={onDropNode}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function QuickNavTree({
  nodes,
  selectedId,
  onSelect,
  rootLabel,
  enableDrag = false,
  onRelocate,
}: QuickNavTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    collectExpandedDefaults(nodes),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: DropPosition;
  } | null>(null);
  const [rootDrop, setRootDrop] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      // expand selected folder and its ancestors via path-like walk
      const path: string[] = [];
      const walk = (list: FolderNode[], trail: string[]): boolean => {
        for (const n of list) {
          const t = [...trail, n.id];
          if (n.id === selectedId) {
            path.push(...t);
            return true;
          }
          if (n.children && walk(n.children, t)) return true;
        }
        return false;
      };
      walk(nodes, []);
      for (const id of path) next.add(id);
      return next;
    });
  }, [selectedId, nodes]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDropOnNode = (targetId: string, position: DropPosition) => {
    if (!onRelocate || !dragId || dragId === targetId) return;

    if (position === 'inside') {
      const folder = findNode(nodes, targetId);
      if (!folder || folder.type !== 'folder') return;
      const index = folder.children?.length ?? 0;
      onRelocate(dragId, targetId, index);
      setExpandedIds((prev) => new Set(prev).add(targetId));
      return;
    }

    const parentId = getParentId(nodes, targetId);
    let index = getSiblingIndex(nodes, targetId);
    if (index < 0) return;
    if (position === 'after') index += 1;

    // If dragging within same parent and from before the target, adjust
    const dragParent = getParentId(nodes, dragId);
    const dragIndex = getSiblingIndex(nodes, dragId);
    if (dragParent === parentId && dragIndex >= 0 && dragIndex < index) {
      index -= 1;
    }

    onRelocate(dragId, parentId, index);
  };

  return (
    <aside className="quick-nav" aria-label="Explorador">
      <div className="quick-nav-header">Explorador</div>
      <button
        type="button"
        className={[
          'quick-nav-root',
          selectedId == null ? 'active' : '',
          rootDrop ? 'drop-inside' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onSelect(null)}
        onDragOver={(e) => {
          if (!enableDrag || !dragId) return;
          e.preventDefault();
          setRootDrop(true);
          setDropTarget(null);
        }}
        onDragLeave={() => setRootDrop(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (!enableDrag || !onRelocate || !dragId) return;
          onRelocate(dragId, null, nodes.length);
          setRootDrop(false);
          setDragId(null);
        }}
      >
        {rootLabel}
      </button>
      {nodes.length === 0 ? (
        <p className="quick-nav-empty">Sin elementos</p>
      ) : (
        <NavBranch
          nodes={nodes}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggle={toggle}
          enableDrag={enableDrag}
          dragId={dragId}
          setDragId={setDragId}
          dropTarget={dropTarget}
          setDropTarget={setDropTarget}
          onDropNode={handleDropOnNode}
        />
      )}
      {enableDrag && (
        <p className="quick-nav-hint">Arrastra para reordenar o mover</p>
      )}
    </aside>
  );
}
