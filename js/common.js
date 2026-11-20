/* Shared helpers — all dates are handled in Arizona time (America/Phoenix, UTC-7 year-round). */
window.PX = (function () {
  const TZ = 'America/Phoenix', OFF = 7 * 3600e3, DAY = 86400e3, WEEK = 7 * DAY;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parts = (t) => { const d = new Date(t - OFF); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() }; };
  const midnight = (y, m, d) => Date.UTC(y, m, d) + OFF;
  const keyOf = (t) => { const p = parts(t); return `${p.y}-${p.m}-${p.d}`; };
  const fmt = (t, o) => new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: TZ }, o)).format(new Date(t));
  const time = (t) => fmt(t, { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase();
  const dateLong = (t) => fmt(t, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dateShort = (t) => fmt(t, { weekday: 'short', month: 'short', day: 'numeric' });

  function occurrences(events, from, to) {
    const out = [];
    for (const e of events) {
      const s = Date.parse(e.starts_at);
      const dur = e.ends_at ? Date.parse(e.ends_at) - s : 0;
      const mk = (t) => ({ ev: e, start: t, end: dur ? t + dur : null });
      if (!e.repeat_weekly) { if (s >= from && s < to) out.push(mk(s)); continue; }
      const until = e.repeat_until ? Date.parse(e.repeat_until + 'T23:59:59-07:00') : Infinity;
      let t = s;
      if (t < from) t += Math.ceil((from - t) / WEEK) * WEEK;
      for (; t < to && t <= until; t += WEEK) out.push(mk(t));
    }
    return out.sort((a, b) => a.start - b.start);
  }

  const timeRange = (o) => o.end ? `${time(o.start)} – ${time(o.end)}` : time(o.start);
  const placeholder = '<img class="ph" src="assets/logo-mark.svg" alt="">';

  // Phoenix datetime-local helpers for admin
  const toLocalInput = (iso) => { if (!iso) return ''; return new Date(Date.parse(iso) - OFF).toISOString().slice(0, 16); };
  const fromLocalInput = (v) => v ? new Date(v + ':00-07:00').toISOString() : null;

  // Store hours: days[0..6] = Mon..Sun, each { closed, open:'HH:MM', close:'HH:MM' }
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const D3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hm = (v) => { const [h, m] = v.split(':').map(Number); return { h, m, ap: h >= 12 ? 'PM' : 'AM', t: ((h + 11) % 12 + 1) + (m ? ':' + String(m).padStart(2, '0') : '') }; };
  const hoursText = (d) => {
    if (!d || d.closed || !d.open || !d.close) return 'Closed';
    const a = hm(d.open), b = hm(d.close);
    return a.ap === b.ap ? `${a.t} – ${b.t} ${b.ap}` : `${a.t} ${a.ap} – ${b.t} ${b.ap}`;
  };
  // collapse consecutive days with the same hours: [['Tue – Fri','2 – 9 PM'], ...]
  const hoursGroups = (days) => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const t = hoursText(days[i]), last = out[out.length - 1];
      if (last && last.t === t) last.to = i; else out.push({ from: i, to: i, t });
    }
    return out.map(g => [g.from === g.to ? D3[g.from] : g.to - g.from === 1 ? `${D3[g.from]} & ${D3[g.to]}` : `${D3[g.from]} – ${D3[g.to]}`, g.t]);
  };
  // is the shop open right now (Arizona time)?
  const openNow = (days) => {
    const p = new Date(Date.now() - OFF), dow = (p.getUTCDay() + 6) % 7, d = days[dow];
    if (!d || d.closed || !d.open || !d.close) return false;
    const mins = p.getUTCHours() * 60 + p.getUTCMinutes(), f = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
    return mins >= f(d.open) && mins < f(d.close);
  };

  return { DAYS, D3, hoursText, hoursGroups, openNow, TZ, OFF, DAY, WEEK, esc, parts, midnight, keyOf, fmt, time, dateLong, dateShort, occurrences, timeRange, placeholder, toLocalInput, fromLocalInput };
})();
