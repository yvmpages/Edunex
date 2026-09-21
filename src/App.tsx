import { useState } from 'react';
import { EdunexProvider, useEdunex } from './context/EdunexContext';
import { Sidebar } from './components/Sidebar';
import { AvancesPage } from './pages/AvancesPage';
import { ConceptosPage } from './pages/ConceptosPage';
import { NotasPage } from './pages/NotasPage';
import { PapeleraPage } from './pages/PapeleraPage';
import type { Section } from './types';

const META: Record<Section, { title: string; subtitle: string }> = {
  avances: {
    title: 'Avances',
    subtitle: 'Carpetas y material por tema o curso',
  },
  conceptos: {
    title: 'Conceptos',
    subtitle: 'Diccionario personal de términos',
  },
  notas: {
    title: 'Notas',
    subtitle: 'Apuntes y recordatorios libres',
  },
  papelera: {
    title: 'Papelera',
    subtitle: 'Restaura o elimina de forma permanente',
  },
};

function AppShell() {
  const { section, setSection } = useEdunex();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const meta = META[section];

  return (
    <div className="app-shell">
      <Sidebar
        section={section}
        onNavigate={setSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main">
        <header className="main-header">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <button
              type="button"
              className="menu-toggle"
              aria-label="Abrir menú"
              onClick={() => setSidebarOpen(true)}
            >
              Menú
            </button>
            <div>
              <h2>{meta.title}</h2>
              <p className="subtitle">{meta.subtitle}</p>
            </div>
          </div>
        </header>
        <main className="main-body">
          {section === 'avances' && <AvancesPage />}
          {section === 'conceptos' && <ConceptosPage />}
          {section === 'notas' && <NotasPage />}
          {section === 'papelera' && <PapeleraPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <EdunexProvider>
      <AppShell />
    </EdunexProvider>
  );
}
