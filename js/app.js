(function () {
  const { esc, parts, midnight, keyOf, time, dateLong, dateShort, occurrences, timeRange, placeholder, DAY } = PX;
  const shop = PROXIED.shop;
  const $ = (s) => document.querySelector(s);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DOWS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const svg = (px, body, extra = '') => `<svg ${extra} width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const igIcon = (px) => svg(px, '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/>', 'class="ig"');
  const pinIcon = svg(16, '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>');
  const phoneIcon = svg(16, '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>');

  let events = [], games = {};
  const gameOf = (e) => (e.game_id && games[e.game_id]) || null;
  const imgOf = (e) => e.image_url || (gameOf(e) && gameOf(e).image_url) || '';
  const iconOf = (e) => { // small badge for calendar chips
    const g = gameOf(e); if (!g) return '';
    return g.image_url ? `<img class="gicon" src="${esc(g.image_url)}" alt="${esc(g.name)}">` : `<span class="gicon gi-txt" title="${esc(g.name)}">${esc(g.name.charAt(0))}</span>`;
  };
  const now = parts(Date.now());
  let view = { y: now.y, m: now.m };
  let monthOccs = [];

  /* ---------- static content ---------- */
  function renderStatic() {
    $('#intro').textContent = shop.intro;
    $('#tagline').textContent = shop.tagline;
    $('#about-text').innerHTML = shop.about.map(p => `<p>${esc(p)}</p>`).join('');
    $('#pills').innerHTML = shop.games.map(g => `<span class="sticker">${esc(g)}</span>`).join('');

    // scrolling game ticker
    const base = shop.games && shop.games.length ? shop.games : ['Cards', 'TTRPG', 'And more'];
    const seq = base.concat(base, base).map(g => `<span>${esc(g)}</span><i></i>`).join('');
    $('#mq-track').innerHTML = seq + seq;

    // big address + ticket-stub info cards
    if (shop.address) {
      const [street, ...rest] = shop.address.split(',');
      $('#big-addr').innerHTML = `<a class="big-addr" href="${esc(shop.mapsUrl || '#')}" target="_blank" rel="noopener"><small>Visit the shop</small>${esc(street)}<br><span style="color:var(--mint)">${esc(rest.join(',').trim())}</span></a>`;
    }
    const blocks = [];
    if (shop.address && shop.mapsUrl) blocks.push(`<div class="info"><h3>Directions</h3><p>${esc(shop.address)}</p><p><a href="${esc(shop.mapsUrl)}" target="_blank" rel="noopener">Open in Maps →</a></p></div>`);
    if (shop.hours && shop.hours.length) blocks.push(`<div class="info"><h3>Hours</h3><ul>${shop.hours.map(h => `<li><span>${esc(h[0])}</span><span>${esc(h[1])}</span></li>`).join('')}</ul></div>`);
    if (shop.phone || shop.email) blocks.push(`<div class="info"><h3>Contact</h3><p>${shop.phone ? `<a href="tel:${esc(shop.phone)}">${esc(shop.phone)}</a><br>` : ''}${shop.email ? `<a href="mailto:${esc(shop.email)}">${esc(shop.email)}</a>` : ''}</p></div>`);
    const soc = Object.entries(shop.social || {}).filter(([, v]) => v);
    if (soc.length) blocks.push(`<div class="info"><h3>Follow</h3><div class="socials">${soc.map(([k, v]) => k === 'instagram'
      ? `<a class="ig-link" href="${esc(v)}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">${igIcon(40)}</a>`
      : `<a class="btn alt sm" href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`).join('')}</div></div>`);
    if (!blocks.length) blocks.push('<div class="info"><h3>Coming soon</h3><p>Address, hours and social links will be posted here shortly.</p></div>');
    $('#contact-grid').innerHTML = blocks.join('');

    $('#year').textContent = new Date().getFullYear();
    const tb = [];
    if (shop.address) tb.push(`<a href="${esc(shop.mapsUrl || '#contact')}" target="_blank" rel="noopener">${pinIcon} ${esc(shop.address)}</a>`);
    if (shop.phone) tb.push(`<a href="tel:${esc(shop.phone)}">${phoneIcon} ${esc(shop.phone)}</a>`);
    if (shop.social && shop.social.instagram) tb.push(`<a href="${esc(shop.social.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${igIcon(16)} @proxiedtcgs</a>`);
    $('#topbar').innerHTML = tb.join('');
    $('.topbar').hidden = !tb.length;
  }
  async function renderGallery() {
    let pics = (shop.gallery || []).slice();
    try { pics = pics.concat((await Store.listPhotos()).map(p => p.image_url)); } catch (e) {}
    $('#gallery-wrap').hidden = !pics.length;
    $('#gallery').innerHTML = pics.map((p, i) => `<button class="shot" data-pic="${esc(p)}" aria-label="View photo ${i + 1}"><img src="${esc(p)}" alt="Inside Proxied, photo ${i + 1}" loading="lazy"></button>`).join('');
  }

  /* ---------- upcoming (trading-card style) ---------- */
  function cardHTML(o) {
    const e = o.ev, p = parts(o.start), g = gameOf(e);
    return `<button class="tcard" data-ev="${esc(e.id)}" data-t="${o.start}"><div class="tc-in">
      <div class="tc-top"><h3>${esc(e.title)}</h3><span class="tc-date">${MON3[p.m]} ${p.d}</span></div>
      <div class="tc-art">${imgOf(e) ? `<img src="${esc(imgOf(e))}" alt="" loading="lazy">` : placeholder}</div>
      <div class="tc-type"><span>${g ? esc(g.name) : 'Event'}</span><span>${e.repeat_weekly ? 'Weekly' : 'One-time'}</span></div>
      <div class="tc-text"><b>${esc(dateShort(o.start))} · ${esc(timeRange(o))}</b><br>${esc(e.location || shop.defaultLocation)}</div>
    </div></button>`;
  }
  function rowHTML(o) {
    return `<button class="rowbtn" data-ev="${esc(o.ev.id)}" data-t="${o.start}"><b>${esc(o.ev.title)}</b><span>${esc(timeRange(o))}</span></button>`;
  }
  function renderUpcoming() {
    const t = Date.now();
    // Only events the admin marked "Feature in Upcoming Events" show here; section is hidden otherwise.
    const featured = events.filter(e => e.featured);
    const seen = new Set();   // one card per featured event (its next date), even if it repeats weekly
    const list = occurrences(featured, t - 3 * 3600e3, t + 120 * DAY)
      .filter(o => (o.end || o.start + 3 * 3600e3) > t)
      .filter(o => !seen.has(o.ev.id) && seen.add(o.ev.id)).slice(0, 8);
    $('#events').hidden = !list.length;
    $('#upcoming-list').innerHTML = list.map(cardHTML).join('');
    if (!list.length) $('#nav-events').setAttribute('href', '#calendar');
  }

  /* ---------- calendar ---------- */
  function renderCalendar() {
    const { y, m } = view;
    $('#cal-title').textContent = `${MONTHS[m]} ${y}`;
    $('#cal-side').textContent = MONTHS[m];
    const first = midnight(y, m, 1), next = midnight(m === 11 ? y + 1 : y, (m + 1) % 12, 1);
    monthOccs = occurrences(events, first, next);
    const byDay = {};
    monthOccs.forEach(o => (byDay[keyOf(o.start)] ||= []).push(o));
    const lead = parts(first).dow;
    const days = Math.round((next - first) / DAY);
    const total = Math.ceil((lead + days) / 7) * 7;
    const today = keyOf(Date.now());
    let h = DOWS.map(d => `<div class="dow"><span class="full">${d}</span><span class="abbr">${d.slice(0, 3)}</span></div>`).join('');
    for (let i = 0; i < total; i++) {
      const d = i - lead + 1;
      if (d < 1 || d > days) { h += '<div class="day off"></div>'; continue; }
      const k = `${y}-${m}-${d}`, list = byDay[k] || [];
      h += `<div class="day${k === today ? ' today' : ''}${list.length ? ' has' : ''}" data-day="${k}"><span class="num">${d}</span>` +
        list.map(o => `<button class="chip" data-ev="${esc(o.ev.id)}" data-t="${o.start}"><b>${iconOf(o.ev)}${esc(o.ev.title)}</b><small>${esc(time(o.start))}</small></button>`).join('') +
        (list.length ? `<div class="dots">${list.map(() => '<i></i>').join('')}</div>` : '') + '</div>';
    }
    $('#cal-grid').innerHTML = h;
  }

  /* ---------- modal ---------- */
  const modal = $('#modal'), sheet = $('#sheet-body');
  function openModal(html) { sheet.innerHTML = html; modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ''; if (location.hash) history.replaceState(null, '', location.pathname + location.search); }
  function showEvent(id, t) {
    const e = events.find(x => String(x.id) === String(id));
    if (!e) return;
    const start = t ? +t : Date.parse(e.starts_at);
    const dur = e.ends_at ? Date.parse(e.ends_at) - Date.parse(e.starts_at) : 0;
    const o = { ev: e, start, end: dur ? start + dur : null };
    const loc = e.location || shop.defaultLocation;
    const g = gameOf(e);
    openModal(`<div class="hero-img">${imgOf(e) ? `<img src="${esc(imgOf(e))}" alt="">` : placeholder}</div>
      <div class="content"><h3>${esc(e.title)}</h3><div class="meta">
      ${g ? `<div><span class="k">Game</span><span>${esc(g.name)}</span></div>` : ''}
      <div><span class="k">Date</span><span>${esc(dateLong(start))}</span></div>
      <div><span class="k">Time</span><span>${esc(timeRange(o))} (Arizona)</span></div>
      ${e.repeat_weekly ? '<div><span class="k">Repeats</span><span>Every week</span></div>' : ''}
      ${loc ? `<div><span class="k">Where</span><span>${esc(loc)}</span></div>` : ''}</div>
      ${e.description ? `<div class="desc">${esc(e.description)}</div>` : ''}</div>`);
    history.replaceState(null, '', `#event=${encodeURIComponent(e.id)}&t=${start}`);
  }
  function showDay(k) {
    const list = monthOccs.filter(o => keyOf(o.start) === k);
    if (!list.length) return;
    if (list.length === 1) return showEvent(list[0].ev.id, list[0].start);
    openModal(`<div class="content"><h3>${esc(dateLong(list[0].start))}</h3><div class="day-list">${list.map(rowHTML).join('')}</div></div>`);
  }

  document.addEventListener('click', (ev) => {
    const shot = ev.target.closest('[data-pic]');
    if (shot) { openModal(`<img src="${esc(shot.dataset.pic)}" alt="" style="width:100%;display:block">`); return; }
    const card = ev.target.closest('[data-ev]');
    if (card) { showEvent(card.dataset.ev, card.dataset.t); return; }
    const day = ev.target.closest('.day.has');
    if (day && window.matchMedia('(max-width:640px)').matches) showDay(day.dataset.day);
    if (ev.target.closest('[data-close]') || ev.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  $('#prev').onclick = () => { view = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 }; renderCalendar(); };
  $('#next').onclick = () => { view = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 }; renderCalendar(); };
  $('#today').onclick = () => { view = { y: now.y, m: now.m }; renderCalendar(); };

  /* ---------- scroll reveal ---------- */
  function reveal() {
    const els = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .08 });
    els.forEach(el => io.observe(el));
    setTimeout(() => els.forEach(el => el.classList.add('in')), 4000);   // safety net
  }

  /* ---------- hero logo tilts toward the pointer ---------- */
  (function () {
    const art = document.querySelector('.hero-art'), fx = document.querySelector('.logo-fx');
    if (!art || !fx || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    art.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      fx.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 40 + 'deg');
      fx.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5)) * 26 + 'deg');
    });
    art.addEventListener('pointerleave', () => { fx.style.setProperty('--ry', '0deg'); fx.style.setProperty('--rx', '0deg'); });
  })();

  /* ---------- init ---------- */
  renderStatic();
  renderGallery();
  reveal();
  (async function () {
    try { events = await Store.list(false); (await Store.listGames()).forEach(g => games[g.id] = g); }
    catch (e) { console.error(e); }
    renderUpcoming(); renderCalendar();
    const m = location.hash.match(/event=([^&]+)(?:&t=(\d+))?/);
    if (m) showEvent(decodeURIComponent(m[1]), m[2]);
  })();
})();
