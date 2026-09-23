import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  AppData,
  Concept,
  DocBlock,
  FolderNode,
  Section,
  TrashItem,
  TrashSource,
} from '../types';
import { EMPTY_APP_DATA, STORAGE_KEY, normalizeAppData } from '../types';
import {
  createId,
  findNode,
  insertChild,
  moveNode as moveNodeInTree,
  relocateNode as relocateNodeInTree,
  nowIso,
  removeNode,
  updateNode,
} from '../utils/tree';

type TreeKey = 'avances' | 'notas';

type EdunexContextValue = {
  data: AppData;
  section: Section;
  setSection: (s: Section) => void;
  addFolder: (tree: TreeKey, parentId: string | null, title: string) => string;
  addDoc: (tree: TreeKey, parentId: string | null, title: string) => string;
  renameNode: (tree: TreeKey, id: string, title: string) => void;
  updateDocContent: (tree: TreeKey, id: string, content: string) => void;
  setDocImages: (tree: TreeKey, id: string, images: FolderNode['images']) => void;
  setDocBlocks: (tree: TreeKey, id: string, blocks: DocBlock[]) => void;
  deleteNode: (tree: TreeKey, id: string) => void;
  moveNode: (tree: TreeKey, id: string, newParentId: string | null) => void;
  relocateNode: (
    tree: TreeKey,
    id: string,
    parentId: string | null,
    index: number,
  ) => void;
  addConcept: (term: string, definition: string) => void;
  updateConcept: (id: string, term: string, definition: string) => void;
  deleteConcept: (id: string) => void;
  restoreTrash: (id: string) => void;
  purgeTrash: (id: string) => void;
  emptyTrash: () => void;
  replaceData: (data: AppData) => void;
  findInTree: (tree: TreeKey, id: string) => FolderNode | null;
};

const EdunexContext = createContext<EdunexContextValue | null>(null);

function pushTrash(
  trash: TrashItem[],
  source: TrashSource,
  label: string,
  payload: unknown,
): TrashItem[] {
  return [
    {
      id: createId(),
      source,
      label,
      payload,
      deletedAt: nowIso(),
    },
    ...trash,
  ];
}

