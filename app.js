(() => {
  const C = window.CROC_CONFIG || {};
  const has = k => Array.isArray(C[k]) ? C[k].length > 0 : !!(C[k] && String(C[k]).trim());
  // Show config-driven bits only when filled in
  document.querySelectorAll('[data-cfg-hide]').forEach(el => {
    if (has(el.dataset.cfgHide)) { el.removeAttribute('data-cfg-hide'); el.hidden = false; }
  });
  document.querySelectorAll('[data-cfg-text]').forEach(el => { if (has(el.dataset.cfgText)) el.textContent = C[el.dataset.cfgText]; });
  document.querySelectorAll('[data-cfg-mail]').forEach(a => { if (has('email')) { a.href = 'mailto:' + C.email; a.textContent = C.email; } });
  { const m = document.getElementById('mascot'); if (m) { if (!has('mascot')) m.hidden = true; else if (!(m.getAttribute('srcset') || '').includes(C.mascot)) { m.removeAttribute('srcset'); m.src = C.mascot; } } }
  if (has('photos')) {
    const g = document.getElementById('gal');
    C.photos.forEach(p => { const f = document.createElement('figure'); const i = new Image(); i.src = p.src; i.alt = p.alt || 'CROC Mobile Coloring project'; i.loading = 'lazy'; i.width = 800; i.height = 600; f.appendChild(i); g.appendChild(f); });
  }
  const yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  // Header + mobile bar state
  const hdr = document.querySelector('.hdr'), bar = document.getElementById('mbar');
  const onScroll = () => { const y = scrollY; hdr.classList.toggle('scrolled', y > 24); bar.classList.toggle('on', y > innerHeight * .55); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Scroll reveal
  const rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('in'));

  // Estimate form -> prefilled SMS
  const f = document.getElementById('est-form'); if (!f) return;
  const num = C.phoneE164 || '+16462171060';
  const fields = [['f-name', 'e-name', 'Please add your name.'], ['f-place', 'e-place', 'Please add an address or neighborhood.'], ['f-job', 'e-job', 'Please choose a type of job.']];
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    let first = null;
    fields.forEach(([id, eid, msg]) => {
      const el = document.getElementById(id), er = document.getElementById(eid), bad = !el.value.trim();
      el.setAttribute('aria-invalid', bad); er.textContent = bad ? msg : '';
      if (bad && !first) first = el;
    });
    if (first) { first.focus(); return; }
    const v = id => document.getElementById(id).value.trim();
    const body = ['Hi CROC Mobile Coloring! I\'d like a free estimate.', 'Name: ' + v('f-name'), 'Address/neighborhood: ' + v('f-place'), 'Job: ' + v('f-job')]
      .concat(v('f-det') ? ['Details: ' + v('f-det')] : []).join('\n');
    const href = 'sms:' + num + '?&body=' + encodeURIComponent(body);
    document.getElementById('fb-msg').textContent = body;
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform));
    if (!mobile) document.getElementById('fallback').hidden = false;
    location.href = href;
  });
  const cp = document.getElementById('copy');
  cp && cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(document.getElementById('fb-msg').textContent); cp.textContent = 'Copied ✓'; } catch { cp.textContent = 'Select the text above to copy'; }
  });
})();
