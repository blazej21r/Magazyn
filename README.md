# MyMagazine

Prosta aplikacja do prowadzenia ewidencji magazynu: co masz na stanie, co jest wystawione na sprzedaż, co trzeba wysłać, co jest w drodze i co zostało sprzedane.
Działa w przeglądarce na komputerze i na telefonie, a do tego można ją zainstalować jak zwykłą aplikację (PWA). Działa też bez internetu.

## Zakładki

| Zakładka | Co zawiera |
|---|---|
| **Magazyn** | Wszystko, co posiadasz, z datą dodania, ilością, miejscem w magazynie i kategorią. Przedmiot **znika stąd automatycznie**, gdy oznaczysz go jako sprzedany. |
| **Wystawione** | Przedmioty wystawione na sprzedaż: data wystawienia, cena i miejsce wystawienia (OLX, Vinted, Allegro…). |
| **Do wysłania** | Przedmioty, które ktoś zamówił. Możesz dodać kupującego i termin wysyłki; zamówienia po terminie są wyróżnione na czerwono. |
| **Wysłane** | Paczki w drodze (data wysyłki, przewoźnik, numer przesyłki). |
| **Sprzedane** | Zakończone sprzedaże bez zwrotu, z przychodem i zyskiem (gdy podasz cenę zakupu). |

Przepływ przedmiotu:

```
Magazyn ──Wystaw──▶ Wystawione ──Zamówione──▶ Do wysłania ──Wysłane──▶ Wysłane ──Sprzedane──▶ Sprzedane
                                                                          ▲                       │
                                                                          └──── Zwrot do magazynu ┘
```

Każdy przycisk przenosi przedmiot do następnej zakładki. W menu **⋮** są dodatkowe akcje: sprzedaż bezpośrednio z magazynu, anulowanie zamówienia, zdjęcie z wystawienia, zwrot do magazynu, duplikowanie i usuwanie.

## Funkcje

- **Kategorie według uznania**: dodajesz, zmieniasz nazwę i kolor, usuwasz. Są wspólne dla wszystkich zakładek, a filtrujesz je jednym kliknięciem.
- **Ilości**: jeśli masz np. 5 takich samych koszulek i ktoś zamówi 1, aplikacja sama rozdzieli pozycję (1 szt. idzie do wysłania, 4 zostają wystawione). Po anulowaniu zamówienia sztuki wracają na miejsce.
- **Wyszukiwarka** (działa też bez polskich znaków), sortowanie oraz filtry statusu i okresu (np. „Ten miesiąc” w Sprzedanych).
- **Statystyki** w każdej zakładce: liczba sztuk, wartość ofert, zamówienia po terminie, przychód i zysk.
- **Zaznaczanie wielu**: np. wszystkie paczki z „Do wysłania” oznaczysz jako wysłane jednym ruchem.
- **„Cofnij”** po każdej zmianie, na wypadek pomyłki.
- **Kopia zapasowa** (plik JSON: pobierz i wczytaj) oraz **eksport do Excela** (CSV).
- Jasny i ciemny motyw, obsługa klawiatury (`N` to nowy przedmiot, `/` to wyszukiwanie).

## Uruchomienie

Aplikacja to zwykłe pliki statyczne (HTML, CSS i JavaScript), bez instalowania czegokolwiek.

**Lokalnie:** otwórz `index.html` w przeglądarce. Jeśli chcesz, żeby działał tryb offline i instalacja, uruchom prosty serwer:

```bash
python3 -m http.server 8000
# potem otwórz http://localhost:8000
```

**Na telefonie i komputerze przez internet (GitHub Pages):**

1. W repozytorium wejdź w **Settings → Pages**.
2. W polu *Source* wybierz **Deploy from a branch**, gałąź `main` i folder `/ (root)`, a potem zapisz.
3. Po chwili aplikacja będzie dostępna pod adresem `https://<twoja-nazwa>.github.io/Magazyn/`.

**Instalacja na telefonie:**
- Android (Chrome): menu ⋮, potem „Zainstaluj aplikację” / „Dodaj do ekranu głównego”.
- iPhone (Safari): przycisk „Udostępnij”, potem „Do ekranu początkowego”.

## Gdzie są moje dane?

Dane są zapisywane **lokalnie w przeglądarce** na danym urządzeniu (localStorage) i nie trafiają na żaden serwer.
Oznacza to, że:

- komputer i telefon mają **osobne dane**. Żeby przenieść dane, pobierz kopię na jednym urządzeniu (*Ustawienia → Pobierz kopię*) i wczytaj ją na drugim (*Wczytaj kopię*);
- wyczyszczenie danych przeglądarki usuwa też dane aplikacji, dlatego **rób regularnie kopię zapasową**.

## Struktura plików

```
index.html             – szkielet strony
styles.css             – wygląd (komputer + telefon, jasny/ciemny motyw)
app.js                 – cała logika aplikacji
sw.js                  – service worker (działanie offline)
manifest.webmanifest   – dane do instalacji jako aplikacja
icons/                 – ikony aplikacji
```
