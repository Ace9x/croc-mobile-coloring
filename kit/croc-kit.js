/* CROC variant kit: shared behaviour for /v2 and /v3 (config, reveals, sticky bar, SMS estimate, Zelle copy, color picker) */
(() => {
  const C = window.CROC_CONFIG || {};
  const has = k => Array.isArray(C[k]) ? C[k].length > 0 : !!(C[k] && String(C[k]).trim());
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-cfg-hide]').forEach(el => { if (has(el.dataset.cfgHide)) { el.removeAttribute('data-cfg-hide'); el.hidden = false; } });
  $$('[data-cfg-text]').forEach(el => { if (has(el.dataset.cfgText)) el.textContent = C[el.dataset.cfgText]; });
  $$('[data-cfg-mail]').forEach(w => { if (has('email')) { const a = document.createElement('a'); a.href = 'mailto:' + C.email; a.textContent = C.email; w.replaceWith(a); } });
  if (has('photos')) { const g = $('#gal'); g && C.photos.forEach(p => { const f = document.createElement('figure'), i = new Image(); i.src = (p.src.startsWith('img/') ? '../' : '') + p.src; i.alt = p.alt || 'CROC Mobile Coloring project'; i.loading = 'lazy'; i.width = 800; i.height = 600; f.appendChild(i); g.appendChild(f); }); }
  $$('.yr').forEach(y => y.textContent = new Date().getFullYear());

  // toast
  const toast = $('#toast'); let tt;
  const say = m => { if (!toast) return; toast.textContent = m; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2200); };

  // header + mobile bar
  const hdr = $('.hdr'), bar = $('#mbar');
  const onScroll = () => { const y = scrollY; hdr && hdr.classList.toggle('scrolled', y > 24); bar && bar.classList.toggle('on', y > innerHeight * .5); };
  addEventListener('scroll', onScroll, { passive: true }); requestAnimationFrame(onScroll);

  // reveals
  const rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  // copy (Zelle)
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = b.dataset.copy, lab = b.querySelector('.cl') || b, old = lab.textContent;
    try { await navigator.clipboard.writeText(v); lab.textContent = 'Copied ✓'; say('Zelle number 646-217-1060 copied'); }
    catch { lab.textContent = '646-217-1060'; say('Zelle: 646-217-1060'); }
    setTimeout(() => lab.textContent = old, 1800);
  }));

  // color picker: swatches recolor an illustration with a paint-roll wipe
  $$('[data-picker]').forEach(pk => {
    const art = $(pk.dataset.picker), name = $('[data-color-name]', pk.closest('section') || document);
    const wipe = art && art.querySelector('[data-wipe]'), base = art && art.querySelector('[data-base]'), roller = art && art.querySelector('[data-roller]');
    let cur = null, raf;
    const sw = $$('[data-color]', pk);
    const pick = (b, instant) => {
      sw.forEach(x => x.setAttribute('aria-pressed', x === b));
      const c = b.dataset.color, n = b.dataset.name; cur = { c, n };
      if (name) name.textContent = n;
      art.style.setProperty('--next', c);
      if (b.dataset.ink) art.style.setProperty('--on-wall', b.dataset.ink);
      if (!wipe || instant || reduce) { art.style.setProperty('--wall', c); if (wipe) wipe.setAttribute('width', 0); return; }
      cancelAnimationFrame(raf);
      const W = +wipe.dataset.w, X = +wipe.dataset.x, t0 = performance.now(), D = 900;
      roller && roller.classList.add('go');
      const step = t => { const p = Math.max(0, Math.min(1, (t - t0) / D)), e = 1 - Math.pow(1 - p, 3); wipe.setAttribute('width', W * e); roller && roller.setAttribute('transform', `translate(${X + W * e} 0)`);
        if (p < 1) raf = requestAnimationFrame(step); else { art.style.setProperty('--wall', c); wipe.setAttribute('width', 0); roller && roller.classList.remove('go'); } };
      raf = requestAnimationFrame(step);
    };
    sw.forEach(b => b.addEventListener('click', () => pick(b)));
    const first = sw.find(b => b.getAttribute('aria-pressed') === 'true') || sw[0]; first && pick(first, true);
    const use = $('[data-use-color]', pk.closest('section') || document);
    use && use.addEventListener('click', () => {
      const d = $('#f-det'); if (!cur || !d) return;
      const line = 'Color idea: ' + cur.n;
      d.value = d.value.replace(/^Color idea: .*$/m, '').trim(); d.value = (line + (d.value ? '\n' + d.value : ''));
      $('#estimate').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => $('#f-name').focus({ preventScroll: true }), reduce ? 0 : 700);
      say('“' + cur.n + '” added to your estimate');
    });
  });

  // before/after slider
  $$('[data-ba]').forEach(ba => {
    const r = $('input[type=range]', ba); if (!r) return;
    const set = () => ba.style.setProperty('--pos', r.value + '%'); r.addEventListener('input', set); set();
    if (!reduce && 'IntersectionObserver' in window) { // one gentle sweep the first time it scrolls into view, so people see it moves
      let touched = false; r.addEventListener('pointerdown', () => touched = true, { once: true });
      const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); const t0 = performance.now(), D = 2200;
        const st = t => { if (touched) return; const p = Math.max(0, Math.min(1, (t - t0) / D)); r.value = 50 + Math.sin(p * Math.PI * 2) * 22; set(); if (p < 1) requestAnimationFrame(st); else { r.value = 50; set(); } };
        setTimeout(() => requestAnimationFrame(st), 500); }, { threshold: .5 });
      io.observe(ba);
    }
  });

  // estimate form -> prefilled SMS
  const f = $('#est-form'); if (!f) return;
  const num = C.phoneE164 || '+16462171060';
  const fields = [['f-name', 'e-name', 'Please add your name.'], ['f-place', 'e-place', 'Please add an address or neighborhood.'], ['f-job', 'e-job', 'Please choose a type of job.']];
  f.addEventListener('submit', ev => {
    ev.preventDefault(); let first = null;
    fields.forEach(([id, eid, msg]) => { const el = document.getElementById(id), er = document.getElementById(eid), bad = !el.value.trim(); el.setAttribute('aria-invalid', bad); er.textContent = bad ? msg : ''; if (bad && !first) first = el; });
    if (first) { first.focus(); return; }
    const v = id => document.getElementById(id).value.trim();
    const body = ["Hi CROC Mobile Coloring! I'd like a free estimate.", 'Name: ' + v('f-name'), 'Address/neighborhood: ' + v('f-place'), 'Job: ' + v('f-job')].concat(v('f-det') ? ['Details: ' + v('f-det')] : []).join('\n');
    $('#fb-msg').textContent = body;
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
    if (!mobile) $('#fallback').hidden = false;
    location.href = 'sms:' + num + '?&body=' + encodeURIComponent(body);
  });
  const cp = $('#copy');
  cp && cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#fb-msg').textContent); cp.textContent = 'Copied ✓'; } catch { cp.textContent = 'Select the text above to copy'; } });
})();
