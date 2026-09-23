import { useEffect, useState, type FormEvent } from 'react';
import { useEdunex } from '../context/EdunexContext';
import { QuickNavTree } from '../components/QuickNavTree';
import { DocBlocksView } from '../components/avances/DocBlocksView';
import { DocBlocksEditor } from '../components/avances/DocBlocksEditor';
import { findPath } from '../utils/tree';
import type { DocBlock } from '../types';

type FormMode = 'doc' | 'folder' | null;

export function AvancesPage() {
  const {
    data,
    addFolder,
    addDoc,
    renameNode,
    setDocBlocks,
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

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBlocks, setDraftBlocks] = useState<DocBlock[]>([]);

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
    setFormMode(mode);
  };

  const startEditDoc = () => {
    if (!selected || selected.type !== 'doc') return;
    setDraftTitle(selected.title);
    setDraftBlocks([...(selected.blocks ?? [])]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEditDoc = () => {
    if (!selected || selected.type !== 'doc') return;
    renameNode('avances', selected.id, draftTitle.trim() || selected.title);
    setDocBlocks('avances', selected.id, draftBlocks);
    setEditing(false);
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
                      onClick={saveEditDoc}
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
                    onClick={startEditDoc}
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
                <DocBlocksEditor
                  blocks={draftBlocks}
                  onChange={setDraftBlocks}
                />
              ) : (
                <DocBlocksView blocks={selected.blocks ?? []} />
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
              <div className="field" style={{ marginBottom: '1rem' }}>
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
                <p
                  style={{
                    color: 'var(--ink-muted)',
                    fontSize: '0.9rem',
                    marginTop: 0,
                  }}
                >
                  Después podrás añadir texto, código e imágenes con «Editar».
                </p>
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
    </div>
  );
}
