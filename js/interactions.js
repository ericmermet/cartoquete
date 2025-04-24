import {
  searchGallica, loadMoreGallica,
  searchAD31, loadMoreAD31,
  searchAD65, loadMoreAD65,
  searchAD81, loadMoreAD81
} from './searchers/index.js';
import { renderResults } from './renderer.js';
import { AppState } from './state.js';

const resultsContainer = document.getElementById('results');
const sentinel = document.createElement('div');
sentinel.id = 'scroll-sentinel';
resultsContainer.after(sentinel);

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { 
    if (e.isIntersecting) loadNextPageThrottled(); 
  });
}, { rootMargin: '200px', threshold: 0.1 });

observer.observe(sentinel);
let isLoading = false;

const throttle = (fn, wait = 500) => {
  let last = 0;
  return (...a) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...a);
    }
  }
};

async function loadNextPage() { 
  if (isLoading) return;
  isLoading = true;
  
  const tasks = [];
  if (document.getElementById('cb_gallica').checked) tasks.push(loadMoreGallica());
  if (document.getElementById('cb_ad31').checked) tasks.push(loadMoreAD31());
  if (document.getElementById('cb_ad65').checked) tasks.push(loadMoreAD65());
  if (document.getElementById('cb_ad81').checked) tasks.push(loadMoreAD81());
  
  try { 
    await Promise.all(tasks);
    renderResults();
    resultsContainer.after(sentinel);
  } finally { 
    setTimeout(() => { isLoading = false; }, 300); 
  }
}

const loadNextPageThrottled = throttle(loadNextPage, 500);
const input = document.getElementById('searchInput');
const btn = document.getElementById('searchButton');

input.addEventListener('keypress', e => { 
  if (e.key === 'Enter') btn.click(); 
});

btn.addEventListener('click', async () => {
  const term = input.value.trim();
  if (!term) return;
  
  AppState.searchTerm = term;
  AppState.records = [];
  
  const proms = [
    document.getElementById('cb_gallica').checked && searchGallica(term),
    document.getElementById('cb_ad31').checked && searchAD31(term),
    document.getElementById('cb_ad65').checked && searchAD65(term),
    document.getElementById('cb_ad81').checked && searchAD81(term)
  ].filter(Boolean);
  
  await Promise.all(proms);
  renderResults();
  resultsContainer.after(sentinel);
});