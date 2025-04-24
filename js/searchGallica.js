import { AppState } from './state.js';
import { getRecordKey } from './utils.js';
import { renderResults } from './renderer.js';

let _searchTerm = '';
let _nextRecordPosition = 1;
let _loading = false;

/**
 * Parcourt un JSON pour extraire toutes les valeurs de la clé spécifiée
 */
function findAll(obj, key, res = []) {
  if (Array.isArray(obj)) {
    obj.forEach(o => findAll(o, key, res));
  } else if (obj && typeof obj === 'object') {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      res.push(obj[key]);
    }
    Object.values(obj).forEach(v => findAll(v, key, res));
  }
  return res;
}

/**
 * Affiche une modale pour la vue haute résolution
 */
function showModal({ title, highres, uri, key, record }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'modal-close';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.padding = '8px 12px';
  closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '4px';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.addEventListener('click', () => document.body.removeChild(backdrop));
  modal.appendChild(closeBtn);

  // étoile favoris
  const modalStar = document.createElement('span');
  modalStar.className = 'modal-star';
  modalStar.textContent = AppState.favoris.has(key) ? '★' : '☆';
  modalStar.addEventListener('click', e => {
    e.stopPropagation();
    if (AppState.favoris.has(key)) {
      AppState.favoris.delete(key);
      AppState.favoriteRecords.delete(key);
    } else {
      AppState.favoris.add(key);
      AppState.favoriteRecords.set(key, { source: 'Gallica', record });
    }
    modalStar.textContent = AppState.favoris.has(key) ? '★' : '☆';
  });
  modal.appendChild(modalStar);

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'modal-image-wrapper';

  const img = document.createElement('img');
  img.src = highres;
  img.alt = title;
  imgWrapper.appendChild(img);

  const btnContainer = document.createElement('div');
  btnContainer.className = 'modal-buttons';

  const dl = document.createElement('a');
  dl.href = highres;
  dl.download = title;
  dl.target = '_blank';
  dl.textContent = 'Télécharger';
  btnContainer.appendChild(dl);

  if (uri) {
    const geo = document.createElement('a');
    geo.href = `https://app.ptm.huma-num.fr/galligeo/ggo.html?ark=${encodeURIComponent(uri)}`;
    geo.target = '_blank';
    geo.textContent = 'Géoréférencer';
    btnContainer.appendChild(geo);
  }

  imgWrapper.appendChild(btnContainer);
  modal.appendChild(imgWrapper);

  const titleEl = document.createElement('div');
  titleEl.className = 'modal-title';
  titleEl.textContent = title;
  modal.appendChild(titleEl);

  const noteLink = document.createElement('a');
  noteLink.className = 'modal-note';
  noteLink.href = `https://gallica.bnf.fr/ark:/12148/${uri}`;
  noteLink.target = '_blank';
  noteLink.textContent = 'Voir la notice Gallica';
  modal.appendChild(noteLink);

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

/**
 * Crée et insère une carte pour un enregistrement Gallica
 */
export function createCardFromRecord(record, container) {
  // Normaliser extraRecordData (tableau ou objet)
  const rawExtra = record['srw:extraRecordData'];
  const extra = Array.isArray(rawExtra) ? rawExtra[0] : (rawExtra || {});
  const thumb = extra.lowres || extra.highres || 'img/placeholder.png';
  const key = getRecordKey('Gallica', record);

  // Créer la card
  const card = document.createElement('div');
  card.className = 'card';
  
  const imgCont = document.createElement('div');
  imgCont.className = 'image-container';

  // Image principale
  const img = document.createElement('img');
  img.src = thumb;
  img.alt = '';
  imgCont.appendChild(img);

  // Logo Gallica
  const logo = document.createElement('img');
  logo.src = 'img/logo_gallica.png';
  logo.className = 'logo-overlay';
  imgCont.appendChild(logo);

  // Étoile favoris
  const star = document.createElement('span');
  star.className = 'star-overlay';
  star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  star.addEventListener('click', e => {
    e.stopPropagation();
    if (AppState.favoris.has(key)) {
      AppState.favoris.delete(key);
      AppState.favoriteRecords.delete(key);
    } else {
      AppState.favoris.add(key);
      AppState.favoriteRecords.set(key, { source: 'Gallica', record });
    }
    star.textContent = AppState.favoris.has(key) ? '★' : '☆';
  });
  imgCont.appendChild(star);

  card.appendChild(imgCont);

  // Titre
  const titleNode = record['srw:recordData']?.['oai_dc:dc']?.['dc:title'];
  let title = '';
  if (typeof titleNode === 'string') title = titleNode;
  else if (titleNode && typeof titleNode === 'object') {
    title = Object.values(titleNode)
      .filter(v => typeof v === 'string')
      .join(' ');
  }
  if (title.length > 70) title = title.slice(0, 70) + ' [...]';

  const h3 = document.createElement('h3');
  h3.textContent = title;
  card.appendChild(h3);

  imgCont.addEventListener('click', () => showModal({ 
    title, 
    highres: extra.highres, 
    uri: extra.uri,
    key,
    record
  }));
  
  container.appendChild(card);
}

/**
 * Recherche Gallica initiale
 */
export async function searchGallica(term) {
  _searchTerm = term;
  _nextRecordPosition = 1;     // init offset à 1 et non à 0
  _loading = false;
  AppState.records = [];
  
  const url = `https://api.ptm.huma-num.fr/metacarte/search/gallica/?query=${encodeURIComponent(term)}`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const total = parseInt(findAll(data, 'srw:numberOfRecords')[0], 10) || 0;
    AppState.objectsCount.Gallica = total;
    document.getElementById('count_Gallica').textContent = `(${total})`;
    _nextRecordPosition = parseInt(findAll(data, 'srw:nextRecordPosition')[0], 10) || total;

    // Aplatir et filtrer doublons
    let recs = findAll(data, 'srw:record').flat();
    const existing = new Set();
    const unique = recs.filter(r => {
      const k = getRecordKey('Gallica', r);
      if (existing.has(k)) return false;
      existing.add(k);
      return true;
    });
    
    AppState.records = unique.map(r => ({ source: 'Gallica', record: r }));
    renderResults();
  } catch(err) {
    console.error('Erreur recherche Gallica:', err);
  }
}

