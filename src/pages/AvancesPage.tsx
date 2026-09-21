import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useEdunex } from '../context/EdunexContext';
import { QuickNavTree } from '../components/QuickNavTree';
import { DocImageGrid, ImageLightbox } from '../components/DocImageGrid';
import { findPath } from '../utils/tree';
import { readImageFile } from '../utils/images';
import type { DocImage } from '../types';

type FormMode = 'doc' | 'folder' | null;

export function AvancesPage() {
  const {
    data,
    addFolder,
    addDoc,
    renameNode,
    updateDocContent,
    setDocImages,
    deleteNode,
    relocateNode,
    findInTree,
  } = useEdunex();

  const roots = data.avances;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    selectedId != null ? findInTree('avances', selectedId) : null;

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImages, setFormImages] = useState<DocImage[]>([]);

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftImages, setDraftImages] = useState<DocImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<DocImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  const createParentId =
    selected == null
      ? null
      : selected.type === 'folder'
        ? selected.id
        : (() => {
            const path = findPath(roots, selected.id);
            return path.length >= 2 ? path[path.length - 2].id : null;
          })();

  useEffect(() => {
    if (selectedId != null && !findInTree('avances', selectedId)) {
      setSelectedId(null);
    }
  }, [roots, selectedId, findInTree]);

  useEffect(() => {
    setEditing(false);
    setImageError(null);
  }, [selectedId]);

  useEffect(() => {
    if (!formMode) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setFormMode(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formMode]);

  const openCreate = (mode: 'doc' | 'folder') => {
    setFormTitle('');
    setFormContent('');
    setFormImages([]);
    setImageError(null);
    setFormMode(mode);
  };

  const startEdit = () => {
    if (!selected || selected.type !== 'doc') return;
    setDraftTitle(selected.title);
    setDraftContent(selected.content ?? '');
    setDraftImages([...(selected.images ?? [])]);
    setImageError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setImageError(null);
  };

  const saveEdit = () => {
    if (!selected || selected.type !== 'doc') return;
    renameNode('avances', selected.id, draftTitle.trim() || selected.title);
    updateDocContent('avances', selected.id, draftContent);
    setDocImages('avances', selected.id, draftImages);
    setEditing(false);
  };

  const addImagesFromFiles = async (
    files: FileList | null,
    target: 'draft' | 'form',
  ) => {
    if (!files || files.length === 0) return;
    setImageError(null);
    try {
      const loaded: DocImage[] = [];
      for (const file of Array.from(files)) {
        loaded.push(await readImageFile(file));
      }
      if (target === 'draft') {
        setDraftImages((prev) => [...prev, ...loaded]);
      } else {
        setFormImages((prev) => [...prev, ...loaded]);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Error al cargar imagen');
    }
  };

  const onSubmitCreate = (e: FormEvent) => {
    e.preventDefault();
    if (formMode === 'folder') {
      const id = addFolder(
        'avances',
        createParentId,
        formTitle.trim() || 'Nueva carpeta',
      );
      setSelectedId(id);
    } else if (formMode === 'doc') {
      const id = addDoc(
        'avances',
        createParentId,
        formTitle.trim() || 'Nuevo documento',
      );
      if (formContent.trim()) updateDocContent('avances', id, formContent);
      if (formImages.length > 0) setDocImages('avances', id, formImages);
      setSelectedId(id);
    }
    setFormMode(null);
  };

  const breadcrumb =
    selectedId != null ? findPath(roots, selectedId) : [];

  return (
    <div className="folder-grid-layout with-nav avances-layout">
      <QuickNavTree
        nodes={roots}
        selectedId={selectedId}
        onSelect={setSelectedId}
        rootLabel="Avances"
        enableDrag
        onRelocate={(id, parentId, index) =>
          relocateNode('avances', id, parentId, index)
        }
      />

      <div className="conceptos-page folder-grid-main">
        <div className="concept-toolbar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openCreate('doc')}
          >
            Nuevo documento
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => openCreate('folder')}
          >
            Nueva carpeta
          </button>
        </div>

        <nav className="notes-breadcrumb" aria-label="Ubicación">
          <button
            type="button"
            className={`crumb${selectedId == null ? ' current' : ''}`}
            onClick={() => setSelectedId(null)}
          >
            Avances
          </button>
          {breadcrumb.map((node, i) => (
            <span key={node.id} className="crumb-group">
              <span className="crumb-sep" aria-hidden>
                /
              </span>
              <button
                type="button"
                className={`crumb${i === breadcrumb.length - 1 ? ' current' : ''}`}
                onClick={() => setSelectedId(node.id)}
              >
                {node.title}
              </button>
            </span>
          ))}
        </nav>

        {selected == null ? (
          <div className="empty-state">
            <h3>Avances</h3>
            <p>
              Selecciona una carpeta o documento en el explorador, o crea uno
              nuevo. Arrastra elementos en el explorador para cambiar su orden.
            </p>
          </div>
        ) : selected.type === 'folder' ? (
          <div className="avances-detail">
            <div className="content-toolbar">
              {editing ? (
                <input
                  className="input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  aria-label="Nombre de la carpeta"
                  style={{ maxWidth: '28rem' }}
                />
              ) : (
                <h3 className="avances-readonly-title">{selected.title}</h3>
              )}
              <div className="row">
                {editing ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        renameNode(
                          'avances',
                          selected.id,
                          draftTitle.trim() || selected.title,
                        );
                        setEditing(false);
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setDraftTitle(selected.title);
                        setEditing(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => openCreate('folder')}
                    >
                      + Subcarpeta
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => openCreate('doc')}
                    >
                      + Documento
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deleteNode('avances', selected.id);
                    setSelectedId(null);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="content-body">
              <p style={{ color: 'var(--ink-muted)', marginTop: 0 }}>
                Carpeta con {(selected.children ?? []).length} elemento
                {(selected.children ?? []).length === 1 ? '' : 's'}. Usa el
                explorador para abrir su contenido o arrastra archivos para
                reorganizarlos.
              </p>
              {(selected.children ?? []).length > 0 && (
                <ul className="avances-child-list">
                  {(selected.children ?? []).map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setSelectedId(child.id)}
                      >
                        {child.type === 'folder' ? '▣' : '▪'} {child.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="avances-detail">
            <div className="content-toolbar">
              {editing ? (
                <input
                  className="input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  aria-label="Título del documento"
                  style={{ maxWidth: '28rem' }}
                />
              ) : (
                <h3 className="avances-readonly-title">{selected.title}</h3>
              )}
              <div className="row">
                {editing ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={saveEdit}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={startEdit}
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deleteNode('avances', selected.id);
                    setSelectedId(null);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="content-body">
              {editing ? (
                <>
                  <textarea
                    className="textarea"
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Escribe aquí el contenido del documento…"
                    style={{ minHeight: '12rem' }}
                  />
                  <div className="doc-images-edit">
                    <div className="row" style={{ marginTop: '0.85rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => fileRef.current?.click()}
                      >
                        Añadir imagen
                      </button>
                      <span className="doc-images-optional">Opcional</span>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          void addImagesFromFiles(e.target.files, 'draft');
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {imageError && (
                      <p className="doc-image-error">{imageError}</p>
                    )}
                    {draftImages.length > 0 && (
                      <DocImageGrid
                        images={draftImages}
                        editable
                        onRemove={(id) =>
                          setDraftImages((prev) =>
                            prev.filter((x) => x.id !== id),
                          )
                        }
                        onOpen={setPreviewImage}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="doc-readonly-text">
                    {(selected.content ?? '').trim() ? (
                      selected.content
                    ) : (
                      <em style={{ color: 'var(--ink-muted)' }}>
                        Sin contenido. Pulsa «Editar» para escribir.
                      </em>
                    )}
                  </div>
                  {(selected.images?.length ?? 0) > 0 && (
                    <DocImageGrid
                      images={selected.images!}
                      onOpen={setPreviewImage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {formMode && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setFormMode(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {formMode === 'folder'
                ? createParentId
                  ? 'Nueva subcarpeta'
                  : 'Nueva carpeta'
                : 'Nuevo documento'}
            </h3>
            <form onSubmit={onSubmitCreate}>
              <div className="field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="avances-new-title">
                  {formMode === 'folder' ? 'Nombre' : 'Título'}
                </label>
                <input
                  id="avances-new-title"
                  className="input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  autoFocus
                />
              </div>
              {formMode === 'doc' && (
                <>
                  <div className="field" style={{ marginBottom: '0.85rem' }}>
                    <label htmlFor="avances-new-content">Contenido</label>
                    <textarea
                      id="avances-new-content"
                      className="textarea"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      style={{ minHeight: '120px' }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: '1rem' }}>
                    <label>Imágenes (opcional)</label>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => createFileRef.current?.click()}
                      >
                        Añadir imagen
                      </button>
                      <input
                        ref={createFileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          void addImagesFromFiles(e.target.files, 'form');
                          e.target.value = '';
                        }}
                      />
                    </div>
                    {imageError && (
                      <p className="doc-image-error">{imageError}</p>
                    )}
                    {formImages.length > 0 && (
                      <DocImageGrid
                        images={formImages}
                        compact
                        editable
                        onRemove={(id) =>
                          setFormImages((prev) =>
                            prev.filter((x) => x.id !== id),
                          )
                        }
                        onOpen={setPreviewImage}
                      />
                    )}
                  </div>
                </>
              )}
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setFormMode(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear
                </button>
              </div>
            </form>
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
