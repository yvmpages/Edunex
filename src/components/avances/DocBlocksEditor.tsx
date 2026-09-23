import { useRef, useState } from 'react';
import type { DocBlock } from '../../types';
import { createId } from '../../utils/tree';
import { readImageFile } from '../../utils/images';
import { ImageLightbox } from '../DocImageGrid';

type DocBlocksEditorProps = {
  blocks: DocBlock[];
  onChange: (blocks: DocBlock[]) => void;
};

export function DocBlocksEditor({ blocks, onChange }: DocBlocksEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    id: string;
    name: string;
    dataUrl: string;
  } | null>(null);

  const updateBlock = (id: string, patch: Partial<DocBlock>) => {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as DocBlock) : b)),
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index < 0) return;
    const next = index + dir;
    if (next < 0 || next >= blocks.length) return;
    const copy = [...blocks];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(copy);
  };

  const addText = () => {
    onChange([...blocks, { id: createId(), type: 'text', content: '' }]);
  };

  const addCode = () => {
    onChange([...blocks, { id: createId(), type: 'code', content: '' }]);
  };

  const addImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);
    try {
      const next: DocBlock[] = [];
      for (const file of Array.from(files)) {
        const img = await readImageFile(file);
        next.push({
          id: img.id,
          type: 'image',
          name: img.name,
          dataUrl: img.dataUrl,
        });
      }
      onChange([...blocks, ...next]);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : 'Error al cargar imagen',
      );
    }
  };

  return (
    <div className="doc-blocks-editor">
      <div className="row doc-blocks-toolbar">
        <button type="button" className="btn btn-sm" onClick={addText}>
          + Texto
        </button>
        <button type="button" className="btn btn-sm" onClick={addCode}>
          + Código
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => fileRef.current?.click()}
        >
          + Imagen
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
      {imageError && <p className="doc-image-error">{imageError}</p>}

      {blocks.length === 0 ? (
        <p style={{ color: 'var(--ink-muted)' }}>
          Añade bloques de texto, código o imagen para armar el documento.
        </p>
      ) : (
        <div className="doc-blocks-edit-list">
          {blocks.map((block, index) => (
            <div key={block.id} className="doc-block-edit">
              <div className="doc-block-edit-bar">
                <span className="doc-block-type">
                  {block.type === 'text'
                    ? 'Texto'
                    : block.type === 'code'
                      ? 'Código'
                      : 'Imagen'}
                </span>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={index === 0}
                    onClick={() => moveBlock(block.id, -1)}
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(block.id, 1)}
                    title="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => removeBlock(block.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {block.type === 'text' && (
                <textarea
                  className="textarea"
                  value={block.content}
                  onChange={(e) =>
                    updateBlock(block.id, { content: e.target.value })
                  }
                  placeholder="Escribe texto…"
                  rows={4}
                />
              )}
              {block.type === 'code' && (
                <textarea
                  className="textarea doc-block-code-input"
                  value={block.content}
                  onChange={(e) =>
                    updateBlock(block.id, { content: e.target.value })
                  }
                  placeholder="Pega o escribe código…"
                  rows={6}
                  spellCheck={false}
                />
              )}
              {block.type === 'image' && (
                <div className="doc-block-image-edit">
                  <button
                    type="button"
                    className="doc-image-thumb"
                    onClick={() =>
                      setPreview({
                        id: block.id,
                        name: block.name,
                        dataUrl: block.dataUrl,
                      })
                    }
                  >
                    <img src={block.dataUrl} alt={block.name} />
                  </button>
                  <span className="doc-images-optional">{block.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ImageLightbox image={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
