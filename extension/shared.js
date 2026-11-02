/* MyMagazine dla Vinted — wspólne funkcje (panel na Vinted i okienko wtyczki). */
/* exported MM */
const MM = (() => {
  const APP_URL = 'https://blazej21r.github.io/Magazyn/';

  // Te same domyślne szablony co w aplikacji — używane, dopóki wtyczka nie połączy się z MyMagazine
  const DEFAULT_TEMPLATES = [
    { id: 'tpl-thanks', name: 'Podziękowanie za zakup', text: 'Dzień dobry {kupujacy}! Dziękuję za zakup „{nazwa}”. Wyślę paczkę najszybciej, jak to możliwe, i dam znać, gdy będzie w drodze. Pozdrawiam!' },
    { id: 'tpl-shipped', name: 'Paczka wysłana', text: 'Paczka z „{nazwa}” jest już w drodze ({przewoznik}). Numer przesyłki: {numer}. Miłego dnia!' },
    { id: 'tpl-offer', name: 'Oferta dla obserwujących', text: 'Cześć! Widzę, że „{nazwa}” jest w Twoich ulubionych. Mogę go oddać za {cena_rabat} zamiast {cena}. Daj znać, jeśli chcesz skorzystać!' },
    { id: 'tpl-confirm', name: 'Prośba o potwierdzenie odbioru', text: 'Dzień dobry! Paczka powinna już do Ciebie dotrzeć. Jeśli wszystko jest w porządku, potwierdź proszę odbiór na Vinted. Dziękuję!' },
    { id: 'tpl-condition', name: 'Odpowiedź o stan', text: 'Dzień dobry! „{nazwa}” jest w bardzo dobrym stanie, bez wad. Chętnie odpowiem na inne pytania.' },
  ];

  const get = (keys) => chrome.storage.local.get(keys);
  const set = (obj) => chrome.storage.local.set(obj);
  const remove = (keys) => chrome.storage.local.remove(keys);

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, ' ').trim();
  const moneyFmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  const money = (n) => (n == null || !Number.isFinite(Number(n)) ? '' : moneyFmt.format(Number(n)));

  /** „1 299,99 zł” / „120.0” / 120 → 1299.99 / 120 / 120 */
  function parsePrice(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
    const m = String(v).replace(/ | /g, ' ').match(/\d[\d ]*(?:[.,]\d{1,2})?/);
    if (!m) return null;
    const n = Number(m[0].replace(/ /g, '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  /** Dodaje ogłoszenie lub zamówienie do kolejki; MyMagazine odbierze je, gdy będzie otwarty. */
  async function queueImport(imp) {
    const { mm_inbox: inbox = [] } = await get('mm_inbox');
    inbox.push({ id: uid(), createdAt: new Date().toISOString(), ...imp });
    await set({ mm_inbox: inbox.slice(-200) });
  }

  /** Te same wstawki co w aplikacji: {nazwa}, {cena}, {cena_rabat}, {rabat}, {kupujacy}, {przewoznik}, {numer}, {link}. */
  function fillTemplate(text, ctx, discount = 10) {
    const price = parsePrice(ctx.cena);
    const values = {
      nazwa: ctx.nazwa || '',
      cena: price != null ? money(price) : '',
      cena_rabat: price != null ? money(Math.round(price * (1 - discount / 100))) : '',
      rabat: `${discount}%`,
      kupujacy: ctx.kupujacy || '',
      przewoznik: ctx.przewoznik || '',
      numer: ctx.numer || '',
      link: ctx.link || '',
    };
    return String(text).replace(/\{([a-ząćęłńóśźż_]+)\}/gi, (m, key) => {
      const k = norm(key);
      return k in values ? values[k] : m;
    });
  }

  function timeAgo(iso) {
    const t = Date.parse(iso);
    if (!t) return '';
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return 'przed chwilą';
    if (min < 60) return `${min} min temu`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h} godz. temu`;
    return `${Math.round(h / 24)} dni temu`;
  }

  return { APP_URL, DEFAULT_TEMPLATES, get, set, remove, uid, esc, norm, money, parsePrice, queueImport, fillTemplate, timeAgo };
})();
