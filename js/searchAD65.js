import { AppState } from './state.js';
import { renderResults } from './renderer.js';
import { getRecordKey } from './utils.js';

let _t = '', _p = 1, _l = false;

function findAll65(o, k, r = []) {
  if (Array.isArray(o)) {
    o.forEach(x => findAll65(x, k, r));
  } else if (o && typeof o === 'object') {
    if (o.hasOwnProperty(k)) r.push(o[k]);
    Object.values(o).forEach(v => findAll65(v, k, r));
  }
  return r;
}

export function createCardFromRecord(record, container) {
  const key = getRecordKey('AD65', record);
  const img = document.createElement('img');
  img.src = record.image_url.replace(/\?size=!200,200/, '') || 'img/placeholder.png';
  
  const cont = document.createElement('div');
  cont.className = 'image-container';
  cont.appendChild(img);
  
  const logo = document.createElement('img');
  logo.src = 'img/logo_ad65.png';
  logo.className = 'logo-overlay';
  cont.appendChild(logo);
  
  const card = document.createElement('div');
  card.className = 'card';
  card.appendChild(cont);
  
  const h3 = document.createElement('h3');
  h3.textContent = record.title || '';
  card.appendChild(h3);
  
  if (record.ark_link) {
    const a = document.createElement('a');
    a.href = record.ark_link;
    a.textContent = 'Voir la fiche AD65';
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
      AppState.favoriteRecords.set(key, { source: 'AD65', record });
    }
    star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  });
  card.appendChild(star);
  
  cont.addEventListener('click', () => {/* modal */});
  container.appendChild(card);
}

export async function searchAD65(term) {
  _t = term;
  _p = 1;
  _l = false;
  AppState.records = [];
  
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad65/?query=${encodeURIComponent(term)}&page=1`;
  
  try {
    const r = await fetch(url);
    const d = await r.json();
    const total = parseInt(findAll65(d, 'nb_responses')[0], 10) || 0;
    
    AppState.objectsCount.AD65 = total;
    document.getElementById('count_AD65').textContent = `(${total})`;
    
    const recs = Array.isArray(d.records) ? d.records : [];
    AppState.records = recs.map(r => ({ source: 'AD65', record: r }));
    renderResults();
  } catch (e) {
    console.error(e);
  }
}

export async function loadMoreAD65() {
  if (_l || !_t) return;
  _l = true;
  
  if (AppState.records.filter(i => i.source === 'AD65').length >= AppState.objectsCount.AD65) {
    _l = false;
    return;
  }
  
  _p++;
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad65/?query=${encodeURIComponent(_t)}&page=${_p}`;
  
  try {
    const r = await fetch(url);
    const d = await r.json();
    const more = Array.isArray(d.records) ? d.records : [];
    
    AppState.records = AppState.records.concat(more.map(r => ({ source: 'AD65', record: r })));
    renderResults();
  } catch (e) {
    console.error(e);
  } finally {
    _l = false;
  }
}