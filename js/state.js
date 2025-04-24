// Centralise l'état de l'application
export const AppState = {
    searchTerm: '',
    records: [],            // array of { source: string, record: object }
    // On stocke désormais des clés (string) et non plus des objets
    favoris: new Set(),     // Set<string> of record keys
    favoriteRecords: new Map(),// Map<string,{source:string,record:object}>
    showFavorites: false,
    objectsCount: {
      Gallica: 0,
      AD31: 0,
      AD65: 0,
      AD81: 0
    }
  };