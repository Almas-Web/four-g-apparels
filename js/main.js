/* Four-G Apparels - main interactions (no innerHTML, no inline handlers) */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const curtain = $('.curtain');
  const nav = $('.nav');
  const bar = $('.progress');
  const burger = $('.burger');
  const menu = $('.menu');
  const stepsEl = $('.steps');
  const FLAG = 'fg-transition';

  /* ---------- Stagger index for children ---------- */
  $$('[data-stagger]').forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => child.style.setProperty('--i', i));
  });

  /* ---------- Broken image fallback ---------- */
  $$('img').forEach((img) => {
    const hide = () => img.classList.add('is-broken');
    img.addEventListener('error', hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  /* ---------- Contact details assembled at runtime (light scraper protection) ---------- */
  $$('[data-mail]').forEach((a) => {
    const addr = a.dataset.user + '@' + a.dataset.domain;
    a.href = 'mailto:' + addr;
    a.textContent = addr;
  });
  $$('[data-tel]').forEach((a) => {
    a.href = 'tel:' + a.dataset.tel;
    a.textContent = a.dataset.display || a.dataset.tel;
  });
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Page transition: enter ---------- */
  (function enter() {
    if (!curtain || reduce) return;
    let flagged = false;
    try {
      flagged = sessionStorage.getItem(FLAG) === '1';
      sessionStorage.removeItem(FLAG);
    } catch (e) { /* ignore */ }
    if (!flagged) return;
    curtain.style.transition = 'none';
    curtain.classList.add('is-covering');
    void curtain.offsetWidth;
    curtain.style.transition = '';
    requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.remove('is-covering')));
  })();

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && curtain) curtain.classList.remove('is-covering');
  });

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  }
  if (burger) burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Page transition: leave ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;

    let url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    if (!/^https?:|^file:/.test(url.protocol)) return;
    if (url.pathname === window.location.pathname) return; // same page or anchor
    if (reduce || !curtain) return;

    e.preventDefault();
    setMenu(false);
    try { sessionStorage.setItem(FLAG, '1'); } catch (err) { /* ignore */ }
    curtain.classList.add('is-covering');
    window.setTimeout(() => { window.location.href = url.href; }, 780);
  });

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = $$('[data-reveal], .stitch');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Counters ---------- */
  function runCount(el) {
    const to = Number(el.dataset.count) || 0;
    if (reduce) { el.textContent = String(to); return; }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(runCount);
  }

  /* ---------- Scroll: navbar, progress, process thread ---------- */
  function updateSteps() {
    if (!stepsEl) return;
    const r = stepsEl.getBoundingClientRect();
    const mid = window.innerHeight * 0.6;
    const p = clamp((mid - r.top) / r.height, 0, 1);
    stepsEl.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    $$('.step', stepsEl).forEach((s) => {
      s.classList.toggle('is-active', s.getBoundingClientRect().top < mid);
    });
  }
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 24);
    if (bar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    }
    updateSteps();
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Card tilt + pointer spotlight ---------- */
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (!reduce) {
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 8).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 10).toFixed(2) + 'deg) translateY(-6px)';
      }
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.25).toFixed(1) + 'px,' + (y * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Hero parallax ---------- */
  const hero = $('[data-parallax]');
  if (hero && fine && !reduce) {
    const items = $$('[data-depth]', hero);
    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(hero);
    }
    (function loop() {
      if (visible) {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        items.forEach((it) => {
          const d = Number(it.dataset.depth) || 0;
          it.style.transform = 'translate3d(' + (cx * d).toFixed(2) + 'px,' + (cy * d).toFixed(2) + 'px,0)';
        });
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Custom cursor ---------- */
  if (fine) {
    const ring = $('.cursor');
    const dot = $('.cursor-dot');
    if (ring && dot) {
      document.body.classList.add('has-cursor');
      let x = window.innerWidth / 2, y = window.innerHeight / 2, rx = x, ry = y;
      window.addEventListener('pointermove', (e) => {
        x = e.clientX; y = e.clientY;
        dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }, { passive: true });
      (function loop() {
        rx += (x - rx) * 0.18;
        ry += (y - ry) * 0.18;
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        requestAnimationFrame(loop);
      })();
      document.addEventListener('pointerover', (e) => {
        ring.classList.toggle('is-hover', Boolean(e.target.closest('a, button, [data-tilt], input, textarea, select')));
      });
    }
  }

  /* ---------- Back to top ---------- */
  $$('.to-top').forEach((b) => {
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  });
})();