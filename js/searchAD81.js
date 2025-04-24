import { AppState } from './state.js';
import { renderResults } from './renderer.js';
import { getRecordKey } from './utils.js';

let _s = '', _pg = 1, _ld = false;

function findAll81(o, k, acc = []) {
  if (Array.isArray(o)) {
    o.forEach(x => findAll81(x, k, acc));
  } else if (o && typeof o === 'object') {
    if (o.hasOwnProperty(k)) {
      acc.push(o[k]);
    }
    Object.values(o).forEach(v => findAll81(v, k, acc));
  }
  return acc;
}

export function createCardFromRecord(record, container) {
  const key = getRecordKey('AD81', record);

  const img = document.createElement('img');
  img.src = record.image_url || 'img/placeholder.png';

  const cont = document.createElement('div');
  cont.className = 'image-container';
  cont.appendChild(img);

  const logo = document.createElement('img');
  logo.src = 'img/logo_ad81.png';
  logo.className = 'logo-overlay';
  cont.appendChild(logo);

  const card = document.createElement('div');
  card.className = 'card';
  card.appendChild(cont);

  const h3 = document.createElement('h3');
  h3.textContent = (record.title || '').trim();
  card.appendChild(h3);

  if (record.ark_link) {
    const a = document.createElement('a');
    a.href = record.ark_link;
    a.textContent = 'Voir la fiche AD81';
    a.target = '_blank';
    card.appendChild(a);
  }

  const star = document.createElement('span');
  star.className = 'star-overlay';
  star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  star.style.cursor = 'pointer';
  star.addEventListener('click', e => {
    e.stopPropagation();
    if (AppState.favoris.has(key)) {
      AppState.favoris.delete(key);
      AppState.favoriteRecords.delete(key);
    } else {
      AppState.favoris.add(key);
      AppState.favoriteRecords.set(key, { source: 'AD81', record });
    }
    star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  });
  card.appendChild(star);

  cont.addEventListener('click', () => {/* modal */});
  container.appendChild(card);
}

export async function searchAD81(term) {
  _s = term;
  _pg = 1;
  _ld = false;
  AppState.records = [];
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad81/?query=${encodeURIComponent(term)}&page=1`;
  
  try {
    const r = await fetch(url);
    const d = await r.json();
    const total = parseInt(findAll81(d, 'nb_responses')[0], 10) || 0;
    AppState.objectsCount.AD81 = total;
    document.getElementById('count_AD81').textContent = `(${total})`;
    
    const recs = d.records || [];
    AppState.records = recs.map(r => ({source: 'AD81', record: r}));
    renderResults();
  } catch (e) {
    console.error(e);
  }
}

export async function loadMoreAD81() {
  if (_ld || !_s) return;
  _ld = true;
  
  if (AppState.records.filter(i => i.source === 'AD81').length >= AppState.objectsCount.AD81) {
    _ld = false;
    return;
  }
  
  _pg++;
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad81/?query=${encodeURIComponent(_s)}&page=${_pg}`;
  
  try {
    const r = await fetch(url);
    const d = await r.json();
    const more = d.records || [];
    AppState.records = AppState.records.concat(more.map(r => ({source: 'AD81', record: r})));
    renderResults();
  } catch (e) {
    console.error(e);
  } finally {
    _ld = false;
  }
}
