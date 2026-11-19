/* Data layer: Supabase when configured, otherwise a browser-only DEMO store. */
(function () {
  const cfg = window.PROXIED;
  // Add ?demo=1 to any page URL to preview the site with sample data instead of the live database.
  const live = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase) && !/[?&]demo=1/.test(location.search);
  const sb = live ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const DEMO_KEY = 'proxied_demo_events_v4';
  const art = (a, b, shapes) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>${shapes}</svg>`);
  const ART = {
    g1: art('#2EB6AB', '#531E89', '<circle cx="200" cy="150" r="95" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="10"/><circle cx="200" cy="150" r="52" fill="#fff" fill-opacity=".85"/>'),
    g2: art('#8d55e6', '#2EB6AB', '<polygon points="200,45 300,150 200,255 100,150" fill="#fff" fill-opacity=".85"/><polygon points="200,95 250,150 200,205 150,150" fill="#531E89" fill-opacity=".6"/>'),
    g3: art('#531E89', '#14101c', '<polygon points="200,40 290,95 290,205 200,260 110,205 110,95" fill="#2EB6AB"/><polygon points="200,90 255,185 145,185" fill="#14101c" fill-opacity=".4"/><text x="200" y="175" text-anchor="middle" font-size="54" font-weight="700" fill="#fff" font-family="Arial Black,sans-serif">20</text>')
  };
  const DEMO_PHOTOS = [art('#8d55e6', '#2EB6AB', '<rect x="60" y="170" width="280" height="14" fill="#fff" fill-opacity=".7"/><rect x="90" y="100" width="60" height="70" fill="#fff" fill-opacity=".6"/><rect x="170" y="80" width="60" height="90" fill="#fff" fill-opacity=".6"/><rect x="250" y="120" width="60" height="50" fill="#fff" fill-opacity=".6"/>'),
    art('#2EB6AB', '#531E89', '<circle cx="120" cy="150" r="48" fill="#fff" fill-opacity=".7"/><circle cx="210" cy="150" r="48" fill="#fff" fill-opacity=".5"/><circle cx="300" cy="150" r="48" fill="#fff" fill-opacity=".3"/>'),
    art('#531E89', '#8d55e6', '<polygon points="60,230 160,90 220,180 270,120 350,230" fill="#fff" fill-opacity=".65"/>')];
  const OFF = 7 * 3600e3, DAY = 86400e3; // Arizona = UTC-7, no daylight saving

  function seedDemo() {
    // next Wed/Fri/Sat/Sun at given Phoenix hour
    const now = Date.now();
    const p = new Date(now - OFF);
    const base = Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate()) + OFF;
    const nextDow = (dow, hr, min = 0) => {
      let d = base, cur = new Date(d - OFF).getUTCDay();
      d += ((dow - cur + 7) % 7) * DAY;
      return new Date(d + hr * 3600e3 + min * 60e3).toISOString();
    };
    const end = (iso, h) => new Date(Date.parse(iso) + h * 3600e3).toISOString();
    const mk = (id, title, dow, hr, dur, desc, extra = {}) => {
      const s = nextDow(dow, hr);
      return Object.assign({ id, title, description: desc, location: '', starts_at: s, ends_at: end(s, dur),
        image_url: '', repeat_weekly: true, repeat_until: null, published: true }, extra);
    };
    return [
      mk('d1', 'Riftbound', 3, 18, 3, 'Weekly Riftbound play. All skill levels welcome — bring a deck or borrow one.\nEntry: $5', { game_id: 'g1', featured: true }),
      mk('d3', 'Pokémon League', 6, 13, 3, 'Kids and adults welcome. Trade, battle, and earn League stamps.', { game_id: 'g2', featured: true }),
      mk('d4', 'D&D One-Shots', 0, 14, 4, 'Drop-in one-shot adventures. Pre-gens provided. Sign up at the counter.', { game_id: 'g3' })
    ];
  }
  const demoLoad = () => {
    try { const v = JSON.parse(localStorage.getItem(DEMO_KEY)); if (v) return v; } catch (e) {}
    const s = seedDemo(); demoSave(s); return s;
  };
  const demoSave = (v) => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(v)); } catch (e) {} };

  const GAMES_KEY = 'proxied_demo_games_v2';
  const gamesLoad = () => {
    try { const v = JSON.parse(localStorage.getItem(GAMES_KEY)); if (v) return v; } catch (e) {}
    const s = [{ id: 'g1', name: 'Riftbound', image_url: ART.g1 }, { id: 'g2', name: 'Pokémon', image_url: ART.g2 }, { id: 'g3', name: 'Dungeons & Dragons', image_url: ART.g3 }];
    gamesSave(s); return s;
  };
  const gamesSave = (v) => { try { localStorage.setItem(GAMES_KEY, JSON.stringify(v)); } catch (e) {} };

  const PHOTOS_KEY = 'proxied_demo_photos_v2';
  const photosLoad = () => {
    try { const v = JSON.parse(localStorage.getItem(PHOTOS_KEY)); if (v) return v; } catch (e) {}
    const s = DEMO_PHOTOS.map((u, i) => ({ id: 'p' + i, image_url: u })); photosSave(s); return s;
  };
  const photosSave = (v) => { try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(v)); } catch (e) {} };

  window.Store = {
    live,
    async listPhotos() {
      if (!live) return photosLoad();
      const { data, error } = await sb.from('photos').select('*').order('created_at');
      if (error) { console.warn(error); return []; }
      return data;
    },
    async addPhoto(image_url) {
      if (!live) { const v = photosLoad(); v.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 5), image_url }); photosSave(v); return; }
      const { error } = await sb.from('photos').insert({ image_url });
      if (error) throw error;
    },
    async removePhoto(id) {
      if (!live) { photosSave(photosLoad().filter(p => p.id !== id)); return; }
      const { error } = await sb.from('photos').delete().eq('id', id);
      if (error) throw error;
    },
    async listGames() {
      if (!live) return gamesLoad();
      const { data, error } = await sb.from('games').select('*').order('name');
      if (error) { console.warn(error); return []; }
      return data;
    },
    async saveGame(g) {
      if (!live) { const v = gamesLoad(); if (g.id) v[v.findIndex(x => x.id === g.id)] = g; else { g.id = 'g' + Date.now(); v.push(g); } gamesSave(v); return g; }
      const row = Object.assign({}, g); if (!row.id) delete row.id;
      const { data, error } = await sb.from('games').upsert(row).select().single();
      if (error) throw error; return data;
    },
    async removeGame(id) {
      if (!live) { gamesSave(gamesLoad().filter(g => g.id !== id)); return; }
      const { error } = await sb.from('games').delete().eq('id', id);
      if (error) throw error;
    },
    async list(all = false) {
      if (!live) { const v = demoLoad(); return all ? v : v.filter(e => e.published); }
      let q = sb.from('events').select('*').order('starts_at');
      if (!all) q = q.eq('published', true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async save(ev) {
      if (!live) {
        const v = demoLoad();
        if (ev.id) { const i = v.findIndex(x => x.id === ev.id); v[i] = ev; }
        else { ev.id = 'd' + Date.now(); v.push(ev); }
        demoSave(v); return ev;
      }
      const row = Object.assign({}, ev); if (!row.id) delete row.id;
      const { data, error } = await sb.from('events').upsert(row).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      if (!live) { demoSave(demoLoad().filter(e => e.id !== id)); return; }
      const { error } = await sb.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    async uploadImage(file) {
      if (!live) {
        return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      }
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from('event-images').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
      if (error) throw error;
      return sb.storage.from('event-images').getPublicUrl(path).data.publicUrl;
    },
    // auth
    async session() { if (!live) return { demo: true }; const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) {
      if (!live) return { demo: true };
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error; return data.session;
    },
    async signOut() { if (live) await sb.auth.signOut(); }
  };
})();
