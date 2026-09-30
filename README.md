# MyMagazine

Prosta aplikacja do prowadzenia ewidencji magazynu: co masz na stanie, co jest wystawione na sprzedaż, co trzeba wysłać, co jest w drodze i co zostało sprzedane.
Działa w przeglądarce na komputerze i na telefonie, a do tego można ją zainstalować jak zwykłą aplikację (PWA). Działa też bez internetu.

## Zakładki

| Zakładka | Co zawiera |
|---|---|
| **Magazyn** | Wszystko, co masz na stanie (także wystawione), z datą dodania, ilością, miejscem w magazynie i kategorią. Zamówione przedmioty **przechodzą do „Do wysłania”** i nie są już tu pokazywane. |
| **Wystawione** | Przedmioty wystawione na sprzedaż: data wystawienia, cena, miejsce wystawienia (OLX, Vinted, Allegro…) i opcjonalny **spis partii**. |
| **Do wysłania** | Przedmioty, które ktoś zamówił, pokazywane jako „nazwa przedmiotu - nazwa produktu” (np. *buty C folia - Nike Air Force 42*). Możesz dodać kupującego i termin wysyłki; zamówienia po terminie są wyróżnione na czerwono. |
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
- **Ilości i partie**: jeśli masz np. paletę 370 par butów, możesz wystawiać ją kartonami. W oknie „Wystaw” podajesz ilość i **miejsce w magazynie** (np. *karton 1*), a reszta zostaje na stanie. Gdy ktoś zamówi 1 szt., aplikacja sama rozdzieli pozycję. Po anulowaniu zamówienia sztuki wracają na miejsce.
- **Spis partii**: w edycji wystawionego przedmiotu (lub przez menu ⋮ → „Spis partii”) wpisujesz konkretne przedmioty z partii i ich ceny. Enter przechodzi do następnego pola, więc spis wpisuje się szybko.
- **Nazwa produktu przy zamówieniu**: w oknie „Zamówione” wpisujesz nazwę konkretnego produktu albo **wybierasz go ze spisu**. Wtedy nazwa i cena uzupełniają się same, a pozycja znika ze spisu (i wraca do niego, jeśli anulujesz zamówienie).
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
