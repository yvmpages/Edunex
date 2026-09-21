export type Section = 'avances' | 'conceptos' | 'notas' | 'papelera';

export type DocImage = {
  id: string;
  name: string;
  dataUrl: string;
};

export type FolderNode = {
  id: string;
  type: 'folder' | 'doc';
  title: string;
  content?: string;
  images?: DocImage[];
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

/** Normalize legacy localStorage payloads (e.g. removed `tabla` section). */
export function normalizeAppData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return EMPTY_APP_DATA;
  const data = raw as Partial<AppData> & { tabla?: unknown; trash?: TrashItem[] };
  const trash = (data.trash ?? []).filter(
    (item) => item.source !== ('tabla' as TrashSource),
  ) as TrashItem[];
  return {
    version: 1,
    avances: Array.isArray(data.avances) ? data.avances : [],
    conceptos: Array.isArray(data.conceptos) ? data.conceptos : [],
    notas: Array.isArray(data.notas) ? data.notas : [],
    trash,
  };
}
