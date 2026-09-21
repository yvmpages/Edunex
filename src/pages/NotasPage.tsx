import { FolderGridPage } from '../components/FolderGridPage';

export function NotasPage() {
  return (
    <FolderGridPage
      tree="notas"
      rootLabel="Notas"
      docButtonLabel="Nueva nota"
      docSingular="nota"
      emptyTitle="Sin notas aquí"
      emptyText="Crea una nota o una carpeta para empezar."
      searchAriaLabel="Buscar notas"
    />
  );
}
