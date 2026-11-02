/* MyMagazine dla Vinted — most między wtyczką a otwartą aplikacją MyMagazine.
   Przekazuje do aplikacji ogłoszenia/zamówienia z Vinted i odbiera skrót danych (liczniki, szablony). */
(() => {
  const VERSION = chrome.runtime.getManifest().version;
  const target = /^https?:/.test(location.protocol) ? location.origin : '*';
  const post = (msg) => window.postMessage({ source: 'mymagazine-ext', ...msg }, target);

  async function sendInbox() {
    const { mm_inbox: inbox = [] } = await chrome.storage.local.get('mm_inbox');
    if (inbox.length) post({ type: 'imports', imports: inbox });
  }

  window.addEventListener('message', async (e) => {
    if (e.source !== window || !e.data || e.data.source !== 'mymagazine-app') return;
    const msg = e.data;
    if (msg.type === 'ping') {
      post({ type: 'hello', version: VERSION });
      sendInbox();
    } else if (msg.type === 'snapshot' && msg.snapshot && typeof msg.snapshot === 'object') {
      chrome.storage.local.set({ mm_snapshot: msg.snapshot });
    } else if (msg.type === 'ack' && Array.isArray(msg.ids)) {
      // Aplikacja zapisała importy u siebie — usuwamy je z kolejki wtyczki
      const done = new Set(msg.ids);
      const { mm_inbox: inbox = [] } = await chrome.storage.local.get('mm_inbox');
      await chrome.storage.local.set({ mm_inbox: inbox.filter((x) => !done.has(x.id)) });
    }
  });

  // Nowe pozycje z Vinted trafiają do aplikacji od razu, jeśli jest otwarta
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.mm_inbox && (changes.mm_inbox.newValue || []).length > (changes.mm_inbox.oldValue || []).length) {
      sendInbox();
    }
  });

  post({ type: 'hello', version: VERSION });
  sendInbox();
})();
