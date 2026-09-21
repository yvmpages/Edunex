import { useRef, useState } from 'react';
import type { Section } from '../types';
import { useEdunex } from '../context/EdunexContext';
import { downloadBackup, readBackupFile } from '../utils/backup';

const ITEMS: { id: Section; label: string; mark: string }[] = [
  { id: 'avances', label: 'Avances', mark: '▤' },
  { id: 'conceptos', label: 'Conceptos', mark: 'Aa' },
  { id: 'notas', label: 'Notas', mark: '✎' },
  { id: 'papelera', label: 'Papelera', mark: '⌫' },
];

type SidebarProps = {
  section: Section;
  onNavigate: (s: Section) => void;
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ section, onNavigate, open, onClose }: SidebarProps) {
  const { data, replaceData } = useEdunex();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const onDownload = () => {
    downloadBackup(data);
    setStatus('Respaldo descargado');
  };

  const onUploadClick = () => {
    fileRef.current?.click();
  };

  const onFileChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const next = await readBackupFile(file);
      replaceData(next);
      setStatus('Copia cargada correctamente');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Error al cargar');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Edunex</h1>
          <p>Registro de aprendizajes</p>
        </div>
        <nav className="sidebar-nav" aria-label="Principal">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${section === item.id ? ' active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            >
              <span className="nav-mark" aria-hidden>
                {item.mark}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-backup">
          <p className="sidebar-backup-title">Copia de seguridad</p>
          <p className="sidebar-backup-text">
            Los datos se guardan en este navegador. Descarga o carga un archivo
            .json para respaldarlos.
          </p>
          <div className="sidebar-backup-actions">
            <button type="button" className="btn btn-sm" onClick={onDownload}>
              Descargar
            </button>
            <button type="button" className="btn btn-sm" onClick={onUploadClick}>
              Cargar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                void onFileChange(e.target.files);
              }}
            />
          </div>
          {status && <p className="sidebar-backup-status">{status}</p>}
        </div>

        <div className="sidebar-footer">Datos guardados en este dispositivo</div>
      </aside>
    </>
  );
}
