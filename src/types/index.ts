export type Section = 'avances' | 'conceptos' | 'notas' | 'papelera';

export type DocImage = {
  id: string;
  name: string;
  dataUrl: string;
};

export type DocBlock =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'code'; content: string; language?: string }
  | { id: string; type: 'image'; name: string; dataUrl: string };

export type FolderNode = {
  id: string;
  type: 'folder' | 'doc';
  title: string;
  content?: string;
  images?: DocImage[];
  blocks?: DocBlock[];
  children?: FolderNode[];
  parentId?: string | null;
  updatedAt: string;
};

export type Concept = {
  id: string;
  term: string;
  definition: string;
  updatedAt: string;
};

export type TrashSource = 'avances' | 'notas' | 'conceptos';

export type TrashItem = {
  id: string;
  source: TrashSource;
  label: string;
  payload: unknown;
  deletedAt: string;
};

export type AppData = {
  version: 1;
  avances: FolderNode[];
  conceptos: Concept[];
  notas: FolderNode[];
  trash: TrashItem[];
};

export const EMPTY_APP_DATA: AppData = {
  version: 1,
  avances: [],
  conceptos: [],
  notas: [],
  trash: [],
};

export const STORAGE_KEY = 'edunex-data';

function migrateDocToBlocks(node: FolderNode): FolderNode {
  if (node.type !== 'doc') {
    if (node.children) {
      return { ...node, children: node.children.map(migrateDocToBlocks) };
    }
    return node;
  }
  if (node.blocks != null) {
    if (node.children) {
      return { ...node, children: node.children.map(migrateDocToBlocks) };
    }
    return node;
  }

  const blocks: DocBlock[] = [];
  const text = (node.content ?? '').trim();
  if (text) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'text',
      content: node.content ?? '',
    });
  }
  for (const img of node.images ?? []) {
    blocks.push({
      id: img.id || crypto.randomUUID(),
      type: 'image',
      name: img.name,
      dataUrl: img.dataUrl,
    });
  }

  return {
    ...node,
    blocks,
    children: node.children?.map(migrateDocToBlocks),
  };
}

/** Normalize legacy localStorage payloads (e.g. removed `tabla` section). */
export function normalizeAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return EMPTY_APP_DATA;
  const data = raw as Partial<AppData> & { tabla?: unknown; trash?: TrashItem[] };
  const trash = (data.trash ?? []).filter(
    (item) => item.source !== ('tabla' as TrashSource),
  ) as TrashItem[];
  const avances = Array.isArray(data.avances)
    ? data.avances.map(migrateDocToBlocks)
    : [];
  return {
    version: 1,
    avances,
    conceptos: Array.isArray(data.conceptos) ? data.conceptos : [],
    notas: Array.isArray(data.notas) ? data.notas : [],
    trash,
  };
}
