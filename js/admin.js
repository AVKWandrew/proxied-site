(function () {
  const { esc, dateShort, time, toLocalInput, fromLocalInput } = PX;
  const $ = (s) => document.querySelector(s);
  let events = [], imageUrl = '';

  async function boot() {
    let s = null;
    try { s = await Store.session(); } catch (e) {}
    if (s) showDash(); else { $('#login').hidden = false; $('#dash').hidden = true; }
  }
  async function loadSettings() {
    const s = await Store.getSettings(), b = s.banner || {};
    $('#b-text').value = b.text || ''; $('#b-until').value = b.until || ''; $('#b-on').checked = !!b.on;
    $('#c-soon').checked = s.community_soon !== false;
    $('#banner-state').textContent = b.on && b.text ? 'On' : 'Off'; $('#banner-state').className = 'badge' + (b.on && b.text ? '' : ' off');
    const days = Array.isArray(s.hours_days) && s.hours_days.length === 7 ? s.hours_days : PROXIED.shop.hoursDays;
    $('#hours-rows').innerHTML = PX.DAYS.map((n, i) => { const d = days[i] || {}; return `<div class="hrow${d.closed ? ' off' : ''}" data-i="${i}">
      <b>${n}</b><input type="time" class="o" value="${d.open || '12:00'}" aria-label="${n} opens"><input type="time" class="c" value="${d.close || '20:00'}" aria-label="${n} closes">
      <label class="cl"><input type="checkbox" class="x" ${d.closed ? 'checked' : ''}> Closed</label></div>`; }).join('');
  }
  $('#c-soon').addEventListener('change', async () => {
    const m = $('#c-soon-msg'), box = $('#c-soon');
    try { await Store.saveSetting('community_soon', box.checked); m.textContent = box.checked ? '— showing' : '— hidden'; }
    catch (e) { box.checked = !box.checked; m.textContent = '— could not save'; }
    setTimeout(() => { m.textContent = ''; }, 2500);
  });
  $('#banner-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const err = $('#banner-err'); err.textContent = '';
    try {
      await Store.saveSetting('banner', { text: $('#b-text').value.trim(), until: $('#b-until').value || '', on: $('#b-on').checked });
      await loadSettings(); err.textContent = 'Saved ✓'; err.style.color = 'var(--cyan)'; setTimeout(() => { err.textContent = ''; err.style.color = ''; }, 2500);
    } catch (e) { err.textContent = e.message || 'Could not save.'; }
  });
  $('#hours-rows').addEventListener('change', (ev) => { const r = ev.target.closest('.hrow'); if (r) r.classList.toggle('off', r.querySelector('.x').checked); });
  $('#hours-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const err = $('#hours-err'); err.textContent = '';
    try {
      const days = [...document.querySelectorAll('#hours-rows .hrow')].map(r => ({ closed: r.querySelector('.x').checked, open: r.querySelector('.o').value, close: r.querySelector('.c').value }));
      const bad = days.findIndex(d => !d.closed && (!d.open || !d.close || d.close <= d.open));
      if (bad >= 0) throw new Error(PX.DAYS[bad] + ': closing time must be after opening time.');
      await Store.saveSetting('hours_days', days);
      await loadSettings(); err.textContent = 'Saved ✓'; err.style.color = 'var(--cyan)'; setTimeout(() => { err.textContent = ''; err.style.color = ''; }, 2500);
    } catch (e) { err.textContent = e.message || 'Could not save.'; }
  });

  async function showDash() {
    $('#login').hidden = true; $('#dash').hidden = false;
    $('#demo-banner').hidden = Store.live;
    await loadSettings();
    await refreshGames();
    await refreshPhotos();
    await refresh();
  }
  // Live calendar tab (iframe of the public page in calendar-only mode)
  function showTab(cal) {
    $('#cal-panel').hidden = !cal; $('#manage-panel').hidden = cal;
    $('#tab-cal').className = 'btn sm' + (cal ? '' : ' alt'); $('#tab-edit').className = 'btn sm' + (cal ? ' alt' : '');
    if (cal) reloadCal();
  }
  function reloadCal() { $('#cal-frame').src = '../?embed=1&_=' + Date.now(); }
  $('#tab-cal').onclick = () => showTab(true);
  $('#tab-edit').onclick = () => showTab(false);

  let games = [];
  async function refreshGames() {
    games = await Store.listGames();
    const sel = $('#f-game'), cur = sel.value;
    sel.innerHTML = '<option value="">— None —</option>' + games.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
    sel.value = cur;
    $('#games').innerHTML = games.length ? games.map(g => `
      <div class="ev"><div style="display:flex;align-items:center;gap:.7rem">
        ${g.image_url ? `<img src="${esc(g.image_url)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px">` : '<span class="gicon gi-txt" style="width:40px;height:40px;font-size:1.1rem">' + esc(g.name.charAt(0)) + '</span>'}
        <span class="t">${esc(g.name)}</span></div>
        <button class="btn danger sm" data-g="${esc(g.id)}">Delete</button></div>`).join('')
      : '<p class="muted">No games yet.</p>';
  }
  $('#game-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); $('#game-err').textContent = '';
    try {
      const f = $('#g-img').files[0];
      if (f && f.size > 5 * 1024 * 1024) throw new Error('Image is over 5 MB.');
      await Store.saveGame({ name: $('#g-name').value.trim(), image_url: f ? await Store.uploadImage(f) : null });
      $('#game-form').reset(); await refreshGames();
    } catch (e) { $('#game-err').textContent = e.message || 'Could not add game.'; }
  });
  $('#games').addEventListener('click', async (ev) => {
    const b = ev.target.closest('button[data-g]'); if (!b) return;
    if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Confirm?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Delete'; }, 4000); return; }
    try { await Store.removeGame(b.dataset.g); await refreshGames(); await refresh(); } catch (e) { alert(e.message); }
  });

  const PHOTO_SETS = [
    { kind: 'shop', grid: '#photos', form: '#photo-form', input: '#p-img', err: '#photo-err', btn: '#p-save' },
    { kind: 'community', grid: '#cphotos', form: '#cphoto-form', input: '#cp-img', err: '#cphoto-err', btn: '#cp-save' }
  ];
  async function refreshPhotos() {
    for (const s of PHOTO_SETS) {
      const photos = await Store.listPhotos(s.kind);
      $(s.grid).innerHTML = photos.length ? photos.map(p => `
        <div style="position:relative"><img src="${esc(p.image_url)}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block">
        <button class="btn danger sm" data-p="${esc(p.id)}" style="position:absolute;right:4px;bottom:4px;padding:.2rem .6rem">Delete</button></div>`).join('')
        : '<p class="muted" style="grid-column:1/-1;margin:0">No photos yet.</p>';
    }
    if (!$('#cal-panel').hidden) reloadCal();
  }
  for (const s of PHOTO_SETS) {
    $(s.form).addEventListener('submit', async (ev) => {
      ev.preventDefault(); const err = $(s.err); err.textContent = '';
      const btn = $(s.btn); btn.disabled = true; btn.textContent = 'Uploading…';
      try {
        for (const f of $(s.input).files) {
          if (f.size > 8 * 1024 * 1024) throw new Error(f.name + ' is over 8 MB — please use a smaller photo.');
          await Store.addPhoto(await Store.uploadImage(f), s.kind);
        }
        $(s.form).reset(); await refreshPhotos();
      } catch (e) { err.textContent = e.message || 'Could not upload.'; await refreshPhotos(); }
      btn.disabled = false; btn.textContent = '+ Upload photos';
    });
    $(s.grid).addEventListener('click', async (ev) => {
      const b = ev.target.closest('button[data-p]'); if (!b) return;
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Confirm?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Delete'; }, 4000); return; }
      try { await Store.removePhoto(b.dataset.p); await refreshPhotos(); } catch (e) { alert(e.message); }
    });
  }

  async function refresh() {
    try { events = await Store.list(true); } catch (e) { $('#list').innerHTML = `<p class="err">Could not load events: ${esc(e.message)}</p>`; return; }
    if (!$('#cal-panel').hidden) reloadCal();
    events.sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
    $('#list').innerHTML = events.length ? events.map(e => `
      <div class="ev"><div><div class="t">${esc(e.title)}<span class="badge${e.published ? '' : ' off'}">${e.published ? 'Live' : 'Draft'}</span>${e.featured ? '<span class="badge" style="background:var(--purple-lt);color:#fff">⭐ Featured</span>' : ''}</div>
      <div class="s">${esc(dateShort(Date.parse(e.starts_at)))} · ${esc(time(Date.parse(e.starts_at)))}${e.repeat_weekly ? ' · weekly' : ''}</div></div>
      <div class="actions"><button class="btn alt sm" data-a="edit" data-id="${esc(e.id)}">Edit</button>
      <button class="btn alt sm" data-a="toggle" data-id="${esc(e.id)}">${e.published ? 'Unpublish' : 'Publish'}</button>
      <button class="btn danger sm" data-a="del" data-id="${esc(e.id)}">Delete</button></div></div>`).join('')
      : '<p class="muted">No events yet. Click “New event”.</p>';
  }

  function clearForm() {
    $('#form').reset(); $('#f-id').value = ''; imageUrl = ''; $('#f-prev').hidden = true;
    $('#f-pub').checked = true; $('#until-wrap').hidden = true; $('#form-title').textContent = 'New event'; $('#form-err').textContent = '';
  }
  function fill(e) {
    clearForm();
    $('#form-title').textContent = 'Edit event';
    $('#f-id').value = e.id; $('#f-title').value = e.title;
    $('#f-start').value = toLocalInput(e.starts_at); $('#f-end').value = toLocalInput(e.ends_at);
    $('#f-loc').value = e.location || ''; $('#f-desc').value = e.description || '';
    $('#f-rep').checked = !!e.repeat_weekly; $('#until-wrap').hidden = !e.repeat_weekly;
    $('#f-until').value = e.repeat_until || ''; $('#f-pub').checked = !!e.published; $('#f-feat').checked = !!e.featured; $('#f-game').value = e.game_id || '';
    imageUrl = e.image_url || '';
    if (imageUrl) { $('#f-prev').src = imageUrl; $('#f-prev').hidden = false; }
    $('#form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); $('#login-err').textContent = '';
    try { await Store.signIn($('#em').value.trim(), $('#pw').value); showDash(); }
    catch (e) { $('#login-err').textContent = 'Sign-in failed. Check your email and password.'; }
  });
  $('#logout').onclick = async () => { await Store.signOut(); location.reload(); };
  $('#new').onclick = clearForm;
  $('#cancel').onclick = clearForm;
  $('#f-rep').onchange = (e) => { $('#until-wrap').hidden = !e.target.checked; };
  $('#f-img').onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    $('#f-prev').src = URL.createObjectURL(f); $('#f-prev').hidden = false;
  };

  $('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const err = $('#form-err'); err.textContent = '';
    const btn = $('#save'); btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const file = $('#f-img').files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Image is over 5 MB — please use a smaller file.');
        imageUrl = await Store.uploadImage(file);
      }
      const start = fromLocalInput($('#f-start').value), end = fromLocalInput($('#f-end').value);
      if (end && Date.parse(end) <= Date.parse(start)) throw new Error('End time must be after the start time.');
      const rep = $('#f-rep').checked;
      const row = {
        title: $('#f-title').value.trim(), description: $('#f-desc').value.trim(), location: $('#f-loc').value.trim(),
        starts_at: start, ends_at: end, image_url: imageUrl || null,
        repeat_weekly: rep, repeat_until: rep && $('#f-until').value ? $('#f-until').value : null,
        published: $('#f-pub').checked, featured: $('#f-feat').checked, game_id: $('#f-game').value || null
      };
      const id = $('#f-id').value; if (id) row.id = id;
      await Store.save(row);
      clearForm(); $('#f-img').value = ''; await refresh();
    } catch (e) { err.textContent = e.message || 'Could not save.'; }
    btn.disabled = false; btn.textContent = 'Save event';
  });

  $('#list').addEventListener('click', async (ev) => {
    const b = ev.target.closest('button[data-a]'); if (!b) return;
    const e = events.find(x => String(x.id) === b.dataset.id); if (!e) return;
    try {
      if (b.dataset.a === 'edit') fill(e);
      else if (b.dataset.a === 'toggle') { await Store.save(Object.assign({}, e, { published: !e.published })); await refresh(); }
      else if (b.dataset.a === 'del') {
        if (b.dataset.armed) { await Store.remove(e.id); await refresh(); }
        else { b.dataset.armed = '1'; b.textContent = 'Click again to confirm'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Delete'; }, 4000); }
      }
    } catch (er) { alert(er.message); }
  });

  boot();
})();
