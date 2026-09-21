import { createId } from '../utils/tree';
import type { DocImage } from '../types';

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024; // ~1.5 MB

export function readImageFile(file: File): Promise<DocImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('La imagen supera 1,5 MB. Elige una más ligera.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: createId(),
        name: file.name,
        dataUrl: String(reader.result),
      });
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}
