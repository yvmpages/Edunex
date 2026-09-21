import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useEdunex } from '../context/EdunexContext';
import type { DocImage, FolderNode } from '../types';
import { findPath } from '../utils/tree';
import { readImageFile } from '../utils/images';
import { DocImageGrid, ImageLightbox } from './DocImageGrid';

type TreeKey = 'avances' | 'notas';
type SortOrder = 'az' | 'za';
type FormMode = 'doc' | 'folder' | null;

type FolderGridPageProps = {
  tree: TreeKey;
  rootLabel: string;
  docButtonLabel: string;
  docSingular: string;
  emptyTitle: string;
  emptyText: string;
  searchAriaLabel: string;
};

export function FolderGridPage({
  tree,
  rootLabel,
  docButtonLabel,
  docSingular,
  emptyTitle,
  emptyText,
  searchAriaLabel,
}: FolderGridPageProps) {
  const {
    data,
    addFolder,
    addDoc,
    renameNode,
    updateDocContent,
    setDocImages,
    deleteNode,
    findInTree,
  } = useEdunex();

  const [folderId, setFolderId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('az');

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<DocImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<DocImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [detailId, setDetailId] = useState<string | null>(null);

  const roots = data[tree];
  const currentFolder =
    folderId != null ? findInTree(tree, folderId) : null;
  const safeFolderId =
    folderId != null && currentFolder?.type === 'folder' ? folderId : null;
  const safeCurrent = safeFolderId != null ? currentFolder : null;

  const children: FolderNode[] = safeCurrent
    ? (safeCurrent.children ?? [])
    : roots;

  const breadcrumb = safeFolderId ? findPath(roots, safeFolderId) : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...children];

    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content ?? '').toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
    if (sortOrder === 'za') {
      const folders = list.filter((n) => n.type === 'folder').reverse();
      const docs = list.filter((n) => n.type === 'doc').reverse();
      list = [...folders, ...docs];
    }
    return list;
  }, [children, query, sortOrder]);

  const detail = detailId != null ? findInTree(tree, detailId) : null;

  const openNewDoc = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setImages([]);
    setImageError(null);
    setFormMode('doc');
  };

  const openNewFolder = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setImages([]);
    setFormMode('folder');
  };

  const openEditDoc = (node: FolderNode) => {
    setDetailId(null);
    setEditingId(node.id);
    setTitle(node.title);
    setContent(node.content ?? '');
    setImages([...(node.images ?? [])]);
    setImageError(null);
    setFormMode('doc');
  };

  const openEditFolder = (node: FolderNode) => {
    setEditingId(node.id);
    setTitle(node.title);
    setContent('');
    setImages([]);
    setFormMode('folder');
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setTitle('');
    setContent('');
    setImages([]);
    setImageError(null);
  };

  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);
    try {
      const loaded: DocImage[] = [];
      for (const file of Array.from(files)) {
        loaded.push(await readImageFile(file));
      }
      setImages((prev) => [...prev, ...loaded]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Error al cargar imagen');
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name =
      title.trim() ||
      (formMode === 'folder' ? 'Nueva carpeta' : `Nuevo ${docSingular}`);

    if (formMode === 'folder') {
      if (editingId) {
        renameNode(tree, editingId, name);
      } else {
        addFolder(tree, safeFolderId, name);
      }
    } else if (formMode === 'doc') {
      if (editingId) {
        renameNode(tree, editingId, name);
        updateDocContent(tree, editingId, content);
        setDocImages(tree, editingId, images);
      } else {
        const id = addDoc(tree, safeFolderId, name);
        if (content.trim()) updateDocContent(tree, id, content);
        if (images.length > 0) setDocImages(tree, id, images);
      }
    }
    closeForm();
  };

  useEffect(() => {
    if (folderId != null && !findInTree(tree, folderId)) {
      setFolderId(null);
    }
  }, [roots, folderId, findInTree, tree]);

  useEffect(() => {
    if (!formMode && !detailId) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        closeForm();
        setDetailId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formMode, detailId]);

  const formTitleId = `${tree}-form-title`;
  const detailTitleId = `${tree}-detail-title`;
  const titleInputId = `${tree}-title`;
  const contentInputId = `${tree}-content`;

  return (
    <div className="conceptos-page">
      <div className="concept-toolbar">
        <button type="button" className="btn btn-primary" onClick={openNewDoc}>
          {docButtonLabel}
        </button>
        <button type="button" className="btn" onClick={openNewFolder}>
          Nueva carpeta
        </button>

        <input
          className="input concept-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          aria-label={searchAriaLabel}
        />

        <label className="field concept-filter-field">
          <span>Orden</span>
          <select
            className="select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            aria-label="Ordenar"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </label>
      </div>

      <nav className="notes-breadcrumb" aria-label="Ubicación">
        <button
          type="button"
          className={`crumb${safeFolderId == null ? ' current' : ''}`}
          onClick={() => setFolderId(null)}
        >
          {rootLabel}
        </button>
        {breadcrumb.map((node, i) => (
          <span key={node.id} className="crumb-group">
            <span className="crumb-sep" aria-hidden>
              /
            </span>
            <button
              type="button"
              className={`crumb${i === breadcrumb.length - 1 ? ' current' : ''}`}
              onClick={() => setFolderId(node.id)}
            >
              {node.title}
            </button>
          </span>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{children.length === 0 ? emptyTitle : 'Sin resultados'}</h3>
          <p>
            {children.length === 0
              ? emptyText
              : 'Prueba otra búsqueda u orden.'}
          </p>
        </div>
      ) : (
        <div className="concept-grid">
          {filtered.map((node) =>
            node.type === 'folder' ? (
              <div key={node.id} className="note-card-wrap">
                <button
                  type="button"
                  className="concept-card note-folder-card"
                  onClick={() => setFolderId(node.id)}
                >
                  <span className="note-card-kind" aria-hidden>
                    ▣
                  </span>
                  <span className="concept-card-term">{node.title}</span>
                  <span className="note-card-meta">
                    {(node.children ?? []).length} elemento
                    {(node.children ?? []).length === 1 ? '' : 's'}
                  </span>
                </button>
                <div className="note-card-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEditFolder(node)}
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => {
                      deleteNode(tree, node.id);
                      if (safeFolderId === node.id) setFolderId(null);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                key={node.id}
                type="button"
                className="concept-card"
                onClick={() => setDetailId(node.id)}
              >
                <span className="note-card-kind" aria-hidden>
                  ▪
                </span>
                <span className="concept-card-term">{node.title}</span>
              </button>
            ),
          )}
        </div>
      )}

      {formMode && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeForm}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={formTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={formTitleId}>
              {formMode === 'folder'
                ? editingId
                  ? 'Renombrar carpeta'
                  : safeFolderId
                    ? 'Nueva subcarpeta'
                    : 'Nueva carpeta'
                : editingId
                  ? `Editar ${docSingular}`
                  : docButtonLabel}
            </h3>
            <form onSubmit={onSubmit}>
              <div className="field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor={titleInputId}>
                  {formMode === 'folder' ? 'Nombre' : 'Título'}
                </label>
                <input
                  id={titleInputId}
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    formMode === 'folder' ? 'Nombre de la carpeta' : 'Título'
                  }
                  autoFocus
                />
              </div>
              {formMode === 'doc' && (
                <>
                  <div className="field" style={{ marginBottom: '0.85rem' }}>
                    <label htmlFor={contentInputId}>Contenido</label>
                    <textarea
                      id={contentInputId}
                      className="textarea"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escribe aquí…"
                      style={{ minHeight: '160px' }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label>Imágenes (opcional)</label>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => fileRef.current?.click()}
                      >
                        Añadir imagen
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          void addImages(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {imageError && (
                      <p className="doc-image-error">{imageError}</p>
                    )}
                    {images.length > 0 && (
                      <DocImageGrid
                        images={images}
                        compact
                        editable
                        onRemove={(id) =>
                          setImages((prev) => prev.filter((x) => x.id !== id))
                        }
                        onOpen={setPreviewImage}
                      />
                    )}
                  </div>
                </>
              )}
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && detail.type === 'doc' && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setDetailId(null)}
        >
          <div
            className="modal modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby={detailTitleId}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={detailTitleId} className="concept-detail-term">
              {detail.title}
            </h3>
            <p className="concept-detail-def">
              {(detail.content ?? '').trim() ? (
                detail.content
              ) : (
                <em>Sin contenido</em>
              )}
            </p>
            {(detail.images?.length ?? 0) > 0 && (
              <DocImageGrid
                images={detail.images!}
                onOpen={setPreviewImage}
              />
            )}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setDetailId(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => openEditDoc(detail)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  deleteNode(tree, detail.id);
                  setDetailId(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
