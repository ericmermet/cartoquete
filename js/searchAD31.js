import { AppState } from './state.js';
import { renderResults } from './renderer.js';
import { getRecordKey } from './utils.js';

let _term = '';
let _page = 1;
let _loading = false;

function findAll(obj, k, res = []) {
  if (Array.isArray(obj)) {
    obj.forEach(o => findAll(o, k, res));
  } else if (obj && typeof obj === 'object') {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      res.push(obj[k]);
    }
    Object.values(obj).forEach(v => findAll(v, k, res));
  }
  return res;
}

export function createCardFromRecord(record, container) {
  const key = getRecordKey('AD31', record);
  const imgCont = document.createElement('div');
  imgCont.className = 'image-container';
  
  const img = document.createElement('img');
  img.src = record.image_url || 'img/placeholder.png';
  imgCont.appendChild(img);
  
  const logo = document.createElement('img');
  logo.src = 'img/logo_ad31.png';
  logo.className = 'logo-overlay';
  imgCont.appendChild(logo);
  
  const card = document.createElement('div');
  card.className = 'card';
  card.appendChild(imgCont);
  
  const h3 = document.createElement('h3');
  let t = record.title || '';
  t = t.trim().replace(/^\(\d+\s*vues?\)\s*/, '');
  h3.textContent = t.length > 70 ? t.slice(0, 70) + ' [...]' : t;
  card.appendChild(h3);
  
  if (record.ark_link) {
    const a = document.createElement('a');
    a.href = 'https://archives.haute-garonne.fr' + record.ark_link;
    a.textContent = 'Voir la fiche AD31';
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
      AppState.favoriteRecords.set(key, { source: 'AD31', record });
    }
    star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  });
  card.appendChild(star);
  
  imgCont.addEventListener('click', () => {
    /* modal code omitted for brevity */
  });
  container.appendChild(card);
}

export async function searchAD31(term) {
  _term = term;
  _page = 1;
  _loading = false;
  AppState.records = [];
  
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad31/?query=${encodeURIComponent(term)}&page=1`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    const total = parseInt(findAll(d, 'nb_responses')[0], 10) || 0;
    AppState.objectsCount.AD31 = total;
    document.getElementById('count_AD31').textContent = `(${total})`;
    
    const recs = d.records || [];
    AppState.records = recs.map(r => ({ source: 'AD31', record: r }));
    renderResults();
  } catch (e) {
    console.error(e);
  }
}

export async function loadMoreAD31() {
  if (_loading || !_term) return;
  _loading = true;
  
  if (AppState.records.filter(i => i.source === 'AD31').length >= AppState.objectsCount.AD31) {
    _loading = false;
    return;
  }
  
  _page++;
  const url = `https://api.ptm.huma-num.fr/metacarte/search/ad31/?query=${encodeURIComponent(_term)}&page=${_page}`;
  
  try {
    const r = await fetch(url);
    const d = await r.json();
    const more = d.records || [];
    AppState.records = AppState.records.concat(more.map(r => ({ source: 'AD31', record: r })));
    renderResults();
  } catch (e) {
    console.error(e);
  } finally {
    _loading = false;
  }
}