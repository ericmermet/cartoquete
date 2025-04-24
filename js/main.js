let searchTerm = ''
let totalResults = 0;
let chargementEnCours = false;
let nextPage = 1;
let favoris = new Set();

// Structure pour compter les objets par producteurs
let objectsCount = {
    Gallica: 0,
    AD31: 0,
    AD65: 0,
    AD81: 0
};