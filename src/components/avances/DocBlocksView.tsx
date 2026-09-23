import { useState } from 'react';
import type { DocBlock } from '../../types';
import { ImageLightbox } from '../DocImageGrid';

type DocBlocksViewProps = {
  blocks: DocBlock[];
};

export function DocBlocksView({ blocks }: DocBlocksViewProps) {
  const [preview, setPreview] = useState<{
    id: string;
    name: string;
    dataUrl: string;
  } | null>(null);

  if (blocks.length === 0) {
    return (
      <em style={{ color: 'var(--ink-muted)' }}>
        Sin contenido. Pulsa «Editar» para añadir texto, código o imágenes.
      </em>
    );
  }

  return (
    <>
      <div className="doc-blocks">
        {blocks.map((block) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="doc-block doc-block-text">
                {(block.content ?? '').trim() ? (
                  block.content
                ) : (
                  <em style={{ color: 'var(--ink-muted)' }}>Texto vacío</em>
                )}
              </div>
            );
          }
          if (block.type === 'code') {
            return (
              <pre key={block.id} className="doc-block doc-block-code">
                <code>{block.content || ' '}</code>
              </pre>
            );
          }
          return (
            <figure key={block.id} className="doc-block doc-block-image">
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
                title="Ver imagen"
              >
                <img src={block.dataUrl} alt={block.name} />
              </button>
              <figcaption>{block.name}</figcaption>
            </figure>
          );
        })}
      </div>
      <ImageLightbox image={preview} onClose={() => setPreview(null)} />
    </>
  );
}
