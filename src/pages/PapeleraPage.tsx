import { useEdunex } from '../context/EdunexContext';

const SOURCE_LABEL: Record<string, string> = {
  avances: 'Avances',
  notas: 'Notas',
  conceptos: 'Conceptos',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function PapeleraPage() {
  const { data, restoreTrash, purgeTrash, emptyTrash } = useEdunex();

  return (
    <div>
      <div className="row" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className="btn btn-danger"
          disabled={data.trash.length === 0}
          onClick={() => emptyTrash()}
        >
          Vaciar papelera
        </button>
      </div>

      {data.trash.length === 0 ? (
        <div className="empty-state">
          <h3>Papelera vacía</h3>
          <p>
            Los elementos eliminados aparecerán aquí para restaurarlos o
            borrarlos definitivamente.
          </p>
        </div>
      ) : (
        <div className="trash-list">
          {data.trash.map((item) => (
            <div key={item.id} className="trash-item">
              <div>
                <div>
                  <span className="badge">
                    {SOURCE_LABEL[item.source] ?? item.source}
                  </span>
                  <strong>{item.label}</strong>
                </div>
                <div className="trash-meta">{formatDate(item.deletedAt)}</div>
              </div>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => restoreTrash(item.id)}
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => purgeTrash(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
