import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useEdunex } from '../context/EdunexContext';
import type { Concept } from '../types';

const LETTERS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

type SortOrder = 'az' | 'za';

function firstLetter(term: string): string {
  const ch = term.trim().charAt(0).toLocaleUpperCase('es');
  if (ch === 'Ñ') return 'Ñ';
  if (/[A-ZÁÉÍÓÚÜ]/.test(ch.normalize('NFD').replace(/\p{M}/gu, ''))) {
    const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
    return base === 'N' && ch.toLocaleUpperCase('es') === 'Ñ' ? 'Ñ' : base;
  }
  return '#';
}

export function ConceptosPage() {
  const { data, addConcept, updateConcept, deleteConcept } = useEdunex();
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('az');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);

  const detail = detailId
    ? data.conceptos.find((c) => c.id === detailId) ?? null
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...data.conceptos];

    if (letter !== 'all') {
      list = list.filter((c) => firstLetter(c.term) === letter);
    }

    if (q) {
      list = list.filter(
        (c) =>
          c.term.toLowerCase().includes(q) ||
          c.definition.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) =>
      a.term.localeCompare(b.term, 'es', { sensitivity: 'base' }),
    );
    if (sortOrder === 'za') list.reverse();
    return list;
  }, [data.conceptos, query, letter, sortOrder]);

  const availableLetters = useMemo(() => {
    const set = new Set(data.conceptos.map((c) => firstLetter(c.term)));
    return LETTERS.filter((l) => set.has(l));
  }, [data.conceptos]);

  const openNew = () => {
    setEditingId(null);
    setTerm('');
    setDefinition('');
    setFormOpen(true);
  };

  const openEdit = (c: Concept) => {
    setDetailId(null);
    setEditingId(c.id);
    setTerm(c.term);
    setDefinition(c.definition);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setTerm('');
    setDefinition('');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    if (editingId) {
      updateConcept(editingId, term, definition);
    } else {
      addConcept(term, definition);
    }
    closeForm();
  };

  useEffect(() => {
    if (!formOpen && !detailId) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setFormOpen(false);
        setDetailId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formOpen, detailId]);

  return (
    <div className="conceptos-page">
      <div className="concept-toolbar">
        <button type="button" className="btn btn-primary" onClick={openNew}>
          Nuevo concepto
        </button>

        <input
          className="input concept-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar conceptos"
        />

        <label className="field concept-filter-field">
          <span>Letra</span>
          <select
            className="select"
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            aria-label="Filtrar por letra"
          >
            <option value="all">Todas</option>
            {LETTERS.map((l) => (
              <option
                key={l}
                value={l}
                disabled={!availableLetters.includes(l)}
              >
                {l}
              </option>
            ))}
            {data.conceptos.some((c) => firstLetter(c.term) === '#') && (
              <option value="#">#</option>
            )}
          </select>
        </label>

        <label className="field concept-filter-field">
          <span>Orden</span>
          <select
            className="select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            aria-label="Ordenar conceptos"
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>
            {data.conceptos.length === 0
              ? 'Diccionario vacío'
              : 'Sin resultados'}
          </h3>
          <p>
            {data.conceptos.length === 0
              ? 'Pulsa «Nuevo concepto» para añadir tu primera palabra.'
              : 'Prueba otra letra, búsqueda u orden.'}
          </p>
        </div>
      ) : (
        <div className="concept-grid">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className="concept-card"
              onClick={() => setDetailId(c.id)}
            >
              <span className="concept-card-term">{c.term}</span>
            </button>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeForm}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="concept-form-title">
              {editingId ? 'Editar concepto' : 'Nuevo concepto'}
            </h3>
            <form onSubmit={onSubmit}>
              <div className="field" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="concept-term">Palabra</label>
                <input
                  id="concept-term"
                  className="input"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  required
                  placeholder="Término"
                  autoFocus
                />
              </div>
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="concept-def">Significado</label>
                <textarea
                  id="concept-def"
                  className="textarea"
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Definición o notas"
                  style={{ minHeight: '140px' }}
                />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={closeForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setDetailId(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="concept-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="concept-detail-title" className="concept-detail-term">
              {detail.term}
            </h3>
            <p className="concept-detail-def">
              {detail.definition.trim() ? (
                detail.definition
              ) : (
                <em>Sin definición</em>
              )}
            </p>
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
                onClick={() => openEdit(detail)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  deleteConcept(detail.id);
                  setDetailId(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
