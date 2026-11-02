/* MyMagazine dla Vinted — panel na stronach Vinted.
 *
 * Strona ogłoszenia  → „Dodaj do MyMagazine”, statystyki, „Odśwież ogłoszenie” (zapis szkicu ze zdjęciami)
 * Formularz Sprzedaj → „Wypełnij formularz” ze szkicu (tytuł, opis, cena, zdjęcia)
 * Rozmowa (czat)     → szablony wiadomości wstawiane jednym kliknięciem, „Dodaj zamówienie do MyMagazine”
 *
 * Nic nie jest wysyłane na Vinted automatycznie — każdą wiadomość i każde ogłoszenie zatwierdzasz sam.
 */
(() => {
  if (window.top !== window || document.getElementById('mymagazine-panel')) return;

  const CSS = `
    :host { all: initial; }
    [hidden] { display: none !important; }
    .mm { position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; font: 14px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #15191e; }
    .mm * { box-sizing: border-box; }
    .pill { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px 0 8px; border: 0; border-radius: 21px;
      background: #2f6fed; color: #fff; font: 600 13.5px/1 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; cursor: pointer;
      box-shadow: 0 6px 20px rgba(47, 111, 237, .35); }
    .pill img { width: 28px; height: 28px; border-radius: 8px; }
    .pill .n { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: #fff; color: #c2410c; font-size: 12px; line-height: 20px; text-align: center; }
    .card { width: 330px; max-height: min(620px, calc(100vh - 32px)); display: flex; flex-direction: column; overflow: hidden;
      background: #fff; border: 1px solid #e3e6eb; border-radius: 16px; box-shadow: 0 16px 48px rgba(16, 24, 40, .22); }
    .head { display: flex; align-items: center; gap: 10px; padding: 12px 12px 10px 14px; border-bottom: 1px solid #eef0f3; }
    .head img { width: 26px; height: 26px; border-radius: 7px; }
    .head b { flex: 1; font-size: 15px; }
    .x { width: 30px; height: 30px; border: 0; border-radius: 8px; background: none; color: #5b6470; font-size: 18px; cursor: pointer; }
    .x:hover { background: #f2f4f7; }
    .body { padding: 12px 14px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    p { margin: 0; }
    .muted { color: #6b7480; font-size: 12.5px; }
    .h { font-size: 11.5px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; color: #7a8491; margin-top: 2px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 650; color: #4c5563; }
    input, textarea { width: 100%; height: 36px; padding: 0 10px; border: 1px solid #cdd3db; border-radius: 9px; font: inherit; font-weight: 400; color: #15191e; background: #fff; }
    textarea { height: auto; min-height: 64px; padding: 8px 10px; resize: vertical; }
    input:focus, textarea:focus { outline: none; border-color: #2f6fed; box-shadow: 0 0 0 3px #e9f0fe; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    button.b { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 6px 12px;
      border: 1px solid #cdd3db; border-radius: 9px; background: #fff; color: #15191e; font: 600 13.5px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; cursor: pointer; text-align: center; }
    button.b:hover { background: #f2f4f7; }
    button.b.primary { background: #2f6fed; border-color: #2f6fed; color: #fff; }
    button.b.primary:hover { background: #2358cf; }
    button.b:disabled { opacity: .55; cursor: default; }
    .actions { display: flex; flex-direction: column; gap: 6px; }
    .tpls { display: flex; flex-direction: column; gap: 6px; }
    .tpls button.b { justify-content: flex-start; text-align: left; font-weight: 550; }
    .box { padding: 10px 12px; border-radius: 10px; background: #f2f4f7; font-size: 13px; }
    .box.ok { background: #e2f3e8; color: #135c30; }
    .box.warn { background: #fdf1e3; color: #7a3d00; }
    .box.err { background: #fdeceb; color: #9b1c1c; }
    .linked { padding: 8px 10px; border-radius: 10px; background: #e5edfd; color: #1d4fb0; font-size: 13px; }
    .stats { display: flex; gap: 12px; font-size: 12.5px; color: #4c5563; }
    .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .tile { padding: 8px 10px; border: 1px solid #e3e6eb; border-radius: 10px; }
    .tile b { display: block; font-size: 18px; }
    .tile.alert b { color: #c2410c; }
    ul { margin: 0; padding-left: 18px; font-size: 13px; }
    li.late { color: #b91c1c; }
    details { border: 1px solid #e3e6eb; border-radius: 10px; padding: 8px 10px; }
    details[open] { display: flex; flex-direction: column; gap: 8px; }
    summary { cursor: pointer; font-weight: 650; font-size: 13.5px; }
    ol { margin: 0; padding-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  `;

  const icon = chrome.runtime.getURL('icons/icon-48.png');
  const host = document.createElement('div');
  host.id = 'mymagazine-panel';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style>
    <div class="mm">
      <button type="button" class="pill" data-a="open"><img src="${icon}" alt=""><span data-r="pill">MyMagazine</span></button>
      <section class="card" hidden>
        <div class="head"><img src="${icon}" alt=""><b>MyMagazine</b><button type="button" class="x" data-a="close" title="Zwiń" aria-label="Zwiń panel">✕</button></div>
        <div class="body" data-r="body"></div>
      </section>
    </div>`;
  document.documentElement.appendChild(host);

  const $ = (sel) => root.querySelector(sel);
  const { esc } = MM;
  const state = { route: null, item: null, chat: null, expanded: false };

  /* ---------------- Wspólne ---------------- */

  function setBody(html) {
    $('[data-r="body"]').innerHTML = html;
  }
  function setPill(text, n) {
    $('[data-r="pill"]').innerHTML = `${esc(text)}${n ? ` <span class="n">${n}</span>` : ''}`;
  }
  function message(html, cls = '') {
    const el = $('[data-r="msg"]');
    if (el) el.innerHTML = html ? `<div class="box ${cls}">${html}</div>` : '';
  }
  function expand(on) {
    state.expanded = on;
    $('.card').hidden = !on;
    $('.pill').hidden = on;
    MM.set({ mm_panel_expanded: on });
  }
  function waitFor(test, timeout = 8000) {
    return new Promise((resolve) => {
      const start = Date.now();
      (function tick() {
        const v = test();
        if (v || Date.now() - start > timeout) resolve(v);
        else setTimeout(tick, 250);
      })();
    });
  }
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const meta = (name) => {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  };
  async function appUrl() {
    const { mm_snapshot: snap } = await MM.get('mm_snapshot');
    return (snap && snap.appUrl) || MM.APP_URL;
  }

  function route() {
    const p = location.pathname;
    if (/\/items\/new(\/|$)/.test(p)) return { type: 'sell' };
    let m = p.match(/\/items\/(\d+)(?:-[^/]*)?\/?$/);
    if (m) return { type: 'item', id: m[1] };
    m = p.match(/\/inbox\/(\d+)/);
    if (m) return { type: 'chat', id: m[1] };
    return { type: 'other' };
  }

  /* ---------------- Odczyt ogłoszenia ---------------- */

  function readJsonLd() {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent);
        const list = Array.isArray(j) ? j : (j['@graph'] || [j]);
        const p = list.find((x) => x && [].concat(x['@type']).includes('Product'));
        if (p) return p;
      } catch {
        // niepoprawny JSON — pomijamy
      }
    }
    return null;
  }

  /** Wartość z listy szczegółów ogłoszenia po etykiecie, np. „Marka” → „Nike”. */
  function detail(labels) {
    const wanted = labels.map(MM.norm);
    for (const el of document.querySelectorAll('main dt, main span, main div, main p, dt, [data-testid*="details"] *')) {
      if (el.children.length > 1) continue;
      if (!wanted.includes(MM.norm(text(el)))) continue;
      const next = el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling);
      const value = text(next);
      if (value && value.length < 80 && !wanted.includes(MM.norm(value))) return value;
    }
    return '';
  }
  const countFrom = (s) => {
    const m = String(s || '').replace(/\s/g, '').match(/\d+/);
    return m ? Number(m[0]) : null;
  };

  async function fetchApiItem(id) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`/api/v2/items/${id}?localize=false`, { credentials: 'include', headers: { accept: 'application/json' }, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const j = await res.json();
      return j && j.item && j.item.title ? j.item : null;
    } catch {
      return null;
    }
  }

  /** Czyta dane ogłoszenia: najpierw z API Vinted, potem z danych strukturalnych i treści strony. */
  async function readItem(id) {
    const api = await fetchApiItem(id);
    const ld = readJsonLd();
    const offers = ld && [].concat(ld.offers || [])[0];
    const apiPrice = api && (api.price && typeof api.price === 'object' ? api.price.amount : (api.price_numeric ?? api.price));
    const ogTitle = meta('og:title').replace(/\s*[|–-]\s*Vinted.*$/i, '');

    const photos = [];
    const addPhoto = (u) => {
      if (typeof u === 'string' && /^https:\/\//.test(u) && !photos.includes(u)) photos.push(u);
    };
    if (api && Array.isArray(api.photos)) api.photos.forEach((p) => addPhoto(p.full_size_url || p.url));
    if (ld && ld.image) [].concat(ld.image).forEach((u) => addPhoto(typeof u === 'string' ? u : u && u.url));
    if (!photos.length) addPhoto(meta('og:image'));
    if (photos.length < 2) {
      document.querySelectorAll('main img[src*="vinted.net"]').forEach((img) => {
        if (img.naturalWidth >= 300 || img.width >= 200) addPhoto(img.currentSrc || img.src);
      });
    }

    const priceEl = document.querySelector('[data-testid*="price" i]');
    const conditionLd = ld && String(ld.itemCondition || '').split('/').pop();
    return {
      vintedId: id,
      url: location.origin + location.pathname.replace(/\/$/, ''),
      title: (api && api.title) || (ld && ld.name) || ogTitle || text(document.querySelector('h1')),
      price: MM.parsePrice(apiPrice) ?? MM.parsePrice(offers && offers.price) ?? MM.parsePrice(meta('product:price:amount')) ?? MM.parsePrice(text(priceEl)),
      description: ((api && api.description) || (ld && ld.description) || meta('og:description') || '').slice(0, 2000),
      photos: photos.slice(0, 20),
      brand: (api && (api.brand_title || (api.brand_dto && api.brand_dto.title))) || (ld && ld.brand && (ld.brand.name || ld.brand)) || detail(['Marka', 'Brand']),
      size: (api && api.size_title) || detail(['Rozmiar', 'Size']),
      condition: (api && api.status) || detail(['Stan', 'Condition']) || ({ NewCondition: 'Nowy', UsedCondition: 'Używany' }[conditionLd] || ''),
      views: api && api.view_count != null ? Number(api.view_count) : countFrom(detail(['Wyświetlenia', 'Views'])),
      favs: api && (api.favourite_count ?? api.favorites_count) != null
        ? Number(api.favourite_count ?? api.favorites_count)
        : countFrom(detail(['Zainteresowani', 'Ulubione', 'Interested', 'Favourites'])),
    };
  }

  const importFields = (item, edits = {}) => ({
    title: edits.title || item.title,
    price: edits.price ?? item.price,
    url: item.url,
    vintedId: item.vintedId,
    photo: item.photos[0] || '',
    description: item.description,
    brand: typeof item.brand === 'string' ? item.brand : '',
    size: item.size,
    condition: item.condition,
    views: item.views,
    favs: item.favs,
  });

  /* ---------------- Strona ogłoszenia ---------------- */

  async function showItem(id) {
    setPill('MyMagazine: ogłoszenie');
    setBody('<p class="muted">Czytam ogłoszenie…</p>');
    await waitFor(() => document.querySelector('h1') || meta('og:title'));
    const item = await readItem(id);
    if (!state.route || state.route.id !== id) return; // przejście na inną stronę w międzyczasie
    state.item = item;

    const { mm_snapshot: snap, mm_repost: repost, mm_seen: seen = {} } = await MM.get(['mm_snapshot', 'mm_repost', 'mm_seen']);
    const linked = snap && snap.linked && snap.linked[id];
    let notice = '';

    if (repost && repost.oldVintedId !== id && MM.norm(repost.title) === MM.norm(item.title) && Date.now() - repost.at < 3 * 86400000) {
      // Nowe ogłoszenie po odświeżeniu — MyMagazine podmieni link i zapisze datę wystawienia
      await MM.queueImport({ type: 'listing', replaces: repost.oldVintedId, ...importFields(item) });
      await MM.remove(['mm_repost', 'mm_draft']);
      notice = '<div class="box ok">To odświeżone ogłoszenie — przekazano do MyMagazine (nowy link i dzisiejsza data wystawienia).</div>';
    } else if (linked && (item.views != null || item.favs != null)) {
      // Statystyki powiązanego ogłoszenia aktualizują się same, raz dziennie
      const day = new Date().toISOString().slice(0, 10);
      if (seen[id] !== day) {
        seen[id] = day;
        const keys = Object.keys(seen);
        if (keys.length > 500) keys.slice(0, keys.length - 500).forEach((k) => delete seen[k]);
        await MM.set({ mm_seen: seen });
        await MM.queueImport({ type: 'listing', silent: true, ...importFields(item) });
      }
    }

    const stats = [item.views != null ? `👁 ${item.views} wyświetleń` : '', item.favs != null ? `♥ ${item.favs} polubień` : ''].filter(Boolean).join('</span><span>');
    setBody(`
      ${notice}
      ${linked ? `<div class="linked">W MyMagazine: <b>${esc(linked.name)}</b> · ${esc(linked.statusLabel || '')}${linked.location ? ` · ${esc(linked.location)}` : ''}</div>` : ''}
      <label>Tytuł<input data-f="title" value="${esc(item.title)}"></label>
      <div class="row">
        <label>Cena (zł)<input data-f="price" inputmode="decimal" value="${item.price != null ? String(item.price).replace('.', ',') : ''}"></label>
        <label>Zdjęcia<input value="${item.photos.length}" disabled></label>
      </div>
      ${stats ? `<div class="stats"><span>${stats}</span></div>` : ''}
      <div class="actions">
        <button type="button" class="b primary" data-a="send-listing">${linked ? 'Aktualizuj w MyMagazine' : 'Dodaj do MyMagazine'}</button>
        <button type="button" class="b" data-a="repost">↻ Odśwież ogłoszenie (wystaw ponownie)</button>
      </div>
      <div data-r="msg"></div>`);
  }

  async function sendListing() {
    const item = state.item;
    if (!item) return;
    const title = $('[data-f="title"]').value.trim();
    if (!title) {
      message('Wpisz tytuł.', 'err');
      return;
    }
    await MM.queueImport({ type: 'listing', ...importFields(item, { title, price: MM.parsePrice($('[data-f="price"]').value) }) });
    message('Wysłano do MyMagazine. Otwórz aplikację, aby je przypisać (np. do spisu partii).<br><button type="button" class="b" data-a="open-app" style="margin-top:8px">Otwórz MyMagazine</button>', 'ok');
  }

  async function startRepost() {
    const item = state.item;
    if (!item) return;
    const btn = $('[data-a="repost"]');
    btn.disabled = true;
    message('Pobieram zdjęcia ogłoszenia…');
    let photos = [];
    try {
      const res = await chrome.runtime.sendMessage({ type: 'fetchPhotos', urls: item.photos });
      photos = (res && res.photos) || [];
    } catch {
      photos = [];
    }
    await MM.set({
      mm_draft: {
        title: $('[data-f="title"]').value.trim() || item.title,
        description: item.description,
        price: MM.parsePrice($('[data-f="price"]').value) ?? item.price,
        brand: typeof item.brand === 'string' ? item.brand : '',
        size: item.size,
        condition: item.condition,
        photos,
        oldVintedId: item.vintedId,
        savedAt: Date.now(),
      },
    });
    btn.disabled = false;
    message(`<b>Zapisano szkic</b> (zdjęcia: ${photos.length}${item.photos.length > photos.length ? ` z ${item.photos.length}` : ''}).
      <ol style="margin-top:6px">
        <li>Usuń to ogłoszenie na Vinted, żeby nie było dwóch takich samych.</li>
        <li>Otwórz formularz „Sprzedaj” — wypełnię tytuł, opis, cenę i zdjęcia.</li>
        <li>Wybierz kategorię, markę, rozmiar i stan, potem opublikuj.</li>
      </ol>
      <button type="button" class="b primary" data-a="go-sell" style="margin-top:8px;width:100%">Otwórz formularz „Sprzedaj”</button>`, 'ok');
  }

  /* ---------------- Formularz „Sprzedaj” ---------------- */

  async function showSell() {
    const { mm_draft: draft } = await MM.get('mm_draft');
    if (!draft) {
      setPill('MyMagazine');
      setBody('<p class="muted">Brak zapisanego ogłoszenia do ponownego wystawienia. Na stronie swojego ogłoszenia kliknij „Odśwież ogłoszenie”.</p>');
      return;
    }
    setPill('MyMagazine: wypełnij formularz', 1);
    setBody(`
      <p class="h">Ogłoszenie do odświeżenia</p>
      <p><b>${esc(draft.title)}</b></p>
      <p class="muted">${esc(MM.money(draft.price))} · zdjęcia: ${draft.photos.length}${draft.brand ? ` · ${esc(draft.brand)}` : ''}${draft.size ? ` · rozm. ${esc(draft.size)}` : ''}</p>
      <div class="actions">
        <button type="button" class="b primary" data-a="fill">Wypełnij formularz</button>
        <button type="button" class="b" data-a="drop-draft">Usuń szkic</button>
      </div>
      <div data-r="msg"></div>`);
  }

  /** Ustawia wartość pola tak, by strona (React) zauważyła zmianę. */
  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  const findField = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !host.contains(el)) return el;
    }
    return null;
  };
  function dataUrlToFile(dataUrl, i) {
    const [head, b64] = dataUrl.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k += 1) bytes[k] = bin.charCodeAt(k);
    return new File([bytes], `zdjecie-${i + 1}.${type.split('/')[1] || 'jpg'}`, { type });
  }

  async function fillSellForm() {
    const { mm_draft: draft } = await MM.get('mm_draft');
    if (!draft) return;
    message('Szukam pól formularza…');
    const ready = await waitFor(() => findField(['input[name="title"]', '#title', 'input[data-testid*="title" i]', 'input[id*="title" i]']), 10000);
    if (!ready) {
      message('Nie znalazłem formularza „Sprzedaj”. Poczekaj, aż się załaduje, i spróbuj ponownie.', 'err');
      return;
    }
    const done = [];
    const missed = [];
    const fill = (label, selectors, value) => {
      if (value == null || value === '') return;
      const el = findField(selectors);
      if (el) {
        setValue(el, value);
        done.push(label);
      } else {
        missed.push(label);
      }
    };
    fill('tytuł', ['input[name="title"]', '#title', 'input[data-testid*="title" i]', 'input[id*="title" i]'], draft.title);
    fill('opis', ['textarea[name="description"]', '#description', 'textarea[data-testid*="description" i]', 'textarea[id*="description" i]'], draft.description);
    const price = draft.price == null ? '' : (Number.isInteger(draft.price) ? String(draft.price) : String(draft.price).replace('.', ','));
    fill('cena', ['input[name="price"]', '#price', 'input[data-testid*="price" i]', 'input[id*="price" i]'], price);

    if (draft.photos.length) {
      const input = findField(['input[type="file"][accept*="image"]', 'input[type="file"]']);
      if (input) {
        const dt = new DataTransfer();
        draft.photos.forEach((p, i) => dt.items.add(dataUrlToFile(p, i)));
        input.files = dt.files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        done.push(`zdjęcia (${draft.photos.length})`);
      } else {
        missed.push('zdjęcia');
      }
    }

    // Gdy nowe ogłoszenie się pojawi, panel rozpozna je po tytule i przekaże do MyMagazine jako odświeżone
    await MM.set({ mm_repost: { title: draft.title, oldVintedId: draft.oldVintedId, at: Date.now() } });
    message(`Uzupełniono: <b>${done.join(', ') || 'nic'}</b>.${missed.length ? `<br>Nie znalazłem pól: ${missed.join(', ')} — uzupełnij je ręcznie.` : ''}
      <br>Wybierz jeszcze <b>kategorię, markę, rozmiar i stan</b>, sprawdź wszystko i opublikuj.`, missed.length ? 'warn' : 'ok');
  }

  /* ---------------- Rozmowa (czat) ---------------- */

  function readChat() {
    const links = [...document.querySelectorAll('a[href*="/items/"]')].filter((a) => !host.contains(a) && /\/items\/\d+/.test(a.getAttribute('href')));
    const itemLink = links.find((a) => text(a)) || links[0] || null;
    const vintedId = itemLink ? (itemLink.getAttribute('href').match(/\/items\/(\d+)/) || [])[1] : '';
    let title = text(itemLink);
    if (!title && itemLink) {
      const img = itemLink.querySelector('img[alt]');
      title = img ? img.getAttribute('alt') : '';
    }
    // Cena: najbliższy pojedynczy element z kwotą obok ogłoszenia
    // (sprawdzamy elementy osobno — sklejony tekst „…Force 42” + „120,00 zł” dałby „42120,00”)
    const PRICE = /^[^\d]{0,3}\d[\d\s]*[.,]\d{2}\s*(zł|PLN|€|EUR)\s*$/i;
    let price = null;
    for (let el = itemLink && itemLink.parentElement, k = 0; el && k < 5 && price == null; el = el.parentElement, k += 1) {
      const leaf = [...el.querySelectorAll('*')].find((x) => !x.children.length && PRICE.test(text(x)));
      if (leaf) price = MM.parsePrice(text(leaf));
    }
    const member = [...document.querySelectorAll('a[href*="/member/"]')].find((a) => !host.contains(a) && text(a));
    return {
      vintedId: vintedId || '',
      url: itemLink ? new URL(itemLink.getAttribute('href'), location.origin).href.split('?')[0] : '',
      title,
      price,
      buyer: text(member),
    };
  }

  function chatBox() {
    const boxes = [...document.querySelectorAll('textarea, [contenteditable="true"]')].filter((el) => el.offsetParent !== null);
    return boxes[boxes.length - 1] || null;
  }

  function insertIntoChat(value) {
    const box = chatBox();
    if (!box) return false;
    box.focus();
    if (box.tagName === 'TEXTAREA') setValue(box, box.value.trim() ? `${box.value}\n${value}` : value);
    else document.execCommand('insertText', false, value);
    return true;
  }

  async function showChat() {
    setPill('MyMagazine: szablony');
    setBody('<p class="muted">Czytam rozmowę…</p>');
    await waitFor(() => chatBox());
    const routeId = state.route && state.route.id;
    const chat = readChat();
    if (!state.route || state.route.id !== routeId) return;
    state.chat = chat;
    const { mm_snapshot: snap } = await MM.get('mm_snapshot');
    const linked = snap && snap.linked && chat.vintedId ? snap.linked[chat.vintedId] : null;
    const templates = (snap && snap.templates && snap.templates.length) ? snap.templates : MM.DEFAULT_TEMPLATES;
    state.tplCtx = {
      nazwa: (linked && linked.name) || chat.title,
      cena: (linked && linked.price) ?? chat.price,
      kupujacy: (linked && linked.buyer) || chat.buyer,
      przewoznik: linked && linked.carrier,
      numer: linked && linked.tracking,
      link: chat.url,
    };
    state.templates = templates;
    state.discount = snap && snap.discount != null ? snap.discount : 10;

    setBody(`
      ${linked ? `<div class="linked">W MyMagazine: <b>${esc(linked.name)}</b> · ${esc(linked.statusLabel || '')}${linked.location ? ` · ${esc(linked.location)}` : ''}</div>` : ''}
      <p class="h">Wstaw wiadomość</p>
      <div class="tpls">${templates.map((t) => `<button type="button" class="b" data-a="tpl" data-id="${esc(t.id)}">${esc(t.name)}</button>`).join('')}</div>
      <p class="muted">Tekst trafi do pola wiadomości — sprawdź go i wyślij sam.</p>
      <details>
        <summary>Dodaj zamówienie do MyMagazine</summary>
        <label>Produkt<input data-f="o-title" value="${esc(chat.title)}"></label>
        <div class="row">
          <label>Cena (zł)<input data-f="o-price" inputmode="decimal" value="${chat.price != null ? String(chat.price).replace('.', ',') : ''}"></label>
          <label>Kupujący<input data-f="o-buyer" value="${esc(chat.buyer)}"></label>
        </div>
        <button type="button" class="b primary" data-a="send-order">Wyślij jako zamówienie</button>
      </details>
      <div data-r="msg"></div>`);
  }

  async function sendOrder() {
    const chat = state.chat;
    const title = $('[data-f="o-title"]').value.trim();
    if (!title) {
      message('Wpisz nazwę produktu.', 'err');
      return;
    }
    await MM.queueImport({
      type: 'order',
      title,
      price: MM.parsePrice($('[data-f="o-price"]').value),
      buyer: $('[data-f="o-buyer"]').value.trim(),
      url: chat ? chat.url : '',
      vintedId: chat ? chat.vintedId : '',
    });
    message('Wysłano zamówienie do MyMagazine — otwórz aplikację, aby przenieść je do „Do wysłania”.<br><button type="button" class="b" data-a="open-app" style="margin-top:8px">Otwórz MyMagazine</button>', 'ok');
  }

  /* ---------------- Pozostałe strony ---------------- */

  async function showOther() {
    const { mm_snapshot: snap, mm_inbox: inbox = [] } = await MM.get(['mm_snapshot', 'mm_inbox']);
    const c = (snap && snap.counts) || null;
    setPill('MyMagazine', c && c.toship);
    if (!snap) {
      setBody(`<p>Otwórz MyMagazine w tej przeglądarce, aby połączyć wtyczkę z aplikacją.</p>
        <button type="button" class="b primary" data-a="open-app">Otwórz MyMagazine</button>`);
      return;
    }
    setBody(`
      <div class="tiles">
        <div class="tile ${c.toship ? 'alert' : ''}"><span class="muted">Do wysłania</span><b>${c.toship}</b></div>
        <div class="tile"><span class="muted">Wystawione</span><b>${c.listed}</b></div>
        <div class="tile"><span class="muted">Do odświeżenia</span><b>${c.refresh}</b></div>
        <div class="tile"><span class="muted">W drodze</span><b>${c.shipped}</b></div>
      </div>
      ${snap.toship.length ? `<p class="h">Do wysłania</p><ul>${snap.toship.slice(0, 5).map((o) => `<li class="${o.late ? 'late' : ''}">${esc(o.name)}${o.location ? ` · ${esc(o.location)}` : ''}${o.buyer ? ` · ${esc(o.buyer)}` : ''}</li>`).join('')}</ul>` : ''}
      ${inbox.length ? `<div class="box warn">${inbox.length} poz. czeka na przeniesienie — otwórz MyMagazine.</div>` : ''}
      <p class="muted">Zsynchronizowano ${esc(MM.timeAgo(snap.updatedAt))}</p>
      <button type="button" class="b primary" data-a="open-app">Otwórz MyMagazine</button>`);
  }

  /* ---------------- Sterowanie ---------------- */

  async function render() {
    const r = route();
    state.route = r;
    state.item = null;
    state.chat = null;
    if (r.type === 'item') await showItem(r.id);
    else if (r.type === 'sell') await showSell();
    else if (r.type === 'chat') await showChat();
    else await showOther();
  }

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    switch (b.dataset.a) {
      case 'open': expand(true); break;
      case 'close': expand(false); break;
      case 'send-listing': await sendListing(); break;
      case 'repost': await startRepost(); break;
      case 'go-sell': location.assign('/items/new'); break;
      case 'fill': await fillSellForm(); break;
      case 'drop-draft':
        await MM.remove(['mm_draft', 'mm_repost']);
        await showSell();
        break;
      case 'tpl': {
        const t = (state.templates || []).find((x) => x.id === b.dataset.id);
        if (!t) break;
        const ok = insertIntoChat(MM.fillTemplate(t.text, state.tplCtx || {}, state.discount));
        message(ok ? 'Wstawiono do pola wiadomości — sprawdź i wyślij.' : 'Nie znalazłem pola wiadomości na tej stronie.', ok ? 'ok' : 'err');
        break;
      }
      case 'send-order': await sendOrder(); break;
      case 'open-app': window.open(await appUrl(), '_blank', 'noopener'); break;
      default: break;
    }
  });

  // Vinted zmienia strony bez przeładowania — śledzimy adres
  let lastUrl = '';
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      render();
    }
  }, 700);

  MM.get('mm_panel_expanded').then(({ mm_panel_expanded: on }) => expand(!!on));
  lastUrl = location.href;
  render();

  // Liczniki w panelu odświeżają się po synchronizacji z aplikacją
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.mm_snapshot && state.route && state.route.type === 'other') showOther();
  });
})();
