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

  return { TZ, OFF, DAY, WEEK, esc, parts, midnight, keyOf, fmt, time, dateLong, dateShort, occurrences, timeRange, placeholder, toLocalInput, fromLocalInput };
})();