export function EdunexProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<AppData>(
    STORAGE_KEY,
    EMPTY_APP_DATA,
    normalizeAppData,
  );
  const [section, setSection] = useState<Section>('avances');

  const addFolder = useCallback(
    (tree: TreeKey, parentId: string | null, title: string) => {
      const id = createId();
      const node: FolderNode = {
        id,
        type: 'folder',
        title: title.trim() || 'Nueva carpeta',
        children: [],
        parentId,
        updatedAt: nowIso(),
      };
      setData((prev) => ({
        ...prev,
        [tree]: insertChild(prev[tree], parentId, node),
      }));
      return id;
    },
    [setData],
  );

  const addDoc = useCallback(
    (tree: TreeKey, parentId: string | null, title: string) => {
      const id = createId();
      const node: FolderNode = {
        id,
        type: 'doc',
        title: title.trim() || 'Nuevo documento',
        content: tree === 'notas' ? '' : undefined,
        blocks: tree === 'avances' ? [] : undefined,
        parentId,
        updatedAt: nowIso(),
      };
      setData((prev) => ({
        ...prev,
        [tree]: insertChild(prev[tree], parentId, node),
      }));
      return id;
    },
    [setData],
  );

  const renameNode = useCallback(
    (tree: TreeKey, id: string, title: string) => {
      setData((prev) => ({
        ...prev,
        [tree]: updateNode(prev[tree], id, (n) => ({
          ...n,
          title: title.trim() || n.title,
          updatedAt: nowIso(),
        })),
      }));
    },
    [setData],
  );

  const updateDocContent = useCallback(
    (tree: TreeKey, id: string, content: string) => {
      setData((prev) => ({
        ...prev,
        [tree]: updateNode(prev[tree], id, (n) => ({
          ...n,
          content,
          updatedAt: nowIso(),
        })),
      }));
    },
    [setData],
  );

  const setDocImages = useCallback(
    (tree: TreeKey, id: string, images: FolderNode['images']) => {
      setData((prev) => ({
        ...prev,
        [tree]: updateNode(prev[tree], id, (n) => ({
          ...n,
          images: images ?? [],
          updatedAt: nowIso(),
        })),
      }));
    },
    [setData],
  );

  const setDocBlocks = useCallback(
    (tree: TreeKey, id: string, blocks: DocBlock[]) => {
      setData((prev) => ({
        ...prev,
        [tree]: updateNode(prev[tree], id, (n) => ({
          ...n,
          blocks,
          updatedAt: nowIso(),
        })),
      }));
    },
    [setData],
  );

  const deleteNode = useCallback(
    (tree: TreeKey, id: string) => {
      setData((prev) => {
        const { tree: nextTree, removed } = removeNode(prev[tree], id);
        if (!removed) return prev;
        return {
          ...prev,
          [tree]: nextTree,
          trash: pushTrash(prev.trash, tree, removed.title, {
            kind: 'node',
            node: removed,
          }),
        };
      });
    },
    [setData],
  );

  const moveNode = useCallback(
    (tree: TreeKey, id: string, newParentId: string | null) => {
      setData((prev) => ({
        ...prev,
        [tree]: moveNodeInTree(prev[tree], id, newParentId),
      }));
    },
    [setData],
  );

  const relocateNode = useCallback(
    (
      tree: TreeKey,
      id: string,
      parentId: string | null,
      index: number,
    ) => {
      setData((prev) => ({
        ...prev,
        [tree]: relocateNodeInTree(prev[tree], id, parentId, index),
      }));
    },
    [setData],
  );

  const addConcept = useCallback(
    (term: string, definition: string) => {
      const concept: Concept = {
        id: createId(),
        term: term.trim(),
        definition: definition.trim(),
        updatedAt: nowIso(),
      };
      if (!concept.term) return;
      setData((prev) => ({
        ...prev,
        conceptos: [concept, ...prev.conceptos],
      }));
    },
    [setData],
  );

  const updateConcept = useCallback(
    (id: string, term: string, definition: string) => {
      setData((prev) => ({
        ...prev,
        conceptos: prev.conceptos.map((c) =>
          c.id === id
            ? {
                ...c,
                term: term.trim() || c.term,
                definition: definition.trim(),
                updatedAt: nowIso(),
              }
            : c,
        ),
      }));
    },
    [setData],
  );

  const deleteConcept = useCallback(
    (id: string) => {
      setData((prev) => {
        const concept = prev.conceptos.find((c) => c.id === id);
        if (!concept) return prev;
        return {
          ...prev,
          conceptos: prev.conceptos.filter((c) => c.id !== id),
          trash: pushTrash(prev.trash, 'conceptos', concept.term, {
            kind: 'concept',
            concept,
          }),
        };
      });
    },
    [setData],
  );

  const restoreTrash = useCallback(
    (id: string) => {
      setData((prev) => {
        const item = prev.trash.find((t) => t.id === id);
        if (!item) return prev;
        const payload = item.payload as {
          kind: string;
          node?: FolderNode;
          concept?: Concept;
        };

        let next: AppData = {
          ...prev,
          trash: prev.trash.filter((t) => t.id !== id),
        };

        if (payload.kind === 'node' && payload.node) {
          const tree = item.source as TreeKey;
          if (tree === 'avances' || tree === 'notas') {
            next = {
              ...next,
              [tree]: [...next[tree], { ...payload.node, parentId: null }],
            };
          }
        } else if (payload.kind === 'concept' && payload.concept) {
          next = {
            ...next,
            conceptos: [payload.concept, ...next.conceptos],
          };
        }

        return next;
      });
    },
    [setData],
  );

  const purgeTrash = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        trash: prev.trash.filter((t) => t.id !== id),
      }));
    },
    [setData],
  );

  const emptyTrash = useCallback(() => {
    setData((prev) => ({ ...prev, trash: [] }));
  }, [setData]);

  const replaceData = useCallback(
    (next: AppData) => {
      setData(normalizeAppData(next));
    },
    [setData],
  );

  const findInTree = useCallback(
    (tree: TreeKey, id: string) => findNode(data[tree], id),
    [data],
  );

  const value = useMemo<EdunexContextValue>(
    () => ({
      data,
      section,
      setSection,
      addFolder,
      addDoc,
      renameNode,
      updateDocContent,
      setDocImages,
      setDocBlocks,
      deleteNode,
      moveNode,
      relocateNode,
      addConcept,
      updateConcept,
      deleteConcept,
      restoreTrash,
      purgeTrash,
      emptyTrash,
      replaceData,
      findInTree,
    }),
    [
      data,
      section,
      addFolder,
      addDoc,
      renameNode,
      updateDocContent,
      setDocImages,
      setDocBlocks,
      deleteNode,
      moveNode,
      relocateNode,
      addConcept,
      updateConcept,
      deleteConcept,
      restoreTrash,
      purgeTrash,
      emptyTrash,
      replaceData,
      findInTree,
    ],
  );

  return (
    <EdunexContext.Provider value={value}>{children}</EdunexContext.Provider>
  );
}

export function useEdunex() {
  const ctx = useContext(EdunexContext);
  if (!ctx) throw new Error('useEdunex must be used within EdunexProvider');
  return ctx;
}
