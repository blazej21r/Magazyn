/* MyMagazine dla Vinted — okienko wtyczki: podsumowanie z aplikacji. */
(async () => {
  const { esc } = MM;
  const { mm_snapshot: snap, mm_inbox: inbox = [] } = await MM.get(['mm_snapshot', 'mm_inbox']);
  const appUrl = (snap && snap.appUrl) || MM.APP_URL;
  const main = document.getElementById('main');

  document.getElementById('sync').textContent = snap ? `zsynchronizowano ${MM.timeAgo(snap.updatedAt)}` : 'jeszcze nie połączono z aplikacją';
  document.getElementById('openApp').addEventListener('click', () => chrome.tabs.create({ url: appUrl }));
  document.getElementById('openVinted').addEventListener('click', () => chrome.tabs.create({ url: 'https://www.vinted.pl/' }));

  const pending = inbox.length
    ? `<div class="box">${inbox.length} poz. z Vinted czeka na przeniesienie — otwórz MyMagazine, a trafią do aplikacji.</div>`
    : '';

  if (!snap) {
    main.innerHTML = `${pending}<p>Otwórz MyMagazine w tej przeglądarce — wtyczka połączy się z aplikacją sama.</p>`;
    return;
  }

  const c = snap.counts;
  main.innerHTML = `
    ${pending}
    <div class="tiles">
      <div class="tile ${c.toship ? 'alert' : ''}"><span class="muted">Do wysłania</span><b>${c.toship}</b></div>
      <div class="tile"><span class="muted">Wystawione</span><b>${c.listed}</b></div>
      <div class="tile"><span class="muted">Na stanie</span><b>${c.stock}</b></div>
      <div class="tile"><span class="muted">Do odświeżenia</span><b>${c.refresh}</b></div>
    </div>
    ${snap.toship.length ? `
      <p class="h">Do wysłania</p>
      <ul>${snap.toship.slice(0, 6).map((o) => `
        <li class="${o.late ? 'late' : ''}">
          <b>${esc(o.name)}${o.qty > 1 ? ` · ${o.qty} szt.` : ''}</b>
          <span>${[o.location, o.buyer, o.shipBy ? `wyślij do ${o.shipBy.split('-').reverse().join('.')}` : ''].filter(Boolean).map(esc).join(' · ')}</span>
        </li>`).join('')}
      </ul>` : '<p class="muted">Nic nie czeka na wysłanie.</p>'}`;
})();
