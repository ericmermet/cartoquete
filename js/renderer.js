import { AppState } from './state.js';
import { getRecordKey } from './utils.js';
import { createCardFromRecord as renderGallica } from './searchGallica.js';
import { createCardFromRecord as renderAD31    } from './searchAD31.js';
import { createCardFromRecord as renderAD65    } from './searchAD65.js';
import { createCardFromRecord as renderAD81    } from './searchAD81.js';

export function renderResults() {
  const container = document.getElementById('results');
  container.innerHTML = '';

  let items;
  if (AppState.showFavorites) {
    items = Array.from(AppState.favoriteRecords.values());
  } else {
    items = AppState.records;
  }

  items.forEach(item => {
    switch (item.source) {
      case 'Gallica': renderGallica(item.record, container); break;
      case 'AD31':    renderAD31(item.record, container);    break;
      case 'AD65':    renderAD65(item.record, container);    break;
      case 'AD81':    renderAD81(item.record, container);    break;
    }
  });
}