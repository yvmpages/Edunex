import type { AppData } from '../types';
import { normalizeAppData } from '../types';

export function downloadBackup(data: AppData) {
  const payload = {
    ...data,
    exportedAt: new Date().toISOString(),
    app: 'edunex',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edunex-respaldo-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      reject(new Error('El archivo debe ser .json'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        resolve(normalizeAppData(parsed));
      } catch {
        reject(new Error('No se pudo leer el archivo JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Error al abrir el archivo'));
    reader.readAsText(file);
  });
}