/**
 * Chargement pagination
 */
export async function loadMoreGallica() {
  console.log('loadMoreGallica:', _loading, _searchTerm);
  
  if (_loading || !_searchTerm) return;
  
  const gal = AppState.records.filter(i => i.source === 'Gallica');
  if (gal.length >= AppState.objectsCount.Gallica) {
    _loading = false;
    return;
  }
  
  _loading = true;
  
  const url = `https://api.ptm.huma-num.fr/metacarte/search/gallica/?query=${encodeURIComponent(_searchTerm)}&page=${_nextRecordPosition}`;
  
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    let recs = findAll(data, 'srw:record').flat();
    
    console.log('loadMoreGallica:', {length: recs.length});

    //liste des titres
    const titles = recs.map(r => {
      const titleNode = r['srw:recordData']?.['oai_dc:dc']?.['dc:title'];
      let title = '';
      if (typeof titleNode === 'string') title = titleNode;
      else if (titleNode && typeof titleNode === 'object') {
        title = Object.values(titleNode)
          .filter(v => typeof v === 'string')
          .join(' ');
      }
      return title;
    }
    );
    console.log('loadMoreGallica:', titles);
    
    if (recs.length === 0) {
      _loading = false;
      return;
    }
    
    _nextRecordPosition = parseInt(findAll(data, 'srw:nextRecordPosition')[0], 10)
                          || (_nextRecordPosition + recs.length);
    
    const existing = new Set(AppState.records.map(i => getRecordKey(i.source, i.record)));
    const unique = recs.filter(r => !existing.has(getRecordKey('Gallica', r)));
    
    AppState.records = AppState.records.concat(
      unique.map(r => ({ source: 'Gallica', record: r }))
    );
    
    renderResults();
  } catch(err) {
    console.error('Erreur loadMore:', err);
  } finally {
    _loading = false;
  }
}
