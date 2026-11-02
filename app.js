/*!
 * MyMagazine — prosta ewidencja magazynu.
 * Wszystkie dane są przechowywane lokalnie w przeglądarce (localStorage).
 *
 * Cykl życia przedmiotu:
 *   stock (Na stanie) → listed (Wystawione) → toship (Do wysłania) → shipped (Wysłane) → sold (Sprzedane)
 * Zakładka „Magazyn” pokazuje wszystko, co nie jest jeszcze sprzedane.
 */
(() => {
  'use strict';

  /* ======================= Konfiguracja ======================= */

  const STORAGE_KEY = 'mymagazine.data.v1';
  const PREFS_KEY = 'mymagazine.prefs.v1';

  const FLOW = ['stock', 'listed', 'toship', 'shipped', 'sold'];
  const STATUS = {
    stock: 'Na stanie',
    listed: 'Wystawione',
    toship: 'Do wysłania',
    shipped: 'Wysłane',
    sold: 'Sprzedane',
  };

  const VIEWS = [
    {
      id: 'magazyn', title: 'Magazyn', tone: 'stock', icon: 'box',
      statuses: ['stock', 'listed'], dateField: 'addedAt',
      desc: 'Wszystko, co masz na stanie — także wystawione. Zamówione przedmioty przechodzą do zakładki „Do wysłania”.',
    },
    {
      id: 'wystawione', title: 'Wystawione', heading: 'Wystawione przedmioty', tone: 'listed', icon: 'tag',
      statuses: ['listed'], dateField: 'listedAt',
      desc: 'Przedmioty wystawione na sprzedaż — z datą wystawienia i ceną.',
    },
    {
      id: 'do-wyslania', title: 'Do wysłania', tone: 'toship', icon: 'clipboard',
      statuses: ['toship'], dateField: 'orderedAt', defaultSort: 'oldest',
      desc: 'Zamówione przedmioty, które trzeba spakować i nadać.',
    },
    {
      id: 'wyslane', title: 'Wysłane', tone: 'shipped', icon: 'truck',
      statuses: ['shipped'], dateField: 'shippedAt',
      desc: 'Paczki w drodze. Gdy kupujący nie zwróci przedmiotu, oznacz go jako sprzedany.',
    },
    {
      id: 'sprzedane', title: 'Sprzedane', tone: 'sold', icon: 'check',
      statuses: ['sold'], dateField: 'soldAt',
      desc: 'Zakończone sprzedaże — przedmioty, które nie wróciły jako zwrot.',
    },
  ];
  const VIEW = Object.fromEntries(VIEWS.map((v) => [v.id, v]));
  const STATUS_TONE = { stock: 'stock', listed: 'listed', toship: 'toship', shipped: 'shipped', sold: 'sold' };

  const CATEGORY_COLORS = ['#0891b2', '#db2777', '#d97706', '#16a34a', '#7c3aed', '#2563eb', '#dc2626', '#65a30d', '#ea580c', '#64748b'];
  const PLATFORMS = ['OLX', 'Vinted', 'Allegro', 'Allegro Lokalnie', 'Facebook Marketplace', 'eBay', 'Sklep internetowy'];
  const CARRIERS = ['InPost', 'DPD', 'DHL', 'Poczta Polska', 'Orlen Paczka', 'GLS', 'UPS', 'FedEx', 'Odbiór osobisty'];

  const MONEY_FIELDS = new Set(['purchasePrice', 'listPrice', 'salePrice']);
  const EDITABLE_FIELDS = [
    'name', 'variant', 'location', 'notes', 'purchasePrice', 'addedAt',
    'listedAt', 'listPrice', 'platform', 'url',
    'orderedAt', 'buyer', 'salePrice', 'shipBy',
    'shippedAt', 'carrier', 'tracking',
    'soldAt',
  ];
  const MOVE_FIELDS = {
    listed: ['listPrice', 'listedAt', 'platform', 'location', 'url'],
    toship: ['variant', 'orderedAt', 'salePrice', 'buyer', 'shipBy'],
    shipped: ['shippedAt', 'carrier', 'tracking'],
    sold: ['variant', 'soldAt', 'salePrice'],
  };
  const MONEY_PATTERN = '[0-9 ]+([.,][0-9]{1,2})?';

  const SORTS = [
    ['newest', 'Najnowsze'],
    ['oldest', 'Najstarsze'],
    ['name', 'Nazwa A–Z'],
    ['priceDesc', 'Cena: od najwyższej'],
    ['priceAsc', 'Cena: od najniższej'],
  ];
  const PERIODS = [
    ['all', 'Cały okres'],
    ['month', 'Ten miesiąc'],
    ['prev', 'Poprzedni miesiąc'],
    ['year', 'Ten rok'],
  ];

  /* ======================= Ikony (w stylu Lucide) ======================= */

  const ICONS = {
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.27 9 5.15"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    check: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sort: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
    more: '<circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    settings: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
    listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    link: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    searchX: '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  };

  const icon = (name, cls = '') =>
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ======================= Narzędzia ======================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const nowISO = () => new Date().toISOString();
  const pad = (n) => String(n).padStart(2, '0');
  const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => toISODate(new Date());
  const str = (v) => (v == null ? '' : String(v)).trim();
  const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  const sum = (arr, f) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
  const clampInt = (v, min, max) => Math.min(max, Math.max(min, parseInt(v, 10) || min));

  function parseDate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const fmtDate = (s) => {
    const d = parseDate(s);
    return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : '';
  };
  const daysSince = (s) => {
    const d = parseDate(s);
    return d ? Math.round((parseDate(today()) - d) / 86400000) : null;
  };
  const plural = (n, one, few, many) => {
    const a = Math.abs(n);
    if (a === 1) return one;
    const d = a % 10, h = a % 100;
    return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
  };
  const daysText = (n) => `${n} ${n === 1 ? 'dzień' : 'dni'}`;
  const ago = (s) => {
    const n = daysSince(s);
    if (n == null) return '';
    if (n === 0) return 'dziś';
    if (n === 1) return 'wczoraj';
    if (n < 0) return `za ${daysText(-n)}`;
    return `${daysText(n)} temu`;
  };
  const dateWithAgo = (s) => (s ? `${fmtDate(s)} (${ago(s)})` : '');

  const moneyFmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  const fmtMoney = (n) => (n == null || !Number.isFinite(n) ? '—' : moneyFmt.format(n));
  const parseMoney = (s) => {
    const t = str(s).replace(/\s|zł/gi, '').replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  };
  const moneyInput = (n) => (n == null ? '' : n.toFixed(2).replace('.', ','));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  const unitsWord = (n) => plural(n, 'sztuka', 'sztuki', 'sztuk');
  const posWord = (n) => plural(n, 'pozycja', 'pozycje', 'pozycji');

  /* ======================= Dane ======================= */

  const DEFAULT_SETTINGS = { refreshDays: 14, discount: 10 };
  const DEFAULT_TEMPLATES = [
    { id: 'tpl-thanks', name: 'Podziękowanie za zakup', text: 'Dzień dobry {kupujacy}! Dziękuję za zakup „{nazwa}”. Wyślę paczkę najszybciej, jak to możliwe, i dam znać, gdy będzie w drodze. Pozdrawiam!' },
    { id: 'tpl-shipped', name: 'Paczka wysłana', text: 'Paczka z „{nazwa}” jest już w drodze ({przewoznik}). Numer przesyłki: {numer}. Miłego dnia!' },
    { id: 'tpl-offer', name: 'Oferta dla obserwujących', text: 'Cześć! Widzę, że „{nazwa}” jest w Twoich ulubionych. Mogę go oddać za {cena_rabat} zamiast {cena}. Daj znać, jeśli chcesz skorzystać!' },
    { id: 'tpl-confirm', name: 'Prośba o potwierdzenie odbioru', text: 'Dzień dobry! Paczka powinna już do Ciebie dotrzeć. Jeśli wszystko jest w porządku, potwierdź proszę odbiór na Vinted. Dziękuję!' },
    { id: 'tpl-condition', name: 'Odpowiedź o stan', text: 'Dzień dobry! „{nazwa}” jest w bardzo dobrym stanie, bez wad. Chętnie odpowiem na inne pytania.' },
  ];

  const safeUrl = (u) => (/^https?:\/\/[^\s"'<>]+$/i.test(str(u)) ? str(u) : '');
  /** Numer ogłoszenia Vinted z linku, np. https://www.vinted.pl/items/1234567-buty → „1234567”. */
  const vintedIdFromUrl = (u) => {
    const m = /vinted\.[a-z.]+\/items\/(\d+)/i.exec(str(u));
    return m ? m[1] : '';
  };
  const count = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Math.max(0, Math.round(Number(v))));

  let storageOk = true;
  let data = loadData();
  const prefs = loadPrefs();

  function emptyData() {
    return { version: 1, categories: [], items: [], templates: DEFAULT_TEMPLATES.map((t) => ({ ...t })), settings: { ...DEFAULT_SETTINGS }, imports: [] };
  }

  /** Pozycja spisu partii: konkretny przedmiot z partii (np. „Nike Air Force 42”) z własną ceną. */
  function normalizeSpisEntry(e) {
    if (!e || !str(e.name)) return null;
    const url = safeUrl(e.url);
    return { id: str(e.id) || uid(), name: str(e.name), price: num(e.price), url, vintedId: str(e.vintedId) || vintedIdFromUrl(url) };
  }

  /** Import z wtyczki „MyMagazine dla Vinted”: ogłoszenie albo zamówienie, czekające na decyzję. */
  function normalizeImport(x) {
    if (!x || !str(x.title) || !['listing', 'order'].includes(x.type)) return null;
    const url = safeUrl(x.url);
    return {
      id: str(x.id) || uid(),
      type: x.type,
      createdAt: str(x.createdAt) || nowISO(),
      title: str(x.title).slice(0, 200),
      price: num(x.price),
      url,
      vintedId: str(x.vintedId) || vintedIdFromUrl(url),
      replaces: str(x.replaces),
      photo: safeUrl(x.photo),
      description: str(x.description).slice(0, 2000),
      brand: str(x.brand).slice(0, 80),
      size: str(x.size).slice(0, 40),
      condition: str(x.condition).slice(0, 60),
      buyer: str(x.buyer).slice(0, 80),
      views: count(x.views),
      favs: count(x.favs),
    };
  }

  function normalizeItem(i, catIds = new Set(data.categories.map((c) => c.id))) {
    return {
      id: str(i.id) || uid(),
      name: str(i.name),
      variant: str(i.variant),
      spis: (Array.isArray(i.spis) ? i.spis : []).map(normalizeSpisEntry).filter(Boolean),
      spisEntry: normalizeSpisEntry(i.spisEntry),
      categoryId: catIds.has(i.categoryId) ? i.categoryId : null,
      qty: clampInt(i.qty, 1, 999999),
      status: STATUS[i.status] ? i.status : 'stock',
      location: str(i.location),
      notes: str(i.notes),
      purchasePrice: num(i.purchasePrice),
      addedAt: str(i.addedAt) || today(),
      listedAt: str(i.listedAt),
      listPrice: num(i.listPrice),
      platform: str(i.platform),
      orderedAt: str(i.orderedAt),
      buyer: str(i.buyer),
      salePrice: num(i.salePrice),
      shipBy: str(i.shipBy),
      shippedAt: str(i.shippedAt),
      carrier: str(i.carrier),
      tracking: str(i.tracking),
      soldAt: str(i.soldAt),
      returnedAt: str(i.returnedAt),
      splitFrom: str(i.splitFrom),
      url: safeUrl(i.url),
      vintedId: str(i.vintedId) || vintedIdFromUrl(i.url),
      views: count(i.views),
      favs: count(i.favs),
      statsAt: str(i.statsAt),
      repostCount: count(i.repostCount) || 0,
      createdAt: str(i.createdAt) || nowISO(),
      updatedAt: str(i.updatedAt) || nowISO(),
    };
  }

  function normalizeData(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.items)) throw new Error('Nieprawidłowy format danych');
    const categories = (Array.isArray(d.categories) ? d.categories : [])
      .filter((c) => c && str(c.id) && str(c.name))
      .map((c, idx) => ({
        id: str(c.id),
        name: str(c.name),
        color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }));
    const catIds = new Set(categories.map((c) => c.id));
    const items = d.items.filter((i) => i && str(i.name)).map((i) => normalizeItem(i, catIds));
    const templates = Array.isArray(d.templates)
      ? d.templates.filter((t) => t && str(t.text)).map((t) => ({ id: str(t.id) || uid(), name: str(t.name) || 'Szablon', text: str(t.text) }))
      : DEFAULT_TEMPLATES.map((t) => ({ ...t }));
    const st = d.settings || {};
    const settings = {
      refreshDays: Number.isFinite(Number(st.refreshDays)) ? clampInt(st.refreshDays, 0, 365) : DEFAULT_SETTINGS.refreshDays,
      discount: Number.isFinite(Number(st.discount)) ? clampInt(st.discount, 0, 90) : DEFAULT_SETTINGS.discount,
    };
    const imports = (Array.isArray(d.imports) ? d.imports : []).map(normalizeImport).filter(Boolean);
    return { version: 1, categories, items, templates, settings, imports };
  }

  function loadData() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      storageOk = false;
    }
    if (!raw) return emptyData();
    try {
      return normalizeData(JSON.parse(raw));
    } catch (err) {
      console.error('MyMagazine: nie udało się odczytać danych', err);
      try { localStorage.setItem(`${STORAGE_KEY}.uszkodzone-${Date.now()}`, raw); } catch { /* brak miejsca */ }
      setTimeout(() => toast('Nie udało się odczytać zapisanych danych. Uszkodzona kopia została zachowana.', { type: 'error' }), 0);
      return emptyData();
    }
  }

  let persistRequested = false;
  function persist() {
    syncExtension();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      storageOk = true;
    } catch (err) {
      storageOk = false;
      toast('Nie udało się zapisać danych w przeglądarce. Zrób kopię zapasową!', { type: 'error' });
    }
    if (!persistRequested && data.items.length && navigator.storage && navigator.storage.persist) {
      persistRequested = true;
      navigator.storage.persist().catch(() => {});
    }
  }

  function loadPrefs() {
    const def = { theme: 'auto', lastBackup: '' };
    try {
      return { ...def, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
    } catch {
      return def;
    }
  }
  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignoruj */ }
  }

  const getItem = (id) => data.items.find((i) => i.id === id);
  /** Nazwa wyświetlana: „nazwa przedmiotu - nazwa produktu”, np. „buty C folia - nike air force”. */
  const displayName = (i) => (i.variant ? `${i.name} - ${i.variant}` : i.name);
  const catById = (id) => (id ? data.categories.find((c) => c.id === id) : null);
  const inView = (i, viewId) => VIEW[viewId].statuses.includes(i.status);
  const viewItems = (viewId) => data.items.filter((i) => inView(i, viewId));
  const unitsIn = (viewId) => sum(viewItems(viewId), (i) => i.qty);

  function ensureCategory(name) {
    const n = str(name);
    if (!n) return null;
    const found = data.categories.find((c) => norm(c.name) === norm(n));
    if (found) return found.id;
    const cat = { id: uid(), name: n, color: CATEGORY_COLORS[data.categories.length % CATEGORY_COLORS.length] };
    data.categories.push(cat);
    return cat.id;
  }

  /** Wykonuje zmianę danych, zapisuje, odświeża widok i pokazuje powiadomienie z „Cofnij”. */
  function commit(message, mutate) {
    const before = JSON.stringify(data);
    mutate();
    persist();
    render();
    if (message) {
      toast(message, {
        action: 'Cofnij',
        onAction: () => {
          data = normalizeData(JSON.parse(before));
          persist();
          render();
          toast('Cofnięto zmianę');
        },
      });
    }
  }

  /* ======================= Logika przedmiotów ======================= */

  const isOverdue = (i) => i.status === 'toship' && !!i.shipBy && i.shipBy < today();
  const isDueToday = (i) => i.status === 'toship' && i.shipBy === today();

  function setStatus(i, status) {
    i.status = status;
    i.updatedAt = nowISO();
  }

  /** Odłącza część sztuk do nowego rekordu (np. 1 z 5 wystawionych zostaje zamówiona). */
  function splitOff(item, qty) {
    // Spis partii zostaje przy partii — nowy rekord dostaje co najwyżej wybraną pozycję (zob. applyMove)
    const rec = {
      ...item, id: uid(), qty, spis: [], spisEntry: null, views: null, favs: null, statsAt: '', repostCount: 0,
      splitFrom: item.id, createdAt: nowISO(), updatedAt: nowISO(),
    };
    item.qty -= qty;
    item.updatedAt = nowISO();
    data.items.push(rec);
    return rec;
  }

  /** Scala rekord z powrotem z rekordem, od którego go odłączono (np. po anulowaniu zamówienia). */
  function mergeBack(rec) {
    if (!rec.splitFrom) return;
    const origin = getItem(rec.splitFrom);
    if (!origin || origin === rec || origin.status !== rec.status) return;
    origin.qty += rec.qty;
    origin.spis = origin.spis.concat(rec.spis);
    origin.updatedAt = nowISO();
    data.items = data.items.filter((x) => x !== rec);
  }

  function clearOrder(i) {
    Object.assign(i, { orderedAt: '', buyer: '', salePrice: null, shipBy: '' });
  }
  function clearShipping(i) {
    Object.assign(i, { shippedAt: '', carrier: '', tracking: '' });
  }

  /** Zwraca pozycję wziętą ze spisu z powrotem do spisu (np. po anulowaniu zamówienia). */
  function restoreSpisEntry(i) {
    if (!i.spisEntry) return;
    i.spis = i.spis.concat(i.spisEntry);
    i.spisEntry = null;
    i.variant = '';
  }

  function applyMove(item, target, values, qty) {
    const rec = qty && qty < item.qty ? splitOff(item, qty) : item;
    for (const key of MOVE_FIELDS[target]) if (key in values) rec[key] = values[key];
    if ('url' in values) rec.vintedId = vintedIdFromUrl(rec.url);
    // Produkt wybrany ze spisu przechodzi razem z zamówieniem i znika ze spisu partii
    const entry = values.spisId && item.spis.find((e) => e.id === values.spisId);
    if (entry) {
      item.spis = item.spis.filter((e) => e !== entry);
      rec.spisEntry = entry;
    }
    if ((target === 'toship' || target === 'sold') && rec.salePrice == null) rec.salePrice = rec.listPrice;
    setStatus(rec, target);
    return rec;
  }

  /** Ogłoszenie wystawione dłużej niż ustawiona liczba dni — warto je odświeżyć (wystawić ponownie). */
  const needsRefresh = (i) => i.status === 'listed' && data.settings.refreshDays > 0 && (daysSince(i.listedAt) ?? 0) >= data.settings.refreshDays;

  /** Wypełnia szablon wiadomości danymi przedmiotu, np. {nazwa}, {cena}, {cena_rabat}, {kupujacy}. */
  function fillTemplate(text, i) {
    const price = i ? (i.salePrice ?? i.listPrice) : null;
    const d = data.settings.discount;
    const values = {
      nazwa: i ? displayName(i) : '',
      cena: price != null ? fmtMoney(price) : '',
      cena_rabat: price != null ? fmtMoney(Math.round(price * (1 - d / 100))) : '',
      rabat: `${d}%`,
      kupujacy: i ? i.buyer : '',
      przewoznik: i ? i.carrier : '',
      numer: i ? i.tracking : '',
      link: i ? i.url : '',
    };
    return String(text).replace(/\{([a-ząćęłńóśźż_]+)\}/gi, (m, key) => {
      const k = norm(key);
      return k in values ? values[k] : m;
    });
  }

  function priceInfo(i) {
    if (i.status === 'stock') return i.purchasePrice != null ? { value: i.purchasePrice, label: 'cena zakupu' } : null;
    if (i.status === 'listed') return i.listPrice != null ? { value: i.listPrice, label: 'cena wystawienia' } : null;
    const v = i.salePrice ?? i.listPrice;
    return v != null ? { value: v, label: 'cena sprzedaży' } : null;
  }
  const sortPrice = (i) => priceInfo(i)?.value ?? null;

  function searchText(i) {
    const cat = catById(i.categoryId);
    return [i.name, i.variant, i.notes, i.location, i.buyer, i.tracking, i.platform, i.carrier, i.vintedId, cat && cat.name]
      .concat(i.spis.map((e) => e.name))
      .join(' ');
  }

  function inPeriod(s, period) {
    if (period === 'all') return true;
    const d = parseDate(s);
    if (!d) return false;
    const t = new Date();
    if (period === 'month') return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
    if (period === 'prev') {
      const p = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      return d.getFullYear() === p.getFullYear() && d.getMonth() === p.getMonth();
    }
    if (period === 'year') return d.getFullYear() === t.getFullYear();
    return true;
  }

  /* ======================= Stan interfejsu ======================= */

  const ui = { view: 'magazyn', selecting: false, selected: new Set(), filters: {} };

  function F(viewId = ui.view) {
    if (!ui.filters[viewId]) {
      ui.filters[viewId] = { search: '', category: 'all', status: 'all', period: 'all', sort: VIEW[viewId].defaultSort || 'newest' };
    }
    return ui.filters[viewId];
  }

  function isFiltered(viewId = ui.view) {
    const f = F(viewId);
    return !!(f.search.trim() || f.category !== 'all' || f.status !== 'all' || f.period !== 'all');
  }

  function clearFilters() {
    Object.assign(F(), { search: '', category: 'all', status: 'all', period: 'all' });
    $('#search').value = '';
    render();
  }

  function filteredItems(viewId = ui.view) {
    const v = VIEW[viewId];
    const f = F(viewId);
    let list = viewItems(viewId);
    if (viewId === 'magazyn' && f.status !== 'all') list = list.filter((i) => i.status === f.status);
    if (viewId === 'wystawione' && f.status === 'refresh') list = list.filter(needsRefresh);
    if (f.category === 'none') list = list.filter((i) => !i.categoryId);
    else if (f.category !== 'all') list = list.filter((i) => i.categoryId === f.category);
    if (viewId === 'sprzedane' && f.period !== 'all') list = list.filter((i) => inPeriod(i.soldAt, f.period));
    const q = norm(f.search.trim());
    if (q) {
      const words = q.split(/\s+/);
      list = list.filter((i) => {
        const t = norm(searchText(i));
        return words.every((w) => t.includes(w));
      });
    }
    return sortItems(list, f.sort, v);
  }

  function sortItems(list, sort, v) {
    const dateKey = (i) => `${i[v.dateField] || i.addedAt || ''}|${i.createdAt || ''}`;
    const byPrice = (dir) => (a, b) => {
      const pa = sortPrice(a), pb = sortPrice(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return dir * (pa - pb);
    };
    const cmp = {
      newest: (a, b) => dateKey(b).localeCompare(dateKey(a)),
      oldest: (a, b) => dateKey(a).localeCompare(dateKey(b)),
      name: (a, b) => displayName(a).localeCompare(displayName(b), 'pl', { sensitivity: 'base', numeric: true }),
      priceDesc: byPrice(-1),
      priceAsc: byPrice(1),
      deadline: (a, b) => (a.shipBy || '9999').localeCompare(b.shipBy || '9999') || dateKey(a).localeCompare(dateKey(b)),
    }[sort] || ((a, b) => dateKey(b).localeCompare(dateKey(a)));
    return list.slice().sort(cmp);
  }

  /* ======================= Akcje ======================= */

  const ACTIONS = {
    edit: { label: 'Edytuj', icon: 'pencil', run: (i) => openItemForm(i) },
    spis: { label: 'Spis partii', icon: 'listChecks', run: (i) => openItemForm(i, { focusSpis: true }) },
    list: { label: 'Wystaw na sprzedaż', short: 'Wystaw', icon: 'tag', target: 'listed', run: (i) => openMoveDialog([i], 'listed') },
    order: { label: 'Zamówione → Do wysłania', short: 'Zamówione', icon: 'clipboard', target: 'toship', run: (i) => openMoveDialog([i], 'toship') },
    ship: { label: 'Oznacz jako wysłane', short: 'Wysłane', icon: 'truck', target: 'shipped', run: (i) => openMoveDialog([i], 'shipped') },
    sell: { label: 'Oznacz jako sprzedane', short: 'Sprzedane', icon: 'check', target: 'sold', run: (i) => openMoveDialog([i], 'sold') },
    unlist: {
      label: 'Zdejmij z wystawienia', icon: 'undo',
      run: (i) => commit(`„${displayName(i)}” zdjęto z wystawienia`, () => {
        i.listedAt = '';
        setStatus(i, 'stock');
        mergeBack(i);
      }),
    },
    cancel: {
      label: 'Anuluj zamówienie', icon: 'undo',
      run: (i) => commit(`Anulowano zamówienie „${displayName(i)}”`, () => {
        clearOrder(i);
        restoreSpisEntry(i);
        setStatus(i, i.listedAt ? 'listed' : 'stock');
        mergeBack(i);
      }),
    },
    back: { label: 'Zwrot do magazynu', icon: 'undo', run: (i) => openReturnDialog(i) },
    reposted: {
      label: 'Oznacz jako odświeżone', icon: 'refresh',
      run: (i) => commit(`Odświeżono ogłoszenie „${displayName(i)}”`, () => {
        i.listedAt = today();
        i.repostCount += 1;
        i.updatedAt = nowISO();
      }),
    },
    message: { label: 'Wiadomość z szablonu', icon: 'message', run: (i) => openMessageDialog(i) },
    duplicate: { label: 'Duplikuj', icon: 'copy', run: (i) => duplicateItem(i) },
    remove: {
      label: 'Usuń', icon: 'trash', danger: true,
      run: (i) => commit(`Usunięto „${displayName(i)}”`, () => {
        data.items = data.items.filter((x) => x.id !== i.id);
      }),
    },
  };

  const STATUS_ACTIONS = {
    stock: { primary: 'list', menu: ['edit', 'list', 'order', 'sell', 'duplicate', '-', 'remove'] },
    listed: { primary: 'order', menu: ['edit', 'spis', 'order', 'sell', 'reposted', 'message', 'unlist', 'duplicate', '-', 'remove'] },
    toship: { primary: 'ship', menu: ['edit', 'ship', 'message', 'cancel', '-', 'remove'] },
    shipped: { primary: 'sell', menu: ['edit', 'sell', 'message', 'back', '-', 'remove'] },
    sold: { primary: null, menu: ['edit', 'message', 'back', 'duplicate', '-', 'remove'] },
  };

  const BULK_PRIMARY = { 'do-wyslania': 'ship', wyslane: 'sell' };

  function duplicateItem(i) {
    commit(`Dodano kopię „${displayName(i)}” do Magazynu`, () => {
      data.items.push(normalizeItem({
        name: i.name, variant: i.variant, categoryId: i.categoryId, qty: i.qty, location: i.location, notes: i.notes,
        purchasePrice: i.purchasePrice, listPrice: i.listPrice, platform: i.platform,
        status: 'stock', addedAt: today(),
      }));
    });
  }

  /* ======================= Renderowanie ======================= */

  function render() {
    renderNav();
    renderHeader();
    renderInboxBanner();
    renderToolbar();
    renderListAndStats();
    renderBulkbar();
  }

  function navSub(viewId) {
    const items = viewItems(viewId);
    switch (viewId) {
      case 'magazyn': {
        const n = sum(items.filter((i) => i.status === 'stock'), (i) => i.qty);
        return { text: `${n} ${plural(n, 'niewystawiony', 'niewystawione', 'niewystawionych')}` };
      }
      case 'wystawione': {
        const stale = items.filter(needsRefresh).length;
        if (stale) return { text: `${stale} do odświeżenia` };
        return { text: items.length ? `wartość ${fmtMoney(sum(items, (i) => (i.listPrice || 0) * i.qty))}` : 'brak ofert' };
      }
      case 'do-wyslania': {
        const late = items.filter(isOverdue).length;
        if (late) return { text: `${late} po terminie!`, late: true };
        return { text: items.length ? 'czekają na nadanie' : 'nic do wysłania' };
      }
      case 'wyslane':
        return { text: items.length ? 'w drodze' : 'nic w drodze' };
      case 'sprzedane': {
        const m = items.filter((i) => inPeriod(i.soldAt, 'month'));
        return { text: `ten miesiąc: ${fmtMoney(sum(m, (i) => (i.salePrice || 0) * i.qty))}` };
      }
      default:
        return { text: '' };
    }
  }

  function renderNav() {
    const side = VIEWS.map((v) => {
      const n = unitsIn(v.id);
      const sub = navSub(v.id);
      const active = ui.view === v.id;
      const alert = v.id === 'do-wyslania' && n > 0;
      return `<a class="nav-tile tone-${v.tone} ${active ? 'active' : ''}" href="#${v.id}" ${active ? 'aria-current="page"' : ''}>
          <span class="nav-ic">${icon(v.icon)}</span>
          <span class="nav-text"><span class="nav-label">${v.title}</span><span class="nav-sub ${sub.late ? 'late' : ''}">${esc(sub.text)}</span></span>
          <span class="nav-count ${alert ? 'alert' : ''}" title="${n} ${unitsWord(n)}">${n}</span>
        </a>`;
    }).join('');
    $('#sideNav').innerHTML = side;

    $('#bottomNav').innerHTML = VIEWS.map((v) => {
      const n = unitsIn(v.id);
      const active = ui.view === v.id;
      const alert = v.id === 'do-wyslania' && n > 0;
      return `<a class="bnav-item tone-${v.tone} ${active ? 'active' : ''}" href="#${v.id}" ${active ? 'aria-current="page"' : ''} aria-label="${v.title}: ${n} ${unitsWord(n)}">
          <span class="bnav-ic">${icon(v.icon)}${n ? `<span class="bnav-badge ${alert ? 'alert' : ''}">${n > 99 ? '99+' : n}</span>` : ''}</span>
          <span class="bnav-label">${v.title}</span>
        </a>`;
    }).join('');
  }

  function canAdd(viewId = ui.view) {
    return viewId === 'magazyn' || viewId === 'wystawione';
  }

  function renderHeader() {
    const v = VIEW[ui.view];
    $('#viewTitle').textContent = v.heading || v.title;
    $('#viewDesc').textContent = v.desc;
    $('#btnAdd').hidden = !canAdd();
    $('#fab').hidden = !canAdd() || ui.selecting;
    document.title = `${v.title} · MyMagazine`;
  }

  function renderToolbar() {
    const v = VIEW[ui.view];
    const f = F();
    const all = viewItems(v.id);
    // Wyłączone odświeżanie = brak filtra „Do odświeżenia” (nie może zostać aktywny, gdy go nie widać)
    if (v.id === 'wystawione' && !(data.settings.refreshDays > 0)) f.status = 'all';

    // Filtr statusu (Magazyn) albo okresu (Sprzedane)
    const statusBox = $('#statusChips');
    if (v.id === 'magazyn') {
      const opts = [['all', 'Wszystkie', sum(all, (i) => i.qty)]]
        .concat(v.statuses.map((s) => [s, STATUS[s], sum(all.filter((i) => i.status === s), (i) => i.qty)]));
      statusBox.innerHTML = opts.map(([id, label, n]) => `
        <button type="button" class="chip ${id !== 'all' ? `tone-${STATUS_TONE[id]}` : ''}" data-filter="status" data-value="${id}" aria-pressed="${f.status === id}">
          ${id !== 'all' ? '<span class="dot"></span>' : ''}${label}<span class="n">${n}</span>
        </button>`).join('');
      statusBox.hidden = false;
    } else if (v.id === 'wystawione' && data.settings.refreshDays > 0) {
      const n = all.filter(needsRefresh).length;
      if (f.status !== 'all' && f.status !== 'refresh') f.status = 'all';
      statusBox.innerHTML = `
        <button type="button" class="chip" data-filter="status" data-value="all" aria-pressed="${f.status === 'all'}">Wszystkie<span class="n">${all.length}</span></button>
        <button type="button" class="chip" style="--tone:var(--warn)" data-filter="status" data-value="refresh" aria-pressed="${f.status === 'refresh'}" title="Wystawione co najmniej ${daysText(data.settings.refreshDays)} temu">
          <span class="dot"></span>Do odświeżenia<span class="n">${n}</span>
        </button>`;
      statusBox.hidden = false;
    } else if (v.id === 'sprzedane') {
      statusBox.innerHTML = PERIODS.map(([id, label]) => `
        <button type="button" class="chip" data-filter="period" data-value="${id}" aria-pressed="${f.period === id}">${label}</button>`).join('');
      statusBox.hidden = false;
    } else {
      statusBox.innerHTML = '';
      statusBox.hidden = true;
    }

    // Kategorie
    const catBox = $('#catChips');
    if (!data.categories.length) {
      catBox.innerHTML = `<button type="button" class="chip ghost" data-open="categories">${icon('plus')}Dodaj kategorie</button>`;
    } else {
      if (f.category !== 'all' && f.category !== 'none' && !catById(f.category)) f.category = 'all';
      const count = (pred) => sum(all.filter(pred), (i) => i.qty);
      const uncategorized = count((i) => !i.categoryId);
      const chips = [`<button type="button" class="chip" data-filter="category" data-value="all" aria-pressed="${f.category === 'all'}">Wszystkie kategorie</button>`]
        .concat(data.categories.map((c) => `
          <button type="button" class="chip" style="--tone:${c.color}" data-filter="category" data-value="${esc(c.id)}" aria-pressed="${f.category === c.id}">
            <span class="dot"></span>${esc(c.name)}<span class="n">${count((i) => i.categoryId === c.id)}</span>
          </button>`));
      if (uncategorized || f.category === 'none') {
        chips.push(`<button type="button" class="chip" data-filter="category" data-value="none" aria-pressed="${f.category === 'none'}">Bez kategorii<span class="n">${uncategorized}</span></button>`);
      }
      chips.push(`<button type="button" class="chip ghost" data-open="categories" title="Zarządzaj kategoriami">${icon('pencil')}Edytuj</button>`);
      catBox.innerHTML = chips.join('');
    }

    // Sortowanie
    const sorts = SORTS.concat(v.id === 'do-wyslania' ? [['deadline', 'Termin wysyłki']] : []);
    if (!sorts.some(([id]) => id === f.sort)) f.sort = 'newest';
    $('#sort').innerHTML = sorts.map(([id, label]) => `<option value="${id}" ${f.sort === id ? 'selected' : ''}>${label}</option>`).join('');
    $('#sortLabel').textContent = sorts.find(([id]) => id === f.sort)[1];

    const sel = $('#btnSelect');
    sel.setAttribute('aria-pressed', String(ui.selecting));
    sel.querySelector('span').textContent = ui.selecting ? 'Gotowe' : 'Zaznacz';
    sel.title = ui.selecting ? 'Zakończ zaznaczanie' : 'Zaznacz kilka przedmiotów';
    sel.hidden = !all.length;
  }

  function statsFor(viewId, list) {
    const units = sum(list, (i) => i.qty);
    const value = (arr, f) => sum(arr, (i) => (f(i) || 0) * i.qty);
    const byStatus = (s) => sum(list.filter((i) => i.status === s), (i) => i.qty);
    switch (viewId) {
      case 'magazyn':
        return [
          { label: 'Wszystkie sztuki', value: units },
          { label: 'Niewystawione', value: byStatus('stock') },
          { label: 'Wystawione', value: byStatus('listed') },
          { label: 'Wartość zakupu', value: fmtMoney(value(list, (i) => i.purchasePrice)) },
        ];
      case 'wystawione': {
        const ages = list.map((i) => daysSince(i.listedAt)).filter((n) => n != null);
        const avg = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
        return [
          { label: 'Wystawione sztuki', value: units },
          { label: 'Wartość ofert', value: fmtMoney(value(list, (i) => i.listPrice)) },
          { label: 'Średni czas wystawienia', value: avg == null ? '—' : daysText(avg) },
          ...(data.settings.refreshDays > 0 ? [{ label: 'Do odświeżenia', value: list.filter(needsRefresh).length }] : []),
        ];
      }
      case 'do-wyslania': {
        const late = list.filter(isOverdue).length;
        return [
          { label: 'Paczki do wysłania', value: list.length },
          { label: 'Po terminie', value: late, cls: late ? 'bad' : '' },
          { label: 'Wartość zamówień', value: fmtMoney(value(list, (i) => i.salePrice ?? i.listPrice)) },
        ];
      }
      case 'wyslane': {
        const days = list.map((i) => daysSince(i.shippedAt)).filter((n) => n != null);
        return [
          { label: 'Paczki w drodze', value: list.length },
          { label: 'Wartość', value: fmtMoney(value(list, (i) => i.salePrice ?? i.listPrice)) },
          { label: 'Najdłużej w drodze', value: days.length ? daysText(Math.max(...days)) : '—' },
        ];
      }
      case 'sprzedane': {
        const withCost = list.filter((i) => i.purchasePrice != null && i.salePrice != null);
        const profit = sum(withCost, (i) => (i.salePrice - i.purchasePrice) * i.qty);
        return [
          { label: 'Sprzedane sztuki', value: units },
          { label: 'Przychód', value: fmtMoney(value(list, (i) => i.salePrice)) },
          {
            label: 'Zysk',
            value: withCost.length ? fmtMoney(profit) : '—',
            cls: withCost.length ? (profit >= 0 ? 'good' : 'bad') : '',
            note: withCost.length && withCost.length < list.length
              ? `z ${withCost.length} z ${list.length} ${posWord(list.length)} (z ceną zakupu)`
              : (!withCost.length && list.length ? 'dodaj ceny zakupu, by liczyć zysk' : ''),
          },
        ];
      }
      default:
        return [];
    }
  }

  function metaFor(i, viewId) {
    const m = [];
    const add = (label, value, cls = '') => {
      if (value != null && value !== '') m.push({ label, value, cls });
    };
    const spisText = i.spis.length ? `${i.spis.length} ${posWord(i.spis.length)} z ${i.qty} szt.` : '';
    const deadline = () => {
      if (!i.shipBy) return;
      if (isOverdue(i)) add('Wyślij do', `${fmtDate(i.shipBy)} — po terminie`, 'late');
      else if (isDueToday(i)) add('Wyślij do', 'dziś!', 'soon');
      else add('Wyślij do', `${fmtDate(i.shipBy)} (${ago(i.shipBy)})`);
    };
    switch (viewId) {
      case 'magazyn':
        add('Dodano', dateWithAgo(i.addedAt));
        if (i.status === 'listed') { add('Wystawiono', fmtDate(i.listedAt)); add('Gdzie', i.platform); }
        add('Spis', spisText);
        break;
      case 'wystawione':
        add('Wystawiono', dateWithAgo(i.listedAt));
        add('Gdzie', i.platform);
        add('Spis', spisText);
        add('Wyświetlenia', i.views);
        add('Polubienia', i.favs);
        if (i.repostCount) add('Odświeżano', `${i.repostCount}×`);
        add('Dodano', fmtDate(i.addedAt));
        break;
      case 'do-wyslania':
        add('Zamówiono', dateWithAgo(i.orderedAt));
        deadline();
        add('Kupujący', i.buyer);
        add('Gdzie', i.platform);
        break;
      case 'wyslane':
        add('Wysłano', dateWithAgo(i.shippedAt));
        add('Przewoźnik', i.carrier);
        add('Nr przesyłki', i.tracking, 'mono');
        add('Kupujący', i.buyer);
        break;
      case 'sprzedane': {
        add('Sprzedano', fmtDate(i.soldAt));
        add('Kupujący', i.buyer);
        add('Gdzie', i.platform);
        if (i.purchasePrice != null && i.salePrice != null) {
          const p = (i.salePrice - i.purchasePrice) * i.qty;
          add('Zysk', fmtMoney(p), p >= 0 ? 'pos' : 'neg');
        }
        break;
      }
      default:
        break;
    }
    return m;
  }

  function itemHTML(i) {
    const v = VIEW[ui.view];
    const cat = catById(i.categoryId);
    const acts = STATUS_ACTIONS[i.status];
    const primary = acts.primary ? ACTIONS[acts.primary] : null;
    const price = priceInfo(i);
    const meta = metaFor(i, v.id);
    const selected = ui.selected.has(i.id);

    const flags = [];
    if (v.id === 'magazyn') flags.push(`<span class="badge tone-${STATUS_TONE[i.status]}">${STATUS[i.status]}</span>`);
    if (cat) flags.push(`<span class="cat" style="--c:${cat.color}">${esc(cat.name)}</span>`);
    if (i.location) flags.push(`<span class="loc">${icon('pin')}${esc(i.location)}</span>`);
    if (i.returnedAt && (i.status === 'stock' || i.status === 'listed')) {
      flags.push(`<span class="badge warn" title="Zwrot z dnia ${fmtDate(i.returnedAt)}">po zwrocie</span>`);
    }
    if (needsRefresh(i)) {
      flags.push(`<span class="badge warn" title="Wystawione ${daysText(daysSince(i.listedAt))} temu">${icon('refresh')}do odświeżenia</span>`);
    }
    if (i.url) {
      flags.push(`<a class="vlink" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer" title="Otwórz ogłoszenie">${icon('link')}${i.vintedId ? 'Vinted' : 'ogłoszenie'}</a>`);
    }

    const priceHTML = price
      ? `<strong>${fmtMoney(price.value)}</strong><span>${price.label}${i.qty > 1 ? ' / szt.' : ''}</span>`
      : '<span>bez ceny</span>';

    return `
      <article class="item ${selected ? 'is-selected' : ''} ${isOverdue(i) ? 'is-late' : ''}" data-id="${esc(i.id)}">
        <label class="item-check"><input type="checkbox" data-act="toggle-select" ${selected ? 'checked' : ''} aria-label="Zaznacz: ${esc(displayName(i))}"></label>
        <div class="item-main" data-act="open" role="button" tabindex="0" aria-label="${ui.selecting ? 'Zaznacz' : 'Szczegóły'}: ${esc(displayName(i))}">
          <div class="item-title"><h3>${esc(displayName(i))}</h3>${i.qty > 1 ? `<span class="qty">${i.qty} szt.</span>` : ''}</div>
          ${flags.length ? `<div class="item-flags">${flags.join('')}</div>` : ''}
          ${meta.length ? `<dl class="item-meta">${meta.map((x) => `<div class="${x.cls}"><dt>${x.label}</dt><dd>${esc(x.value)}</dd></div>`).join('')}</dl>` : ''}
          ${i.notes ? `<p class="item-notes">${esc(i.notes)}</p>` : ''}
        </div>
        <div class="item-side">
          <div class="price">${priceHTML}</div>
          <div class="item-actions">
            ${primary ? `<button type="button" class="btn small act tone-${STATUS_TONE[primary.target]}" data-act="${acts.primary}" title="${esc(primary.label)}">${icon(primary.icon)}<span>${primary.short}</span></button>` : ''}
            <button type="button" class="icon-btn" data-act="menu" aria-label="Więcej akcji: ${esc(displayName(i))}" title="Więcej akcji">${icon('more')}</button>
          </div>
        </div>
      </article>`;
  }

  function emptyStateHTML(v) {
    const texts = {
      magazyn: ['Magazyn jest pusty', 'Dodaj pierwszy przedmiot — zapiszemy datę dodania, kategorię i ilość.', true],
      wystawione: ['Nic nie jest wystawione', 'Wystaw przedmiot z Magazynu przyciskiem „Wystaw” albo dodaj nowy od razu jako wystawiony.', true],
      'do-wyslania': ['Brak zamówień do wysłania', 'Gdy ktoś kupi wystawiony przedmiot, kliknij przy nim „Zamówione” — pojawi się tutaj.', false],
      wyslane: ['Brak wysłanych paczek', 'Przedmioty oznaczone jako wysłane w zakładce „Do wysłania” trafią tutaj.', false],
      sprzedane: ['Jeszcze nic nie sprzedano', 'Gdy paczka dotrze i nie będzie zwrotu, oznacz przedmiot jako sprzedany.', false],
    }[v.id];
    return `
      <div class="empty tone-${v.tone}">
        <div class="empty-ic">${icon(v.icon)}</div>
        <h3>${texts[0]}</h3>
        <p>${texts[1]}</p>
        ${texts[2] ? `<p><button type="button" class="btn primary" data-act="add">${icon('plus')}Dodaj przedmiot</button></p>` : ''}
      </div>`;
  }

  function renderListAndStats() {
    const v = VIEW[ui.view];
    const all = viewItems(v.id);
    const list = filteredItems();

    // Zaznaczenie obejmuje tylko widoczne pozycje
    const visible = new Set(list.map((i) => i.id));
    for (const id of ui.selected) if (!visible.has(id)) ui.selected.delete(id);

    $('#stats').innerHTML = statsFor(v.id, list).map((s) => `
      <div class="stat ${s.cls || ''}">
        <div class="stat-label" title="${esc(s.label)}">${esc(s.label)}</div>
        <div class="stat-value">${esc(s.value)}</div>
        ${s.note ? `<div class="stat-note">${esc(s.note)}</div>` : ''}
      </div>`).join('');

    const info = $('#resultInfo');
    if (all.length && isFiltered()) {
      info.innerHTML = `Pokazano ${list.length} z ${all.length} ${posWord(all.length)} · <button type="button" class="link" data-act="clear-filters">Wyczyść filtry</button>`;
    } else {
      info.innerHTML = '';
    }

    const el = $('#list');
    el.classList.toggle('selecting', ui.selecting);
    if (!all.length) {
      el.innerHTML = emptyStateHTML(v);
    } else if (!list.length) {
      el.innerHTML = `
        <div class="empty">
          <div class="empty-ic">${icon('searchX')}</div>
          <h3>Brak wyników</h3>
          <p>Żaden przedmiot nie pasuje do wybranych filtrów.</p>
          <p><button type="button" class="btn" data-act="clear-filters">Wyczyść filtry</button></p>
        </div>`;
    } else {
      el.innerHTML = list.map(itemHTML).join('');
    }
  }

  function renderBulkbar() {
    const bar = $('#bulkbar');
    document.body.classList.toggle('is-selecting', ui.selecting);
    if (!ui.selecting) {
      bar.hidden = true;
      bar.innerHTML = '';
      return;
    }
    const n = ui.selected.size;
    const ids = filteredItems().map((i) => i.id);
    const allSel = ids.length > 0 && ids.every((id) => ui.selected.has(id));
    const primaryKey = BULK_PRIMARY[ui.view];
    const primary = primaryKey && ACTIONS[primaryKey];
    const dis = n ? '' : 'disabled';
    bar.hidden = false;
    bar.innerHTML = `
      <span class="bulk-count">${n ? `Zaznaczono: <b>${n}</b>` : 'Zaznacz przedmioty'}</span>
      <button type="button" class="btn small ghost" data-bulk="all">${allSel ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}</button>
      ${primary ? `<button type="button" class="btn small act tone-${STATUS_TONE[primary.target]}" data-bulk="${primaryKey}" ${dis}>${icon(primary.icon)}${primary.short}</button>` : ''}
      <button type="button" class="btn small" data-bulk="category" ${dis}>${icon('folder')}Kategoria</button>
      <button type="button" class="btn small danger-ghost" data-bulk="delete" ${dis}>${icon('trash')}Usuń</button>
      <button type="button" class="icon-btn" data-bulk="close" aria-label="Zakończ zaznaczanie" title="Zakończ zaznaczanie">${icon('x')}</button>`;
  }

  function endSelection() {
    ui.selecting = false;
    ui.selected.clear();
  }

  function toggleSelect(id, on) {
    const want = on ?? !ui.selected.has(id);
    if (want) ui.selected.add(id);
    else ui.selected.delete(id);
    const card = $(`.item[data-id="${CSS.escape(id)}"]`);
    if (card) {
      card.classList.toggle('is-selected', want);
      const cb = card.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = want;
    }
    renderBulkbar();
  }

  function setView(id) {
    if (!VIEW[id]) id = 'magazyn';
    if (ui.view !== id) endSelection();
    ui.view = id;
    $('#search').value = F().search;
    closeMenu();
    render();
    window.scrollTo(0, 0);
  }

  /* ======================= Powiadomienia ======================= */

  function toast(message, { action, onAction, type = '', duration } = {}) {
    const box = $('#toasts');
    if (action) $$('.toast.has-action', box).forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = `toast ${type} ${action ? 'has-action' : ''}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
    let gone = false;
    const remove = () => {
      if (gone) return;
      gone = true;
      el.classList.add('out');
      setTimeout(() => el.remove(), 200);
    };
    if (action) {
      el.querySelector('button').addEventListener('click', () => {
        remove();
        onAction();
      });
    }
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(remove, duration || (action ? 7000 : type === 'error' ? 6000 : 3000));
  }

  /* ======================= Menu kontekstowe ======================= */

  function openItemMenu(item, anchor) {
    const menu = $('#menu');
    const backdrop = $('#menuBackdrop');
    menu.innerHTML = `<div class="menu-title">${esc(displayName(item))}</div>` + STATUS_ACTIONS[item.status].menu.map((key) => {
      if (key === '-') return '<hr>';
      const a = ACTIONS[key];
      return `<button type="button" role="menuitem" class="${a.danger ? 'danger' : ''}" data-menu="${key}">${icon(a.icon)}<span>${a.label}</span></button>`;
    }).join('');
    menu.hidden = false;
    backdrop.hidden = false;

    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    const left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
    let top = r.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    menu.onclick = (e) => {
      const b = e.target.closest('[data-menu]');
      if (!b) return;
      closeMenu();
      const cur = getItem(item.id);
      if (cur) ACTIONS[b.dataset.menu].run(cur);
    };
    menu.querySelector('button').focus({ preventScroll: true });
  }

  function closeMenu() {
    $('#menu').hidden = true;
    $('#menuBackdrop').hidden = true;
  }

  /* ======================= Okna dialogowe ======================= */

  function openDialog({ title, body, submitText = 'Zapisz', submitClass = 'primary', cancelText = 'Anuluj', extraButtons = '', onSubmit, onMount, focus }) {
    const dlg = $('#dialog');
    dlg.innerHTML = `
      <form class="dlg-form" autocomplete="off">
        <header class="dlg-head">
          <h2>${esc(title)}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Zamknij">${icon('x')}</button>
        </header>
        <div class="dlg-body">${body}</div>
        <footer class="dlg-foot">
          ${onSubmit ? `<button type="submit" class="btn ${submitClass} f-submit">${esc(submitText)}</button>` : ''}
          <button type="button" class="btn f-cancel" data-close>${esc(cancelText)}</button>
          <span class="spacer"></span>
          ${extraButtons}
        </footer>
      </form>`;
    const form = $('form', dlg);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!onSubmit) return;
      if (onSubmit(form, e.submitter) !== false) dlg.close();
    });
    $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
    // Czytelny komunikat dla pól z kwotą (także tych dodanych później, np. w spisie partii)
    form.addEventListener('invalid', (e) => {
      const inp = e.target;
      if (inp.matches('[data-money]')) inp.setCustomValidity(inp.validity.valueMissing ? 'Podaj kwotę.' : 'Podaj kwotę, np. 49,99');
    }, true);
    form.addEventListener('input', (e) => {
      if (e.target.matches('[data-money]')) e.target.setCustomValidity('');
    });
    if (onMount) onMount(form);
    if (!dlg.open) dlg.showModal();
    const target = focus && $(focus, form);
    if (target && (focus !== true)) target.focus();
    else if (window.matchMedia('(pointer: fine)').matches) {
      const first = $('.dlg-body input:not([type="checkbox"]):not([hidden]), .dlg-body select, .dlg-body textarea', form);
      if (first) first.focus();
    }
    return form;
  }

  function confirmBox(message, { title = 'Na pewno?', ok = 'OK', danger = false } = {}) {
    return new Promise((resolve) => {
      const c = $('#confirm');
      c.innerHTML = `
        <form method="dialog" class="dlg-form">
          <div class="dlg-body"><h2>${esc(title)}</h2><p>${esc(message)}</p></div>
          <footer class="dlg-foot">
            <button type="submit" class="btn" value="cancel">Anuluj</button>
            <button type="submit" class="btn ${danger ? 'danger' : 'primary'}" value="ok">${esc(ok)}</button>
          </footer>
        </form>`;
      c.returnValue = '';
      c.addEventListener('close', () => resolve(c.returnValue === 'ok'), { once: true });
      c.showModal();
    });
  }

  // Zamknięcie po kliknięciu w tło (tylko gdy kliknięcie zaczęło się i skończyło na tle)
  for (const dlg of [$('#dialog'), $('#confirm')]) {
    let downOnBackdrop = false;
    dlg.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg && downOnBackdrop) dlg.close();
      downOnBackdrop = false;
    });
  }

  /* ---------- Pola formularzy ---------- */

  const attrs = (o) => Object.entries(o)
    .filter(([, v]) => v !== false && v != null && v !== '')
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(' ');

  function field(name, label, control, { full, hint, required } = {}) {
    return `<div class="field ${full ? 'full' : ''}">
        <label for="f-${name}">${esc(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
        ${control}
        ${hint ? `<small class="hint">${esc(hint)}</small>` : ''}
      </div>`;
  }
  function textField(name, label, value, o = {}) {
    return field(name, label, `<input ${attrs({
      type: 'text', id: `f-${name}`, name, value: value ?? '', required: o.required, placeholder: o.placeholder,
      list: o.list, maxlength: o.max || 200, autocomplete: 'off', enterkeyhint: 'next',
    })}>`, o);
  }
  function moneyField(name, label, value, o = {}) {
    return field(name, label, `<div class="affix"><input ${attrs({
      type: 'text', inputmode: 'decimal', id: `f-${name}`, name, value: value == null ? '' : moneyInput(value),
      required: o.required, placeholder: '0,00', pattern: MONEY_PATTERN, 'data-money': true, autocomplete: 'off',
    })}><span>zł</span></div>`, o);
  }
  function urlField(name, label, value, o = {}) {
    return field(name, label, `<input ${attrs({
      type: 'url', inputmode: 'url', id: `f-${name}`, name, value: value || '', placeholder: o.placeholder || 'https://www.vinted.pl/items/…',
      maxlength: 500, autocomplete: 'off',
    })}>`, { full: true, ...o });
  }
  function dateField(name, label, value, o = {}) {
    return field(name, label, `<input ${attrs({ type: 'date', id: `f-${name}`, name, value: value || '', required: o.required })}>`, o);
  }
  function qtyField(name, label, value, o = {}) {
    return field(name, label, `<input ${attrs({
      type: 'number', inputmode: 'numeric', id: `f-${name}`, name, value, min: 1, max: o.max || 999999, step: 1, required: true,
    })}>`, { ...o, required: true });
  }
  function textareaField(name, label, value, o = {}) {
    return field(name, label, `<textarea ${attrs({ id: `f-${name}`, name, rows: 3, maxlength: 2000, placeholder: o.placeholder })}>${esc(value || '')}</textarea>`, { full: true, ...o });
  }
  function categoryField(selected) {
    const opts = data.categories.map((c) => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    return field('categoryId', 'Kategoria', `
      <select id="f-categoryId" name="categoryId">
        <option value="">— bez kategorii —</option>
        ${opts}
        <option value="__new">+ Nowa kategoria…</option>
      </select>
      <input type="text" name="newCategory" id="f-newCategory" placeholder="Nazwa nowej kategorii" maxlength="40" hidden disabled>`);
  }
  function bindCategorySelect(form) {
    const sel = form.elements.categoryId;
    const inp = form.elements.newCategory;
    if (!sel || !inp) return;
    sel.addEventListener('change', () => {
      const isNew = sel.value === '__new';
      inp.hidden = !isNew;
      inp.disabled = !isNew;
      inp.required = isNew;
      if (isNew) inp.focus();
    });
  }
  function datalists() {
    const uniq = (base, key) => [...new Set(base.concat(data.items.map((i) => i[key]).filter(Boolean)))];
    const dl = (id, values) => `<datalist id="${id}">${values.map((v) => `<option value="${esc(v)}"></option>`).join('')}</datalist>`;
    return dl('dl-platforms', uniq(PLATFORMS, 'platform')) + dl('dl-carriers', uniq(CARRIERS, 'carrier')) + dl('dl-locations', uniq([], 'location'));
  }

  function readForm(form) {
    const out = {};
    for (const el of form.elements) {
      if (!el.name || el.matches(':disabled')) continue;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = MONEY_FIELDS.has(el.name) ? parseMoney(el.value) : el.value.trim();
    }
    return out;
  }

  function resolveCategory(v) {
    if (v.categoryId === '__new') return ensureCategory(v.newCategory);
    return catById(v.categoryId) ? v.categoryId : null;
  }

  /* ---------- Dodawanie / edycja ---------- */

  function openItemForm(item = null, preset = {}) {
    const isNew = !item;
    const f = F();
    const it = item || {
      status: preset.listNow ? 'listed' : 'stock',
      qty: 1,
      addedAt: today(),
      listedAt: today(),
      categoryId: preset.categoryId !== undefined ? preset.categoryId : (catById(f.category) ? f.category : null),
      location: preset.location || '',
      spis: [],
      ...(preset.prefill || {}),
    };
    const reached = (s) => FLOW.indexOf(it.status) >= FLOW.indexOf(s);
    const listRequired = isNew || it.status === 'listed';
    const showSpis = !isNew && it.status === 'listed';

    const listSection = `
      <fieldset class="section" id="secListed" ${isNew && !preset.listNow ? 'hidden disabled' : ''}>
        <legend>Wystawienie</legend>
        <div class="form-grid">
          ${moneyField('listPrice', 'Cena wystawienia (za szt.)', it.listPrice, { required: listRequired })}
          ${dateField('listedAt', 'Data wystawienia', it.listedAt, { required: listRequired })}
          ${textField('platform', 'Gdzie wystawione', it.platform, { list: 'dl-platforms', placeholder: 'np. OLX, Vinted, Allegro', full: true })}
          ${urlField('url', 'Link do ogłoszenia', it.url)}
        </div>
      </fieldset>`;

    const body = `
      ${datalists()}
      <div class="form-grid">
        ${textField('name', 'Nazwa przedmiotu', it.name, { required: true, full: true, placeholder: 'np. Kurtka zimowa Nike, rozm. M' })}
        ${it.variant || reached('toship') ? textField('variant', 'Nazwa produktu (z partii)', it.variant, {
          full: true, placeholder: 'np. Nike Air Force 42', hint: 'wyświetla się jako „nazwa przedmiotu - nazwa produktu”',
        }) : ''}
        ${categoryField(it.categoryId)}
        ${qtyField('qty', 'Ilość (szt.)', it.qty)}
        ${textField('location', 'Miejsce w magazynie', it.location, { placeholder: 'np. półka A2, karton 3', list: 'dl-locations' })}
        ${moneyField('purchasePrice', 'Cena zakupu (za szt.)', it.purchasePrice, { hint: 'opcjonalnie — do liczenia zysku' })}
        ${dateField('addedAt', 'Data dodania', it.addedAt, { required: true })}
        ${textareaField('notes', 'Notatki', it.notes, { placeholder: 'stan, rozmiar, uwagi…' })}
      </div>
      ${isNew ? `<label class="check-row"><input type="checkbox" name="listNow" ${preset.listNow ? 'checked' : ''}> Od razu wystaw na sprzedaż</label>` : ''}
      ${isNew || reached('listed') ? listSection : ''}
      ${showSpis ? spisEditorHTML(it.spis) : ''}
      ${reached('toship') ? `
        <fieldset class="section"><legend>${it.status === 'sold' && !it.orderedAt ? 'Sprzedaż' : 'Zamówienie'}</legend>
          <div class="form-grid">
            ${moneyField('salePrice', 'Cena sprzedaży (za szt.)', it.salePrice)}
            ${textField('buyer', 'Kupujący', it.buyer, { placeholder: 'np. nick lub imię' })}
            ${dateField('orderedAt', 'Data zamówienia', it.orderedAt)}
            ${dateField('shipBy', 'Wyślij do (termin)', it.shipBy)}
          </div>
        </fieldset>` : ''}
      ${reached('shipped') ? `
        <fieldset class="section"><legend>Wysyłka</legend>
          <div class="form-grid">
            ${dateField('shippedAt', 'Data wysyłki', it.shippedAt)}
            ${textField('carrier', 'Przewoźnik', it.carrier, { list: 'dl-carriers', placeholder: 'np. InPost' })}
            ${textField('tracking', 'Numer przesyłki', it.tracking, { full: true })}
          </div>
        </fieldset>` : ''}
      ${it.status === 'sold' ? `
        <fieldset class="section"><legend>Finalizacja</legend>
          <div class="form-grid">${dateField('soldAt', 'Data sprzedaży', it.soldAt, { required: true })}</div>
        </fieldset>` : ''}`;

    let createdCategoryId;
    openDialog({
      title: isNew ? 'Nowy przedmiot' : 'Edytuj przedmiot',
      body,
      submitText: isNew ? 'Dodaj' : 'Zapisz',
      extraButtons: isNew ? '<button type="submit" class="btn" data-again="1" title="Zapisz i od razu dodaj następny">Dodaj i kolejny</button>' : '',
      focus: isNew ? '#f-name' : null,
      onMount(form) {
        bindCategorySelect(form);
        bindSpisEditor(form);
        const cb = form.elements.listNow;
        if (cb) {
          cb.addEventListener('change', () => {
            const sec = $('#secListed', form);
            sec.hidden = !cb.checked;
            sec.disabled = !cb.checked;
            if (cb.checked) $('#f-listPrice', form).focus();
          });
        }
      },
      onSubmit(form, submitter) {
        const v = readForm(form);
        const again = submitter && submitter.dataset.again === '1';
        commit(isNew ? `Dodano „${v.name}”${v.listNow ? ' jako wystawiony' : ' do Magazynu'}` : 'Zapisano zmiany', () => {
          const patch = {};
          for (const k of EDITABLE_FIELDS) if (k in v) patch[k] = v[k];
          patch.categoryId = resolveCategory(v);
          createdCategoryId = patch.categoryId;
          patch.qty = clampInt(v.qty, 1, 999999);
          if (showSpis) patch.spis = readSpis(form);
          if ('url' in v) patch.vintedId = vintedIdFromUrl(v.url);
          if (isNew) {
            const imp = takeImport(preset.importId);
            data.items.push(normalizeItem({
              ...patch, status: v.listNow ? 'listed' : 'stock',
              ...(imp ? { views: imp.views, favs: imp.favs, statsAt: today() } : {}),
            }));
          } else {
            const cur = getItem(item.id);
            if (cur) Object.assign(cur, patch, { updatedAt: nowISO() });
          }
        });
        if (again) {
          setTimeout(() => openItemForm(null, { listNow: !!v.listNow, categoryId: createdCategoryId, location: v.location }), 0);
        }
      },
    });

    if (preset.focusSpis && showSpis) {
      const sec = $('#dialog #secSpis');
      if (!$('.spis-row', sec)) $('[data-spis="add"]', sec).click();
      else $('.spis-row:last-child .spis-name', sec).focus();
      sec.scrollIntoView({ block: 'start' });
    }
  }

  /* ---------- Spis partii ---------- */

  function spisRowHTML(e = {}) {
    return `
      <div class="spis-row" data-id="${esc(e.id || uid())}">
        <input type="text" class="spis-name" value="${esc(e.name || '')}" placeholder="np. Nike Air Force 42" maxlength="120" aria-label="Nazwa przedmiotu ze spisu" enterkeyhint="next" autocomplete="off">
        <div class="affix">
          <input type="text" class="spis-price" inputmode="decimal" value="${e.price == null ? '' : moneyInput(e.price)}" placeholder="cena" pattern="${MONEY_PATTERN}" data-money aria-label="Cena" enterkeyhint="next" autocomplete="off"><span>zł</span>
        </div>
        <button type="button" class="icon-btn" data-spis="remove" aria-label="Usuń pozycję ze spisu" title="Usuń">${icon('trash')}</button>
      </div>`;
  }

  function spisEditorHTML(spis) {
    return `
      <fieldset class="section" id="secSpis">
        <legend>Spis partii</legend>
        <p class="small muted section-note">Wpisz konkretne przedmioty z tej partii i ich ceny. Przy zamówieniu wybierzesz je z listy, a nazwa i cena uzupełnią się same.</p>
        <div class="spis-list">${spis.map(spisRowHTML).join('')}</div>
        <div class="spis-foot">
          <button type="button" class="btn small" data-spis="add">${icon('plus')}<span></span></button>
          <span class="small muted" data-spis-count></span>
        </div>
      </fieldset>`;
  }

  function bindSpisEditor(form) {
    const sec = $('#secSpis', form);
    if (!sec) return;
    const list = $('.spis-list', sec);
    const update = () => {
      const n = $$('.spis-row', list).length;
      const qty = clampInt(form.elements.qty && form.elements.qty.value, 1, 999999);
      $('[data-spis="add"] span', sec).textContent = n ? 'Dodaj pozycję' : 'Dodaj spis';
      $('[data-spis-count]', sec).textContent = n ? `${n} ${posWord(n)} w spisie · w partii: ${qty} szt.` : '';
    };
    const addRow = () => {
      list.insertAdjacentHTML('beforeend', spisRowHTML());
      update();
      $('.spis-name', list.lastElementChild).focus();
    };
    sec.addEventListener('click', (e) => {
      const b = e.target.closest('[data-spis]');
      if (!b) return;
      if (b.dataset.spis === 'add') addRow();
      else {
        b.closest('.spis-row').remove();
        update();
      }
    });
    // Enter: z nazwy do ceny, z ceny do kolejnej pozycji (nowej, jeśli to ostatnia)
    sec.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const row = e.target.closest('.spis-row');
      if (!row) return;
      e.preventDefault();
      if (e.target.matches('.spis-name')) $('.spis-price', row).focus();
      else if (row === list.lastElementChild) addRow();
      else $('.spis-name', row.nextElementSibling).focus();
    });
    if (form.elements.qty) form.elements.qty.addEventListener('input', update);
    update();
  }

  function readSpis(form) {
    return $$('#secSpis .spis-row', form)
      .map((row) => ({ id: row.dataset.id, name: $('.spis-name', row).value.trim(), price: parseMoney($('.spis-price', row).value) }))
      .filter((e) => e.name);
  }

  function spisPickerField(item) {
    const opts = item.spis.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}${e.price != null ? ` — ${esc(fmtMoney(e.price))}` : ''}</option>`).join('');
    return field('spisId', 'Wybierz ze spisu', `
      <select id="f-spisId" name="spisId">
        <option value="">— wybierz przedmiot z partii —</option>
        ${opts}
      </select>`, { full: true, hint: `${item.spis.length} ${posWord(item.spis.length)} w spisie — wybór uzupełni nazwę i cenę` });
  }

  /* ---------- Przenoszenie między zakładkami ---------- */

  /**
   * opts.prefill — wartości wstępne pól (np. z zamówienia na Vinted),
   * opts.importId — import z wtyczki, który zostanie zamknięty po zapisaniu.
   */
  function openMoveDialog(items, target, opts = {}) {
    items = items.filter(Boolean);
    if (!items.length) return;
    const single = items.length === 1 ? items[0] : null;
    const t = today();
    const qtyAllowed = single && single.qty > 1 && (
      target === 'listed' || target === 'toship' || (target === 'sold' && (single.status === 'stock' || single.status === 'listed'))
    );
    const qtyDefault = target === 'listed' ? single?.qty : 1;

    // Wybór konkretnego produktu z partii — przy zamówieniu albo sprzedaży prosto z magazynu
    const pickProduct = !!single && (target === 'toship' || target === 'sold') && (single.status === 'stock' || single.status === 'listed');
    const productFields = () => {
      if (!pickProduct) return [];
      const out = [];
      if (single.spis.length) out.push(spisPickerField(single));
      out.push(textField('variant', 'Nazwa produktu', single.variant, {
        full: true, placeholder: 'np. Nike Air Force 42', hint: `wyświetli się jako „${single.name} - …”`,
      }));
      return out;
    };
    const qtyHTML = qtyAllowed ? qtyField('qty', 'Ile sztuk?', qtyDefault, { max: single.qty, hint: `dostępne: ${single.qty} szt.` }) : '';

    const fields = [];
    let title = '';
    let submitText = '';
    switch (target) {
      case 'listed':
        title = 'Wystaw na sprzedaż';
        submitText = 'Wystaw';
        fields.push(qtyHTML);
        fields.push(moneyField('listPrice', 'Cena wystawienia (za szt.)', single?.listPrice, { required: true }));
        fields.push(dateField('listedAt', 'Data wystawienia', t, { required: true }));
        if (single) {
          fields.push(textField('location', 'Miejsce w magazynie', single.location, {
            list: 'dl-locations', placeholder: 'np. karton 1', hint: qtyAllowed ? 'gdzie leży wystawiana partia' : '',
          }));
        }
        fields.push(textField('platform', 'Gdzie wystawione', single?.platform, { list: 'dl-platforms', placeholder: 'np. OLX, Vinted, Allegro', full: !!qtyAllowed }));
        if (single) fields.push(urlField('url', 'Link do ogłoszenia', '', { hint: 'opcjonalnie' }));
        break;
      case 'toship':
        title = 'Zamówione — do wysłania';
        submitText = 'Przenieś do „Do wysłania”';
        fields.push(...productFields(), qtyHTML);
        fields.push(moneyField('salePrice', 'Cena sprzedaży (za szt.)', single ? (single.salePrice ?? single.listPrice) : null));
        fields.push(dateField('orderedAt', 'Data zamówienia', t, { required: true }));
        fields.push(textField('buyer', 'Kupujący', '', { placeholder: 'np. nick lub imię' }));
        fields.push(dateField('shipBy', 'Wyślij do (termin)', '', { hint: 'opcjonalnie' }));
        break;
      case 'shipped':
        title = 'Oznacz jako wysłane';
        submitText = 'Wysłane';
        fields.push(dateField('shippedAt', 'Data wysyłki', t, { required: true }));
        fields.push(textField('carrier', 'Przewoźnik', single?.carrier, { list: 'dl-carriers', placeholder: 'np. InPost' }));
        if (single) fields.push(textField('tracking', 'Numer przesyłki', single.tracking, { full: true, placeholder: 'opcjonalnie' }));
        break;
      case 'sold':
        title = 'Oznacz jako sprzedane';
        submitText = 'Sprzedane';
        fields.push(...productFields(), qtyHTML);
        fields.push(dateField('soldAt', 'Data sprzedaży', t, { required: true }));
        if (single) fields.push(moneyField('salePrice', 'Cena sprzedaży (za szt.)', single.salePrice ?? single.listPrice));
        break;
      default:
        return;
    }

    const lead = single
      ? `${esc(displayName(single))}${single.qty > 1 ? ` <span class="muted">· ${single.qty} szt.</span>` : ''}${single.location ? ` <span class="muted">· ${esc(single.location)}</span>` : ''}`
      : `Zaznaczone: ${items.length} ${posWord(items.length)}`;
    let note = '';
    if (target === 'sold') {
      note = 'Sprzedany przedmiot zniknie z Magazynu. Jeśli wróci jako zwrot, użyj „Zwrot do magazynu”.';
    } else if (pickProduct && !single.spis.length && single.qty > 1 && single.status === 'listed') {
      note = 'Wskazówka: dodaj spis partii (menu ⋮ → „Spis partii”), a przy zamówieniu wybierzesz produkt z listy razem z ceną.';
    }

    openDialog({
      title,
      body: `${datalists()}<p class="dlg-lead">${lead}</p><div class="form-grid">${fields.filter(Boolean).join('')}</div>${note ? `<p class="small muted" style="margin:14px 0 0">${esc(note)}</p>` : ''}`,
      submitText,
      submitClass: 'primary',
      onMount(form) {
        const picker = form.elements.spisId;
        if (picker) picker.addEventListener('change', () => {
          const entry = single.spis.find((e) => e.id === picker.value);
          if (!entry) return;
          form.elements.variant.value = entry.name;
          if (form.elements.salePrice) {
            const price = entry.price ?? single.listPrice;
            form.elements.salePrice.value = price == null ? '' : moneyInput(price);
          }
        });
        // Najpierw pozycja ze spisu (uzupełnia nazwę i cenę), potem dane z Vinted — cena z zamówienia jest ważniejsza
        const pre = opts.prefill || {};
        if (picker && pre.spisId && single.spis.some((e) => e.id === pre.spisId)) {
          picker.value = pre.spisId;
          picker.dispatchEvent(new Event('change'));
        }
        for (const [key, val] of Object.entries(pre)) {
          const el = form.elements[key];
          if (!el || key === 'spisId' || val == null || val === '') continue;
          if (key === 'variant' && pre.spisId && el.value) continue;
          el.value = MONEY_FIELDS.has(key) ? moneyInput(val) : val;
        }
      },
      onSubmit(form) {
        const v = readForm(form);
        const qty = qtyAllowed ? clampInt(v.qty, 1, single.qty) : null;
        const label = STATUS[target];
        let msg = `${items.length} ${posWord(items.length)} → ${label}`;
        if (single) {
          const name = 'variant' in v ? (v.variant ? `${single.name} - ${v.variant}` : single.name) : displayName(single);
          msg = qty && qty < single.qty ? `${qty} szt. „${name}” → ${label}` : `„${name}” → ${label}`;
        }
        commit(msg, () => {
          for (const it of items) {
            const cur = getItem(it.id);
            if (!cur) continue;
            const rec = applyMove(cur, target, v, qty);
            const imp = takeImport(opts.importId);
            if (imp) applyImportToRecord(rec, imp);
          }
          if (!single) endSelection();
        });
      },
    });
  }

  function openReturnDialog(item) {
    const canRelist = item.listPrice != null;
    openDialog({
      title: 'Zwrot do magazynu',
      body: `
        <p class="dlg-lead">${esc(displayName(item))}${item.qty > 1 ? ` <span class="muted">· ${item.qty} szt.</span>` : ''}</p>
        <p class="small muted" style="margin:0 0 14px">Przedmiot wróci do Magazynu jako „Na stanie”. Dane zamówienia i wysyłki zostaną wyczyszczone.</p>
        <div class="form-grid">${dateField('returnedAt', 'Data zwrotu', today(), { required: true })}</div>
        ${canRelist ? `<label class="check-row"><input type="checkbox" name="relist"> Wystaw ponownie za ${esc(fmtMoney(item.listPrice))}</label>` : ''}`,
      submitText: 'Przyjmij zwrot',
      onSubmit(form) {
        const v = readForm(form);
        commit(`Przyjęto zwrot „${displayName(item)}”`, () => {
          const cur = getItem(item.id);
          if (!cur) return;
          clearOrder(cur);
          clearShipping(cur);
          cur.soldAt = '';
          cur.spisEntry = null; // zwrócony przedmiot jest już osobną pozycją z własną nazwą
          cur.returnedAt = v.returnedAt || today();
          if (v.relist) {
            cur.listedAt = today();
            setStatus(cur, 'listed');
          } else {
            cur.listedAt = '';
            setStatus(cur, 'stock');
          }
        });
      },
    });
  }

  function openBulkCategory(items) {
    openDialog({
      title: 'Zmień kategorię',
      body: `<p class="dlg-lead">Zaznaczone: ${items.length} ${posWord(items.length)}</p><div class="form-grid">${categoryField(null).replace('class="field ', 'class="field full ')}</div>`,
      submitText: 'Zmień',
      onMount: bindCategorySelect,
      onSubmit(form) {
        const v = readForm(form);
        commit(`Zmieniono kategorię (${items.length} ${posWord(items.length)})`, () => {
          const id = resolveCategory(v);
          for (const it of items) {
            const cur = getItem(it.id);
            if (cur) cur.categoryId = id;
          }
          endSelection();
        });
      },
    });
  }

  /* ---------- Kategorie ---------- */

  function openCategories() {
    const form = openDialog({
      title: 'Kategorie',
      body: `
        <p class="small muted" style="margin:0 0 14px">Kategorie są wspólne dla wszystkich zakładek. Kliknij kółko, aby zmienić kolor; nazwę zmienisz, wpisując nową.</p>
        <ul class="cat-list" id="catList"></ul>
        <div class="cat-add">
          <input type="text" id="newCat" placeholder="Nowa kategoria, np. Ubrania" maxlength="40" enterkeyhint="done" aria-label="Nazwa nowej kategorii">
          <button type="button" class="btn primary" id="addCat">${icon('plus')}Dodaj</button>
        </div>`,
      cancelText: 'Gotowe',
      focus: '#newCat',
      onMount(f) {
        const list = $('#catList', f);
        const input = $('#newCat', f);
        const save = () => { persist(); render(); };
        const add = () => {
          const name = input.value.trim();
          if (!name) { input.focus(); return; }
          ensureCategory(name);
          input.value = '';
          save();
          paint();
          input.focus();
        };
        const paint = () => {
          const counts = {};
          for (const i of data.items) if (i.categoryId) counts[i.categoryId] = (counts[i.categoryId] || 0) + i.qty;
          list.innerHTML = data.categories.length
            ? data.categories.map((c) => `
              <li data-id="${esc(c.id)}">
                <button type="button" class="swatch" style="--c:${c.color}" data-cat="color" aria-label="Zmień kolor: ${esc(c.name)}" title="Zmień kolor"></button>
                <input type="text" value="${esc(c.name)}" data-cat="name" maxlength="40" aria-label="Nazwa kategorii">
                <span class="count">${counts[c.id] || 0} szt.</span>
                <button type="button" class="icon-btn" data-cat="delete" aria-label="Usuń kategorię: ${esc(c.name)}" title="Usuń">${icon('trash')}</button>
              </li>`).join('')
            : '<li class="muted small">Nie masz jeszcze żadnych kategorii.</li>';
        };
        paint();
        $('#addCat', f).addEventListener('click', add);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(); }
        });
        list.addEventListener('click', async (e) => {
          const b = e.target.closest('[data-cat]');
          if (!b) return;
          const cat = catById(b.closest('li').dataset.id);
          if (!cat) return;
          if (b.dataset.cat === 'color') {
            const idx = CATEGORY_COLORS.indexOf(cat.color);
            cat.color = CATEGORY_COLORS[(idx + 1) % CATEGORY_COLORS.length];
            save();
            paint();
          } else if (b.dataset.cat === 'delete') {
            const used = data.items.filter((i) => i.categoryId === cat.id).length;
            const ok = !used || await confirmBox(
              `${used} ${posWord(used)} ma tę kategorię. Po usunięciu zostaną bez kategorii (przedmioty nie zostaną usunięte).`,
              { title: `Usunąć kategorię „${cat.name}”?`, ok: 'Usuń kategorię', danger: true },
            );
            if (!ok) return;
            data.categories = data.categories.filter((c) => c.id !== cat.id);
            for (const i of data.items) if (i.categoryId === cat.id) i.categoryId = null;
            save();
            paint();
          }
        });
        list.addEventListener('change', (e) => {
          if (e.target.dataset.cat !== 'name') return;
          const cat = catById(e.target.closest('li').dataset.id);
          const name = e.target.value.trim();
          if (!cat) return;
          if (!name) { e.target.value = cat.name; return; }
          cat.name = name;
          save();
        });
        list.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.target.dataset.cat === 'name') { e.preventDefault(); e.target.blur(); }
        });
      },
    });
    return form;
  }

  /* ======================= Vinted: wtyczka, importy, szablony ======================= */

  /** Stan połączenia z wtyczką „MyMagazine dla Vinted” (działa w tej samej przeglądarce). */
  const ext = { connected: false, version: '' };
  const postToExtension = (msg) => {
    try {
      window.postMessage({ source: 'mymagazine-app', ...msg }, /^https?:/.test(location.protocol) ? location.origin : '*');
    } catch { /* brak wtyczki */ }
  };
  let syncTimer = 0;
  function syncExtension() {
    if (!ext.connected) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => postToExtension({ type: 'snapshot', snapshot: buildSnapshot() }), 250);
  }

  /** Skrót danych dla wtyczki: liczniki, zamówienia do wysłania, szablony i ogłoszenia powiązane z Vinted. */
  function buildSnapshot() {
    const linked = {};
    for (const i of data.items) {
      const base = {
        name: displayName(i), status: i.status, statusLabel: STATUS[i.status], location: i.location, listedAt: i.listedAt,
        price: i.salePrice ?? i.listPrice, buyer: i.buyer, carrier: i.carrier, tracking: i.tracking,
      };
      if (i.vintedId && (!linked[i.vintedId] || i.status !== 'sold')) linked[i.vintedId] = base;
      for (const e of i.spis) {
        if (e.vintedId) linked[e.vintedId] = { ...base, name: `${i.name} - ${e.name}`, price: e.price ?? i.listPrice, inSpis: true };
      }
    }
    const units = (st) => sum(data.items.filter((i) => i.status === st), (i) => i.qty);
    return {
      updatedAt: nowISO(),
      appUrl: location.origin + location.pathname,
      counts: {
        stock: units('stock'), listed: units('listed'), toship: units('toship'), shipped: units('shipped'), sold: units('sold'),
        refresh: data.items.filter(needsRefresh).length, imports: data.imports.length,
      },
      toship: sortItems(viewItems('do-wyslania'), 'deadline', VIEW['do-wyslania']).slice(0, 30).map((i) => ({
        name: displayName(i), qty: i.qty, buyer: i.buyer, shipBy: i.shipBy, location: i.location, late: isOverdue(i),
      })),
      refreshDays: data.settings.refreshDays,
      discount: data.settings.discount,
      templates: data.templates,
      linked,
    };
  }

  /** Wyjmuje import z kolejki (wywoływane wewnątrz commit, więc „Cofnij” go przywraca). */
  function takeImport(id) {
    if (!id) return null;
    const imp = data.imports.find((x) => x.id === id);
    if (imp) data.imports = data.imports.filter((x) => x !== imp);
    return imp || null;
  }

  function applyImportToRecord(rec, imp) {
    if (imp.url) rec.url = imp.url;
    if (imp.vintedId) rec.vintedId = imp.vintedId;
    if (imp.type === 'listing') {
      if (imp.views != null) rec.views = imp.views;
      if (imp.favs != null) rec.favs = imp.favs;
      rec.statsAt = today();
    }
    rec.updatedAt = nowISO();
  }

  /** Szuka ogłoszenia Vinted w danych: w przedmiotach albo w pozycjach spisów partii. */
  function findVinted(vid) {
    if (!vid) return null;
    const item = data.items.find((i) => i.vintedId === vid && i.status !== 'sold');
    if (item) return { item };
    for (const i of data.items) {
      const entry = i.spis.find((e) => e.vintedId === vid);
      if (entry) return { item: i, entry };
    }
    return null;
  }

  const words = (t) => norm(t).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  function matchScore(a, b) {
    const A = new Set(words(a));
    const B = words(b);
    if (!A.size || !B.length) return 0;
    return B.filter((w) => A.has(w)).length / Math.max(A.size, B.length);
  }
  function bestMatch(items, title) {
    let best = null;
    let score = 0;
    for (const i of items) {
      const sc = Math.max(matchScore(i.name, title), matchScore(displayName(i), title), ...i.spis.map((e) => matchScore(e.name, title)));
      if (sc > score) { best = i; score = sc; }
    }
    return score >= 0.34 ? best : null;
  }

  /** Aktualizacje, które nie wymagają decyzji: statystyki znanego ogłoszenia albo odświeżone (ponownie wystawione) ogłoszenie. */
  function autoApplyImport(imp) {
    if (imp.type !== 'listing') return null;
    const hit = findVinted(imp.vintedId);
    if (hit && hit.entry) {
      if (imp.price != null) hit.entry.price = imp.price;
      if (imp.url) hit.entry.url = imp.url;
      return `Zaktualizowano pozycję spisu „${hit.entry.name}”`;
    }
    if (hit) {
      applyImportToRecord(hit.item, imp);
      if (imp.price != null && hit.item.status === 'listed') hit.item.listPrice = imp.price;
      return `Zaktualizowano z Vinted: „${displayName(hit.item)}”`;
    }
    const old = findVinted(imp.replaces);
    if (old && old.entry) {
      Object.assign(old.entry, { vintedId: imp.vintedId, url: imp.url || old.entry.url });
      if (imp.price != null) old.entry.price = imp.price;
      return `Odświeżono ogłoszenie „${old.entry.name}”`;
    }
    if (old) {
      applyImportToRecord(old.item, imp);
      if (imp.price != null && old.item.status === 'listed') old.item.listPrice = imp.price;
      old.item.listedAt = today();
      old.item.repostCount += 1;
      return `Odświeżono ogłoszenie „${displayName(old.item)}”`;
    }
    return null;
  }

  function receiveImports(list) {
    if (!Array.isArray(list) || !list.length) return;
    const known = new Set(data.imports.map((x) => x.id));
    const done = [];
    let queued = 0;
    for (const raw of list) {
      const imp = normalizeImport(raw);
      if (!imp || known.has(imp.id)) continue;
      const msg = autoApplyImport(imp);
      if (msg) done.push(msg);
      else if (!raw.silent) {
        data.imports.push(imp);
        queued += 1;
      }
    }
    postToExtension({ type: 'ack', ids: list.map((x) => x && x.id).filter(Boolean) });
    if (!done.length && !queued) return;
    persist();
    render();
    if (queued) toast(`Z Vinted: ${queued} ${posWord(queued)} do przejrzenia`, { action: 'Przejrzyj', onAction: openInbox });
    else toast(done.length === 1 ? done[0] : `Zaktualizowano z Vinted: ${done.length} ${posWord(done.length)}`);
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || e.data.source !== 'mymagazine-ext') return;
    if (e.data.type === 'hello') {
      ext.connected = true;
      ext.version = str(e.data.version);
      syncExtension();
    } else if (e.data.type === 'imports') {
      receiveImports(e.data.imports);
    }
  });

  function renderInboxBanner() {
    const el = $('#inboxBanner');
    const n = data.imports.length;
    el.hidden = !n;
    if (!n) {
      el.innerHTML = '';
      return;
    }
    const orders = data.imports.filter((x) => x.type === 'order').length;
    el.innerHTML = `${icon('inbox')}<p>Z Vinted: ${n} ${posWord(n)} do przejrzenia${orders ? ` (w tym ${orders} ${plural(orders, 'zamówienie', 'zamówienia', 'zamówień')})` : ''}</p>
      <button type="button" class="btn small primary" data-act="inbox">Przejrzyj</button>`;
  }

  function importHTML(x) {
    const meta = [
      x.price != null ? fmtMoney(x.price) : '',
      x.type === 'order' && x.buyer ? `kupujący: ${x.buyer}` : '',
      x.brand, x.size ? `rozm. ${x.size}` : '', x.condition,
      x.views != null ? `${x.views} wyświetleń` : '', x.favs != null ? `${x.favs} polubień` : '',
    ].filter(Boolean).map(esc).join(' · ');
    const thumb = x.photo
      ? `<img class="imp-thumb" src="${esc(x.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : `<div class="imp-thumb">${icon(x.type === 'order' ? 'clipboard' : 'tag')}</div>`;
    const actions = x.type === 'order'
      ? `<button type="button" class="btn small primary" data-imp="order">${icon('clipboard')}Przypisz do przedmiotu</button>`
      : `<button type="button" class="btn small primary" data-imp="new">${icon('plus')}Dodaj jako nowy</button>
         <button type="button" class="btn small" data-imp="assign">${icon('link')}Przypisz do istniejącego</button>`;
    return `
      <li class="imp" data-id="${esc(x.id)}">
        ${thumb}
        <div>
          <span class="imp-type ${x.type}">${x.type === 'order' ? 'Zamówienie' : 'Ogłoszenie'}</span>
          <h4>${esc(x.title)}</h4>
          <p class="imp-meta">${meta}${x.url ? `${meta ? ' · ' : ''}<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">otwórz na Vinted</a>` : ''}</p>
          <div class="imp-actions">${actions}<button type="button" class="btn small ghost" data-imp="dismiss">Odrzuć</button></div>
        </div>
      </li>`;
  }

  function openInbox() {
    if (!data.imports.length) {
      if ($('#dialog').open) $('#dialog').close();
      return;
    }
    openDialog({
      title: 'Import z Vinted',
      cancelText: 'Zamknij',
      body: `
        <p class="small muted" style="margin:0 0 12px">Ogłoszenia i zamówienia wysłane z wtyczki „MyMagazine dla Vinted”. Zdecyduj, co z nimi zrobić.</p>
        <ul class="imp-list">${data.imports.map(importHTML).join('')}</ul>`,
      onMount(form) {
        form.addEventListener('click', (e) => {
          const b = e.target.closest('[data-imp]');
          if (!b) return;
          const imp = data.imports.find((x) => x.id === b.closest('[data-id]').dataset.id);
          if (imp) handleImport(b.dataset.imp, imp);
        });
      },
    });
  }

  function handleImport(action, imp) {
    if (action === 'dismiss') {
      commit('Odrzucono import z Vinted', () => takeImport(imp.id));
      openInbox();
    } else if (action === 'new') {
      const notes = [imp.brand && `Marka: ${imp.brand}`, imp.size && `Rozmiar: ${imp.size}`, imp.condition && `Stan: ${imp.condition}`].filter(Boolean).join(', ');
      openItemForm(null, {
        listNow: true,
        importId: imp.id,
        prefill: { name: imp.title, listPrice: imp.price, platform: 'Vinted', url: imp.url, notes },
      });
    } else if (action === 'assign') {
      openAssignListing(imp);
    } else if (action === 'order') {
      openAssignOrder(imp);
    }
  }

  function itemOptions(groups, selected) {
    return groups.filter(([, list]) => list.length).map(([label, list]) => `
      <optgroup label="${esc(label)}">
        ${list.map((i) => `<option value="${esc(i.id)}" ${i === selected ? 'selected' : ''}>${esc(displayName(i))} · ${i.qty} szt.${i.location ? ` · ${esc(i.location)}` : ''}</option>`).join('')}
      </optgroup>`).join('');
  }

  function openAssignListing(imp) {
    const listed = data.items.filter((i) => i.status === 'listed');
    const stock = data.items.filter((i) => i.status === 'stock');
    if (!listed.length && !stock.length) {
      toast('Nie masz przedmiotów na stanie ani wystawionych — dodaj ogłoszenie jako nowy przedmiot.');
      return;
    }
    const best = bestMatch(listed, imp.title) || bestMatch(stock, imp.title) || listed[0] || stock[0];
    const priceText = imp.price != null ? ` za ${fmtMoney(imp.price)}` : '';
    openDialog({
      title: 'Przypisz ogłoszenie z Vinted',
      submitText: 'Zatwierdź',
      body: `
        <p class="dlg-lead">${esc(imp.title)}${imp.price != null ? ` <span class="muted">· ${esc(fmtMoney(imp.price))}</span>` : ''}</p>
        <div class="form-grid">
          ${field('target', 'Przedmiot w MyMagazine', `<select id="f-target" name="target">${itemOptions([['Wystawione', listed], ['Na stanie', stock]], best)}</select>`, { full: true })}
        </div>
        <div class="radio-list" id="assignModes"></div>`,
      onMount(form) {
        const paint = () => {
          const item = getItem(form.elements.target.value);
          if (!item) return;
          const modes = item.status === 'stock'
            ? [['list', 'Wystaw z magazynu', 'otworzy okno „Wystaw” z ceną i linkiem z Vinted', true]]
            : [
              ['spis', 'Dodaj do spisu partii', `jako „${imp.title}”${priceText} — przy zamówieniu wybierzesz go z listy`, item.qty > 1],
              ['link', 'To jest ogłoszenie tego przedmiotu', 'zapisze link i statystyki; nowy link w miejsce starego = ogłoszenie odświeżone', item.qty === 1],
            ];
          $('#assignModes', form).innerHTML = modes.map(([id, label, hint, on]) => `
            <label><input type="radio" name="mode" value="${id}" ${on ? 'checked' : ''}><span>${esc(label)}<small>${esc(hint)}</small></span></label>`).join('');
        };
        form.elements.target.addEventListener('change', paint);
        paint();
      },
      onSubmit(form) {
        const v = readForm(form);
        const item = getItem(v.target);
        if (!item) return false;
        if (v.mode === 'list') {
          openMoveDialog([item], 'listed', { importId: imp.id, prefill: { qty: 1, listPrice: imp.price, platform: 'Vinted', url: imp.url } });
          return false;
        }
        if (v.mode === 'spis') {
          commit(`Dodano do spisu partii „${displayName(item)}”`, () => {
            const cur = getItem(item.id);
            cur.spis.push(normalizeSpisEntry({ name: imp.title, price: imp.price, url: imp.url, vintedId: imp.vintedId }));
            takeImport(imp.id);
          });
        } else {
          commit(`Połączono z ogłoszeniem: „${displayName(item)}”`, () => {
            const cur = getItem(item.id);
            const reposted = !!(cur.vintedId && imp.vintedId && cur.vintedId !== imp.vintedId);
            applyImportToRecord(cur, takeImport(imp.id));
            if (imp.price != null) cur.listPrice = imp.price;
            if (reposted) {
              cur.listedAt = today();
              cur.repostCount += 1;
            }
          });
        }
        setTimeout(openInbox, 0);
        return true;
      },
    });
  }

  function openAssignOrder(imp) {
    const candidates = data.items.filter((i) => i.status === 'listed' || i.status === 'stock');
    if (!candidates.length) {
      toast('Nie masz przedmiotów na stanie ani wystawionych, do których można przypisać zamówienie.');
      return;
    }
    const hit = findVinted(imp.vintedId);
    const best = (hit && candidates.includes(hit.item) && hit.item)
      || bestMatch(candidates.filter((i) => i.status === 'listed'), imp.title)
      || bestMatch(candidates, imp.title) || candidates[0];
    openDialog({
      title: 'Zamówienie z Vinted',
      submitText: 'Dalej',
      body: `
        <p class="dlg-lead">${esc(imp.title)}${imp.price != null ? ` <span class="muted">· ${esc(fmtMoney(imp.price))}</span>` : ''}${imp.buyer ? ` <span class="muted">· ${esc(imp.buyer)}</span>` : ''}</p>
        <div class="form-grid">
          ${field('target', 'Który przedmiot został sprzedany?', `<select id="f-target" name="target">${itemOptions([
            ['Wystawione', candidates.filter((i) => i.status === 'listed')],
            ['Na stanie', candidates.filter((i) => i.status === 'stock')],
          ], best)}</select>`, { full: true, hint: 'w następnym kroku sprawdzisz nazwę, cenę i kupującego' })}
        </div>`,
      onSubmit(form) {
        const item = getItem(readForm(form).target);
        if (!item) return false;
        const sameListing = !!(item.vintedId && item.vintedId === imp.vintedId);
        const entry = item.spis.find((e) => e.vintedId && e.vintedId === imp.vintedId)
          || item.spis.find((e) => matchScore(e.name, imp.title) >= 0.6);
        const variant = sameListing ? '' : (entry ? entry.name : (norm(imp.title) === norm(item.name) ? '' : imp.title));
        openMoveDialog([item], 'toship', {
          importId: imp.id,
          prefill: { spisId: entry ? entry.id : '', variant, salePrice: imp.price, buyer: imp.buyer },
        });
        return false;
      },
    });
  }

  /* ---------- Szablony wiadomości ---------- */

  const PLACEHOLDERS = ['{nazwa}', '{cena}', '{cena_rabat}', '{rabat}', '{kupujacy}', '{przewoznik}', '{numer}', '{link}'];
  const DEFAULT_TEMPLATE_FOR = { listed: 'tpl-offer', toship: 'tpl-thanks', shipped: 'tpl-shipped', sold: 'tpl-confirm' };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  function openMessageDialog(item) {
    if (!data.templates.length) {
      toast('Nie masz szablonów wiadomości — dodaj je w Ustawieniach.');
      return;
    }
    const pref = data.templates.find((t) => t.id === DEFAULT_TEMPLATE_FOR[item.status]) || data.templates[0];
    openDialog({
      title: 'Wiadomość z szablonu',
      submitText: 'Kopiuj',
      body: `
        <p class="dlg-lead">${esc(displayName(item))}</p>
        <div class="form-grid">
          ${field('tpl', 'Szablon', `<select id="f-tpl" name="tpl">${data.templates.map((t) => `<option value="${esc(t.id)}" ${t === pref ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>`, { full: true })}
          ${field('msg', 'Treść (możesz ją poprawić)', `<textarea id="f-msg" class="msg-text" rows="5">${esc(fillTemplate(pref.text, item))}</textarea>`, { full: true, hint: 'skopiuj i wklej w rozmowie na Vinted — albo użyj szablonów bezpośrednio we wtyczce' })}
        </div>`,
      extraButtons: item.url ? `<a class="btn" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${icon('link')}Ogłoszenie</a>` : '',
      onMount(form) {
        form.elements.tpl.addEventListener('change', () => {
          const t = data.templates.find((x) => x.id === form.elements.tpl.value);
          if (t) $('#f-msg', form).value = fillTemplate(t.text, item);
        });
      },
      onSubmit(form) {
        copyText($('#f-msg', form).value).then((ok) => toast(ok ? 'Skopiowano wiadomość — wklej ją na Vinted' : 'Nie udało się skopiować — zaznacz tekst ręcznie', { type: ok ? '' : 'error' }));
      },
    });
  }

  function openTemplates() {
    const row = (t = {}) => `
      <div class="tpl" data-id="${esc(t.id || uid())}">
        <div class="tpl-head">
          <input type="text" class="tpl-name" value="${esc(t.name || '')}" placeholder="Nazwa szablonu" maxlength="60" aria-label="Nazwa szablonu">
          <button type="button" class="icon-btn" data-tpl="remove" aria-label="Usuń szablon" title="Usuń">${icon('trash')}</button>
        </div>
        <textarea class="tpl-text" rows="3" maxlength="1000" placeholder="Treść wiadomości…" aria-label="Treść szablonu">${esc(t.text || '')}</textarea>
      </div>`;
    openDialog({
      title: 'Szablony wiadomości',
      body: `
        <p class="small muted" style="margin:0 0 8px">Wstawki, które uzupełnią się same:</p>
        <div class="placeholders">${PLACEHOLDERS.map((x) => `<code>${x}</code>`).join('')}</div>
        <div class="form-grid" style="margin-bottom:14px">
          ${field('discount', 'Rabat dla {cena_rabat} (%)', `<input type="number" id="f-discount" name="discount" min="0" max="90" step="1" value="${data.settings.discount}" inputmode="numeric">`)}
        </div>
        <div class="tpl-list">${data.templates.map(row).join('')}</div>
        <p style="margin:12px 0 0;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn small" data-tpl="add">${icon('plus')}Dodaj szablon</button>
          <button type="button" class="btn small ghost" data-tpl="reset">Przywróć domyślne</button>
        </p>`,
      onMount(form) {
        const list = $('.tpl-list', form);
        form.addEventListener('click', (e) => {
          const b = e.target.closest('[data-tpl]');
          if (!b) return;
          if (b.dataset.tpl === 'add') {
            list.insertAdjacentHTML('beforeend', row());
            $('.tpl:last-child .tpl-name', list).focus();
          } else if (b.dataset.tpl === 'remove') {
            b.closest('.tpl').remove();
          } else if (b.dataset.tpl === 'reset') {
            list.innerHTML = DEFAULT_TEMPLATES.map(row).join('');
          }
        });
      },
      onSubmit(form) {
        const templates = $$('.tpl', form)
          .map((el) => ({ id: el.dataset.id, name: $('.tpl-name', el).value.trim() || 'Szablon', text: $('.tpl-text', el).value.trim() }))
          .filter((t) => t.text);
        const discount = clampInt(form.elements.discount.value, 0, 90);
        commit('Zapisano szablony wiadomości', () => {
          data.templates = templates;
          data.settings.discount = discount;
        });
      },
    });
  }

  /* ---------- Ustawienia, kopia zapasowa, eksport ---------- */

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
  });
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function openSettings() {
    const units = sum(data.items, (i) => i.qty);
    let install = '';
    if (isStandalone()) {
      install = '<p>Aplikacja jest zainstalowana na tym urządzeniu.</p>';
    } else if (installPrompt) {
      install = `<p>Dodaj MyMagazine do ekranu głównego — będzie działać jak zwykła aplikacja, także offline.</p>
        <div class="set-actions"><button type="button" class="btn" data-set="install">${icon('phone')}Zainstaluj aplikację</button></div>`;
    } else if (isIOS()) {
      install = '<p>Na iPhonie: otwórz stronę w Safari, stuknij „Udostępnij”, a potem „Do ekranu początkowego”.</p>';
    } else {
      install = '<p>W Chrome/Edge użyj menu przeglądarki → „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.</p>';
    }

    openDialog({
      title: 'Ustawienia',
      cancelText: 'Zamknij',
      body: `
        <section class="set-section">
          <h3>Kopia zapasowa</h3>
          <p>Dane (${data.items.length} ${posWord(data.items.length)}, ${units} ${unitsWord(units)}) są zapisane tylko w tej przeglądarce na tym urządzeniu.
          Pobierz kopię, aby ich nie stracić lub przenieść je na inne urządzenie (np. z komputera na telefon).
          ${prefs.lastBackup ? `Ostatnia kopia: <b>${esc(fmtDate(prefs.lastBackup))}</b>.` : '<b>Nie zrobiono jeszcze kopii.</b>'}</p>
          <div class="set-actions">
            <button type="button" class="btn primary" data-set="export">${icon('download')}Pobierz kopię</button>
            <button type="button" class="btn" data-set="import">${icon('upload')}Wczytaj kopię</button>
            <input type="file" id="importFile" accept=".json,application/json" hidden>
          </div>
        </section>
        <section class="set-section">
          <h3>Eksport do arkusza</h3>
          <p>Plik CSV otworzysz w Excelu, LibreOffice lub Arkuszach Google.</p>
          <div class="set-actions"><button type="button" class="btn" data-set="csv">${icon('sheet')}Eksportuj CSV</button></div>
        </section>
        <section class="set-section">
          <h3>Kategorie</h3>
          <p>Masz ${data.categories.length} ${plural(data.categories.length, 'kategorię', 'kategorie', 'kategorii')}.</p>
          <div class="set-actions"><button type="button" class="btn" data-set="categories">${icon('folder')}Zarządzaj kategoriami</button></div>
        </section>
        <section class="set-section">
          <h3>Wtyczka Vinted</h3>
          <p><span class="ext-status ${ext.connected ? 'on' : ''}">${ext.connected ? `Połączona${ext.version ? ` (wersja ${esc(ext.version)})` : ''}` : 'Nie wykryto wtyczki w tej przeglądarce'}</span></p>
          <p>„MyMagazine dla Vinted” dodaje na Vinted panel: przenoszenie ogłoszeń i zamówień do MyMagazine, szablony wiadomości w czacie, pomoc przy odświeżaniu ogłoszeń i ich statystyki.</p>
          ${ext.connected ? '' : `<ol class="steps">
            <li>Pobierz plik wtyczki i rozpakuj go.</li>
            <li>Otwórz <b>edge://extensions</b> (Edge) lub <b>chrome://extensions</b> (Chrome) i włącz „Tryb dewelopera”.</li>
            <li>Kliknij „Załaduj rozpakowane” i wskaż rozpakowany folder <b>mymagazine-vinted</b>.</li>
            <li>Odśwież tę stronę.</li>
          </ol>`}
          <div class="set-actions"><a class="btn" href="mymagazine-vinted.zip" download>${icon('download')}Pobierz wtyczkę</a></div>
        </section>
        <section class="set-section">
          <h3>Odświeżanie ogłoszeń</h3>
          <p>Ogłoszenia wystawione dłużej niż podana liczba dni dostaną znacznik „do odświeżenia” (0 = wyłączone).</p>
          <div class="set-actions" style="align-items:center">
            <input type="number" class="num-input" id="setRefresh" min="0" max="365" step="1" inputmode="numeric" value="${data.settings.refreshDays}" aria-label="Liczba dni"> <span>dni</span>
          </div>
        </section>
        <section class="set-section">
          <h3>Szablony wiadomości</h3>
          <p>Masz ${data.templates.length} ${plural(data.templates.length, 'szablon', 'szablony', 'szablonów')}. Używasz ich z menu ⋮ przedmiotu („Wiadomość z szablonu”) albo w czacie na Vinted przez wtyczkę.</p>
          <div class="set-actions"><button type="button" class="btn" data-set="templates">${icon('message')}Edytuj szablony</button></div>
        </section>
        <section class="set-section">
          <h3>Wygląd</h3>
          <div class="segmented" role="group" aria-label="Motyw">
            ${[['auto', 'Automatyczny'], ['light', 'Jasny'], ['dark', 'Ciemny']].map(([id, label]) => `<button type="button" data-theme-set="${id}" aria-pressed="${prefs.theme === id}">${label}</button>`).join('')}
          </div>
        </section>
        <section class="set-section">
          <h3>Aplikacja na telefonie</h3>
          ${install}
        </section>
        <section class="set-section">
          <h3>Usuń wszystkie dane</h3>
          <p>Trwale usuwa wszystkie przedmioty i kategorie z tego urządzenia.</p>
          <div class="set-actions"><button type="button" class="btn danger-ghost" data-set="wipe">${icon('trash')}Usuń wszystko</button></div>
        </section>
        ${storageOk ? '' : '<p class="small" style="color:var(--danger)">Uwaga: przeglądarka nie pozwala zapisywać danych (np. tryb prywatny). Zmiany znikną po zamknięciu karty.</p>'}`,
      onMount(form) {
        $('#setRefresh', form).addEventListener('change', (e) => {
          data.settings.refreshDays = clampInt(e.target.value, 0, 365);
          e.target.value = data.settings.refreshDays;
          persist();
          render();
        });
        $('#importFile', form).addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          e.target.value = '';
          if (file) importBackup(file);
        });
        form.addEventListener('click', async (e) => {
          const t = e.target.closest('[data-theme-set]');
          if (t) {
            prefs.theme = t.dataset.themeSet;
            savePrefs();
            applyTheme();
            $$('[data-theme-set]', form).forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
            return;
          }
          const b = e.target.closest('[data-set]');
          if (!b) return;
          switch (b.dataset.set) {
            case 'export': exportBackup(); openSettings(); break;
            case 'import': $('#importFile', form).click(); break;
            case 'csv': exportCSV(); break;
            case 'categories': openCategories(); break;
            case 'templates': openTemplates(); break;
            case 'install':
              if (installPrompt) {
                installPrompt.prompt();
                installPrompt = null;
              }
              break;
            case 'wipe': {
              const ok = await confirmBox('Wszystkie przedmioty i kategorie zostaną usunięte z tego urządzenia. Zalecamy najpierw pobrać kopię zapasową.', {
                title: 'Usunąć wszystkie dane?', ok: 'Usuń wszystko', danger: true,
              });
              if (!ok) return;
              $('#dialog').close();
              commit('Usunięto wszystkie dane', () => { data = emptyData(); });
              break;
            }
            default: break;
          }
        });
      },
    });
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportBackup() {
    const payload = { app: 'MyMagazine', version: 1, exportedAt: nowISO(), categories: data.categories, items: data.items };
    download(`mymagazine-kopia-${today()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    prefs.lastBackup = today();
    savePrefs();
    toast('Pobrano kopię zapasową');
  }

  async function importBackup(file) {
    let parsed;
    try {
      parsed = normalizeData(JSON.parse(await file.text()));
    } catch {
      toast('To nie jest prawidłowy plik kopii MyMagazine.', { type: 'error' });
      return;
    }
    const ok = await confirmBox(
      `Plik „${file.name}” zawiera ${parsed.items.length} ${posWord(parsed.items.length)} i ${parsed.categories.length} ${plural(parsed.categories.length, 'kategorię', 'kategorie', 'kategorii')}. Obecne dane na tym urządzeniu zostaną zastąpione.`,
      { title: 'Wczytać kopię zapasową?', ok: 'Wczytaj', danger: true },
    );
    if (!ok) return;
    if ($('#dialog').open) $('#dialog').close();
    endSelection();
    commit('Wczytano kopię zapasową', () => { data = parsed; });
  }

  function exportCSV() {
    const n = (v) => (v == null ? '' : String(v).replace('.', ','));
    const cols = [
      ['Nazwa', (i) => i.name],
      ['Produkt z partii', (i) => i.variant],
      ['Kategoria', (i) => catById(i.categoryId)?.name || ''],
      ['Status', (i) => STATUS[i.status]],
      ['Ilość', (i) => i.qty],
      ['Miejsce', (i) => i.location],
      ['Cena zakupu', (i) => n(i.purchasePrice)],
      ['Data dodania', (i) => i.addedAt],
      ['Data wystawienia', (i) => i.listedAt],
      ['Cena wystawienia', (i) => n(i.listPrice)],
      ['Gdzie wystawione', (i) => i.platform],
      ['Data zamówienia', (i) => i.orderedAt],
      ['Kupujący', (i) => i.buyer],
      ['Cena sprzedaży', (i) => n(i.salePrice)],
      ['Termin wysyłki', (i) => i.shipBy],
      ['Data wysyłki', (i) => i.shippedAt],
      ['Przewoźnik', (i) => i.carrier],
      ['Nr przesyłki', (i) => i.tracking],
      ['Data sprzedaży', (i) => i.soldAt],
      ['Data zwrotu', (i) => i.returnedAt],
      ['Link do ogłoszenia', (i) => i.url],
      ['Notatki', (i) => i.notes],
      ['Spis partii', (i) => i.spis.map((e) => (e.price != null ? `${e.name} (${n(e.price)} zł)` : e.name)).join(', ')],
    ];
    const cell = (v) => {
      let s = String(v ?? '');
      if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = `'${s}`; // ochrona przed formułami w arkuszu
      return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [cols.map((c) => c[0])].concat(
      data.items
        .slice()
        .sort((a, b) => FLOW.indexOf(a.status) - FLOW.indexOf(b.status) || a.name.localeCompare(b.name, 'pl'))
        .map((i) => cols.map((c) => c[1](i))),
    );
    download(`mymagazine-${today()}.csv`, `﻿${rows.map((r) => r.map(cell).join(';')).join('\r\n')}`, 'text/csv;charset=utf-8');
    toast('Wyeksportowano plik CSV');
  }

  function applyTheme() {
    const root = document.documentElement;
    if (prefs.theme === 'light' || prefs.theme === 'dark') root.dataset.theme = prefs.theme;
    else delete root.dataset.theme;
  }

  /* ======================= Zdarzenia ======================= */

  function openAdd() {
    if (!canAdd()) setView('magazyn');
    openItemForm(null, { listNow: ui.view === 'wystawione' });
  }

  function bindEvents() {
    // Ikony w statycznym HTML
    $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

    window.addEventListener('hashchange', () => setView(location.hash.slice(1)));

    $('#btnAdd').addEventListener('click', openAdd);
    $('#fab').addEventListener('click', openAdd);

    const narrow = window.matchMedia('(max-width: 640px)');
    const setPlaceholder = () => {
      $('#search').placeholder = narrow.matches ? 'Szukaj…' : 'Szukaj po nazwie, notatce, kupującym…';
    };
    setPlaceholder();
    narrow.addEventListener('change', setPlaceholder);

    $('#search').addEventListener('input', (e) => {
      F().search = e.target.value;
      renderListAndStats();
      renderBulkbar();
    });
    $('#sort').addEventListener('change', (e) => {
      F().sort = e.target.value;
      renderToolbar();
      renderListAndStats();
    });
    $('#btnSelect').addEventListener('click', () => {
      if (ui.selecting) endSelection();
      else ui.selecting = true;
      render();
    });

    $('#toolbar').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      F()[chip.dataset.filter] = chip.dataset.value;
      renderToolbar();
      renderListAndStats();
      renderBulkbar();
    });

    // Otwieranie ustawień / kategorii z dowolnego miejsca
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b) return;
      if (b.dataset.open === 'settings') openSettings();
      if (b.dataset.open === 'categories') openCategories();
    });

    $('#inboxBanner').addEventListener('click', (e) => {
      if (e.target.closest('[data-act="inbox"]')) openInbox();
    });

    $('#resultInfo').addEventListener('click', (e) => {
      if (e.target.closest('[data-act="clear-filters"]')) clearFilters();
    });

    const list = $('#list');
    list.addEventListener('click', (e) => {
      if (e.target.closest('a[href]')) return;
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const act = el.dataset.act;
      if (act === 'clear-filters') return clearFilters();
      if (act === 'add') return openAdd();
      const card = el.closest('.item');
      const item = card && getItem(card.dataset.id);
      if (!item) return;
      if (act === 'toggle-select') return toggleSelect(item.id, el.checked);
      if (act === 'open') return ui.selecting ? toggleSelect(item.id) : openItemForm(item);
      if (act === 'menu') return openItemMenu(item, el);
      if (ACTIONS[act]) ACTIONS[act].run(item);
    });
    list.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act="open"]')) {
        e.preventDefault();
        e.target.click();
      }
    });

    $('#bulkbar').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-bulk]');
      if (!b || b.disabled) return;
      const selected = [...ui.selected].map(getItem).filter(Boolean);
      switch (b.dataset.bulk) {
        case 'close':
          endSelection();
          render();
          break;
        case 'all': {
          const ids = filteredItems().map((i) => i.id);
          const allSel = ids.length > 0 && ids.every((id) => ui.selected.has(id));
          ui.selected = allSel ? new Set() : new Set(ids);
          renderListAndStats();
          renderBulkbar();
          break;
        }
        case 'ship':
          openMoveDialog(selected, 'shipped');
          break;
        case 'sell':
          openMoveDialog(selected, 'sold');
          break;
        case 'category':
          openBulkCategory(selected);
          break;
        case 'delete': {
          const n = selected.length;
          const ok = await confirmBox(`Zaznaczone ${posWord(n)} (${n}) zostaną usunięte. Możesz to cofnąć zaraz po usunięciu.`, {
            title: `Usunąć ${n} ${posWord(n)}?`, ok: 'Usuń', danger: true,
          });
          if (!ok) return;
          const ids = new Set(selected.map((i) => i.id));
          commit(`Usunięto ${n} ${posWord(n)}`, () => {
            data.items = data.items.filter((i) => !ids.has(i.id));
            endSelection();
          });
          break;
        }
        default:
          break;
      }
    });

    $('#menuBackdrop').addEventListener('click', closeMenu);
    window.addEventListener('resize', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#menu').hidden) {
        closeMenu();
        return;
      }
      const typing = e.target.closest('input, textarea, select, [contenteditable]');
      if (typing || e.ctrlKey || e.metaKey || e.altKey || $('#dialog').open || $('#confirm').open) return;
      if (e.key === '/') {
        e.preventDefault();
        $('#search').focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAdd();
      }
    });

    // Zmiany zrobione w innej karcie przeglądarki
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        data = loadData();
        render();
      }
    });
  }

  /* ======================= Start ======================= */

  applyTheme();
  bindEvents();
  postToExtension({ type: 'ping' });
  setView(location.hash.slice(1) || 'magazyn');

  if (!storageOk) {
    toast('Przeglądarka blokuje zapis danych — zmiany nie zostaną zachowane.', { type: 'error', duration: 8000 });
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker:', err));
    });
  }
})();
