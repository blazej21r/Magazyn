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
- **Ewidencja sprzedaży do Excela**: w zakładce Sprzedane wybierasz miesiąc (filtr „Wybierz miesiąc…”), a przycisk **„Pobierz do Excela”** zapisuje plik `.xlsx` za wybrany miesiąc, rok albo cały okres, opcjonalnie dla jednej kategorii. W pliku: data sprzedaży, przedmiot, ilość, cena, przychód, koszt, zysk, kupujący i dane wysyłki, a na końcu wiersz sum.
- **Kopia zapasowa** (plik JSON: pobierz i wczytaj) oraz eksport całego magazynu do CSV (Ustawienia).
- **Odświeżanie ogłoszeń**: ogłoszenia wystawione dłużej niż ustawiona liczba dni (domyślnie 14) dostają znacznik „do odświeżenia” i mają własny filtr w Wystawionych. Po wystawieniu ponownie wybierz ⋮ → „Oznacz jako odświeżone”.
- **Szablony wiadomości**: gotowe teksty (podziękowanie, paczka wysłana, oferta dla obserwujących…) z wstawkami `{nazwa}`, `{cena}`, `{cena_rabat}`, `{kupujacy}`, `{przewoznik}`, `{numer}`. Z menu ⋮ → „Wiadomość z szablonu” kopiujesz gotowy tekst. Szablony i rabat edytujesz w Ustawieniach.
- **Link i statystyki ogłoszenia**: przedmiot może mieć link do ogłoszenia oraz liczbę wyświetleń i polubień (uzupełnia je wtyczka).

## Wtyczka „MyMagazine dla Vinted”

Wtyczka do Edge i Chrome (folder `extension/`, gotowa paczka: `mymagazine-vinted.zip`) łączy Vinted z aplikacją. Na stronach Vinted pokazuje panel **MyMagazine** w prawym dolnym rogu:

| Gdzie | Co robi |
|---|---|
| **Strona ogłoszenia** | Czyta tytuł, cenę, zdjęcia, markę, rozmiar, wyświetlenia i polubienia. „Dodaj do MyMagazine” wysyła ogłoszenie do aplikacji: jako nowy przedmiot, **pozycję spisu partii** albo połączenie z istniejącym. Jeśli ogłoszenie już jest w MyMagazine, panel to pokazuje, a statystyki aktualizują się same. |
| **Odśwież ogłoszenie** | Zapisuje szkic ogłoszenia razem ze zdjęciami. W formularzu „Sprzedaj” przycisk „Wypełnij formularz” uzupełnia tytuł, opis, cenę i zdjęcia (kategorię, markę, rozmiar i stan wybierasz sam). Gdy nowe ogłoszenie się pojawi, MyMagazine podmieni link i zapisze nową datę wystawienia. |
| **Rozmowa (czat)** | Szablony wiadomości wstawiane jednym kliknięciem, z nazwą, ceną, kupującym i numerem przesyłki z MyMagazine. „Dodaj zamówienie do MyMagazine” przenosi sprzedaż do „Do wysłania”: aplikacja dopasuje przedmiot (także pozycję ze spisu partii) i uzupełni nazwę, cenę i kupującego. |
| **Ikona wtyczki** | Licznik paczek do wysłania i podsumowanie: do wysłania, wystawione, na stanie, do odświeżenia. |

Wtyczka **niczego nie wysyła na Vinted sama**: każdą wiadomość i każde ogłoszenie zatwierdzasz ręcznie. To celowe. Regulamin Vinted nie dopuszcza automatów (np. samoczynnego odświeżania ogłoszeń czy masowych wiadomości), a takie działanie grozi blokadą konta.

**Instalacja:**
1. W MyMagazine otwórz *Ustawienia → Wtyczka Vinted → Pobierz wtyczkę* i rozpakuj plik.
2. Otwórz `edge://extensions` (Edge) lub `chrome://extensions` (Chrome) i włącz **Tryb dewelopera**.
3. Kliknij **Załaduj rozpakowane** i wskaż folder `mymagazine-vinted`.
4. Odśwież stronę MyMagazine. W Ustawieniach pojawi się „Połączona”.

Wtyczka przekazuje dane do aplikacji, gdy MyMagazine jest otwarty w tej samej przeglądarce. Do tego czasu czekają one w kolejce. Działa z adresem `https://blazej21r.github.io/Magazyn/`. Po zmianie adresu popraw `matches` w `extension/manifest.json`. Po zmianach w folderze `extension/` zbuduj paczkę od nowa: `python3 scripts/build-extension.py`.
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
extension/             – wtyczka „MyMagazine dla Vinted” (Edge/Chrome)
mymagazine-vinted.zip  – gotowa paczka wtyczki do pobrania
scripts/               – skrypt budujący paczkę wtyczki
```
