import { useEffect } from 'react';
import type { DocImage } from '../types';

type ImageLightboxProps = {
  image: DocImage | null;
  onClose: () => void;
};

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!image) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="modal-backdrop image-lightbox-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="image-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={image.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="image-lightbox-toolbar">
          <span className="image-lightbox-name" title={image.name}>
            {image.name}
          </span>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="image-lightbox-body">
          <img src={image.dataUrl} alt={image.name} />
        </div>
      </div>
    </div>
  );
}

type DocImageGridProps = {
  images: DocImage[];
  compact?: boolean;
  editable?: boolean;
  onRemove?: (id: string) => void;
  onOpen: (image: DocImage) => void;
};

export function DocImageGrid({
  images,
  compact,
  editable,
  onRemove,
  onOpen,
}: DocImageGridProps) {
  if (images.length === 0) return null;

  return (
    <div className={`doc-image-grid${compact ? ' compact' : ''}`}>
      {images.map((img) => (
        <figure key={img.id} className="doc-image-card">
          <button
            type="button"
            className="doc-image-thumb"
            onClick={() => onOpen(img)}
            title="Ver imagen"
          >
            <img src={img.dataUrl} alt={img.name} />
          </button>
          <figcaption>
            <span title={img.name}>{img.name}</span>
            {editable && onRemove && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => onRemove(img.id)}
              >
                Quitar
              </button>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
