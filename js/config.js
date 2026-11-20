/*
  PROXIED — site settings.  Edit this file; no coding needed.

  1) After creating the Supabase project (see README.md), paste the two values below.
     The "anon" key is SAFE to be public — security is enforced by the database rules in supabase/schema.sql.
  2) Leave them empty ('') to run in DEMO MODE (sample events, saved only in your browser).
  3) Fill in the shop details. Anything left empty is simply hidden on the site.
*/
window.PROXIED = {
  supabaseUrl: 'https://togycdrcewejnuqmfwwl.supabase.co',      // e.g. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: 'sb_publishable_DG6044CcSOtAzRT2KmB4Mg_NUJuHZP-',  // e.g. 'eyJhbGciOi...'

  shop: {
    name: 'Proxied',
    tagline: 'Cards · TTRPG · and more',
    intro: 'Your Mesa, Arizona home for trading card games, tabletop RPGs, and the people who love them.',
    about: [
      'Proxied is a brand-new game shop built for players. Come for the cards, stay for the community.',
      'We run weekly events, sell singles, sealed product and tabletop gear, and keep tables open so you can sit down and play.'
    ],
    games: ['Riftbound', 'Magic: The Gathering', 'Pokémon', 'Tabletop RPGs', 'And more'],

    address: '6610 E Baseline Rd Ste 107, Mesa, AZ 85206',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6610+E+Baseline+Rd+Ste+107+Mesa+AZ+85206',
    phone: '(480) 647-6657',
    email: 'customersupport@proxiedllc.com',
    // Opening hours, Monday to Sunday. These are the defaults; the owner can change them in the admin (Store hours).
    hoursDays: [
      { closed: true },
      { open: '14:00', close: '21:00' },
      { open: '14:00', close: '21:00' },
      { open: '14:00', close: '21:00' },
      { open: '14:00', close: '21:00' },
      { open: '12:00', close: '20:00' },
      { open: '12:00', close: '20:00' }
    ],
    social: {           // full links; empty = hidden
      instagram: 'https://www.instagram.com/proxiedtcgs/',
      facebook: '',
      discord: '',
      tiktok: '',
      youtube: ''
    },
    // Store photos shown under "Find us". Put image files in assets/store/ and list them here, e.g.
    // gallery: ['assets/store/front.jpg', 'assets/store/tables.jpg'],
    gallery: [],
    defaultLocation: 'Proxied'   // shown on events that have no location set
  }
};
