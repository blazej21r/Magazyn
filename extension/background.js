/* MyMagazine dla Vinted — tło wtyczki: pobieranie zdjęć ogłoszeń i licznik „do wysłania” na ikonie. */

// Zdjęcia pobieramy wyłącznie z serwerów zdjęć Vinted
const PHOTO_HOST = /^https:\/\/([a-z0-9-]+\.)*vinted\.net\//i;
const MAX_PHOTOS = 20;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function toDataUrl(buffer, type) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return `data:${type || 'image/jpeg'};base64,${btoa(bin)}`;
}

async function fetchPhotos(urls) {
  const photos = [];
  for (const url of (Array.isArray(urls) ? urls : []).slice(0, MAX_PHOTOS)) {
    if (typeof url !== 'string' || !PHOTO_HOST.test(url)) continue;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) continue;
      const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
      if (!type.startsWith('image/')) continue;
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_PHOTO_BYTES) continue;
      photos.push(toDataUrl(buf, type));
    } catch {
      // pomijamy zdjęcie, którego nie udało się pobrać
    }
  }
  return photos;
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'fetchPhotos') {
    fetchPhotos(msg.urls).then((photos) => reply({ photos }));
    return true; // odpowiedź asynchroniczna
  }
  return false;
});

function updateBadge(snapshot) {
  const n = (snapshot && snapshot.counts && snapshot.counts.toship) || 0;
  chrome.action.setBadgeText({ text: n ? String(n) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#c2410c' });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.mm_snapshot) updateBadge(changes.mm_snapshot.newValue);
});

async function init() {
  const { mm_snapshot: snapshot } = await chrome.storage.local.get('mm_snapshot');
  updateBadge(snapshot);
}
chrome.runtime.onStartup.addListener(init);
chrome.runtime.onInstalled.addListener(init);
