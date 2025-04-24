import { AppState } from './state.js';
import { renderResults } from './renderer.js';

const favBtn = document.getElementById('filter-favorites');
if (!favBtn) {
  console.warn('#filter-favorites introuvable');
} else {

  favBtn.classList.add('star-top');

  const updateStar = () => {
    favBtn.textContent = AppState.showFavorites ? '★' : '☆';
    favBtn.title = AppState.showFavorites ? 'Voir tous' : 'Voir favoris';
  };
  updateStar();

  favBtn.addEventListener('click', () => {
    AppState.showFavorites = !AppState.showFavorites;
    favBtn.classList.toggle('active', AppState.showFavorites);
    updateStar();
    renderResults();
  });
}