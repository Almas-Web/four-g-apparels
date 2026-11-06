/* Theme handling. Loaded in <head> so the saved theme applies before first paint. */
(() => {
  'use strict';

  const KEY = 'fg-theme';
  const THEMES = [
    { id: 'navy',  label: 'Navy',        c1: '#0b1437', c2: '#e11d2e' },
    { id: 'red',   label: 'Classic Red', c1: '#8f0f1d', c2: '#f2a900' },
    { id: 'green', label: 'Eco Green',   c1: '#0f3d2e', c2: '#c8e04a' },
    { id: 'dark',  label: 'Dark',        c1: '#070b1f', c2: '#ff4d5e' }
  ];
  const ids = THEMES.map((t) => t.id);
  const root = document.documentElement;

  root.classList.remove('no-js');
  root.classList.add('js');

  // Only whitelisted values are ever read back from storage
  const read = () => {
    try {
      const v = localStorage.getItem(KEY);
      return ids.includes(v) ? v : null;
    } catch (e) { return null; }
  };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } };
  const apply = (id) => root.setAttribute('data-theme', id);

  apply(read() || 'navy');

  document.addEventListener('DOMContentLoaded', () => {
    const box = document.querySelector('[data-themes]');
    if (!box) return;
    const list = box.querySelector('.themes__list');
    const toggle = box.querySelector('.themes__toggle');

    const items = THEMES.map((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.setAttribute('aria-label', t.label + ' theme');
      b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--c1', t.c1);
      b.style.setProperty('--c2', t.c2);
      b.addEventListener('click', () => { apply(t.id); write(t.id); sync(); });
      list.appendChild(b);
      return { b, t };
    });

    function sync() {
      const cur = root.getAttribute('data-theme');
      items.forEach(({ b, t }) => b.setAttribute('aria-pressed', String(t.id === cur)));
    }
    sync();

    const setOpen = (open) => {
      box.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!box.classList.contains('is-open')));
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  });
})();