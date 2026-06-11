# Magazyn PWA

Aplikacja typu **Progressive Web Application (PWA)** wspomagająca zarządzanie lokalizacjami magazynowymi.

Projekt umożliwia szybkie sprawdzanie lokalizacji produktu, zmianę lokalizacji, rejestrowanie historii zmian oraz zarządzanie użytkownikami przy wykorzystaniu **Google Apps Script** oraz **Arkuszy Google** jako backendu.

---

# Wersja v2.0

W wersji **v2.0** dodano:

- obsługę kamery jako skanera kodów kreskowych,
- skanowanie kodów EAN/UPC/Code128/Code39 oraz QR,
- dodawanie nowych produktów do bazy z poziomu aplikacji,
- automatyczne generowanie kolejnego ID produktu na podstawie arkusza `Magazyn`,
- możliwość dodania produktu bez uzupełniania lokalizacji,
- skanowanie kodu lokalizacji kamerą przy zmianie lokalizacji,
- skanowanie lokalizacji kamerą podczas dodawania produktu.

---

# Funkcjonalności

## Zarządzanie użytkownikami

* wybór użytkownika z listy pobieranej z backendu,
* zapamiętywanie aktywnego użytkownika,
* rejestrowanie użytkownika wykonującego operacje magazynowe.

## Sprawdzanie lokalizacji

* wyszukiwanie produktu po kodzie,
* wyświetlanie aktualnej lokalizacji,
* szybki dostęp do historii zmian lokalizacji.

## Zmiana lokalizacji

* odczyt bieżącej lokalizacji produktu,
* przypisanie nowej lokalizacji,
* automatyczny zapis historii zmian.


## Skanowanie lokalizacji

Aplikacja umożliwia skanowanie kodów lokalizacji za pomocą aparatu. Dzięki temu lokalizację można wprowadzić bez ręcznego przepisywania oznaczenia z regału, półki lub etykiety magazynowej.

Skanowanie lokalizacji jest dostępne w dwóch miejscach:

- podczas zmiany lokalizacji istniejącego produktu,
- podczas dodawania nowego produktu do bazy.

## Historia zmian

Dla każdej zmiany zapisywane są informacje:

* data i godzina operacji,
* użytkownik wykonujący zmianę,
* poprzednia lokalizacja,
* nowa lokalizacja,
* identyfikator produktu.

## Konfiguracja urządzenia

* Device ID,
* Token 1,
* Token 2,
* lokalny zapis ustawień urządzenia.

## PWA (Progressive Web Application)

* możliwość instalacji na telefonie,
* możliwość instalacji na komputerze,
* działanie bez konieczności publikacji w sklepie Google Play,
* obsługa pliku Manifest oraz Service Worker.

## Skanowanie kamerą

* obsługa kamery telefonu lub komputera,
* skanowanie kodów kreskowych EAN, UPC, Code128, Code39 oraz QR,
* możliwość wykorzystania skanera kamery przy sprawdzaniu produktu, zmianie lokalizacji, skanowaniu nowej lokalizacji oraz dodawaniu produktu.

## Dodawanie produktów

* dodawanie produktu z poziomu aplikacji,
* pola: nazwa, symbol, kod kreskowy i lokalizacja,
* kod kreskowy produktu można zeskanować kamerą,
* lokalizację produktu można wpisać ręcznie albo zeskanować kamerą,
* lokalizacja jest opcjonalna,
* ID produktu generowane jest automatycznie po stronie Google Apps Script.

---

# Wykorzystane technologie

## Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* html5-qrcode — obsługa kamery i skanowania kodów

## Backend

* Google Apps Script

## Baza danych

* Google Sheets

## Hosting

* GitHub Pages

---

# Struktura projektu

```text
.
├── index.html
├── main.js
├── manifest.json
├── service-worker.js
├── JSONP_Code.gs
├── Magazyn.xlsx
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

# Struktura arkusza

Projekt wykorzystuje następujące zakładki:

## Magazyn

Przechowuje dane produktów oraz ich aktualne lokalizacje magazynowe.

Wymagana struktura kolumn:

| id | Nazwa | Symbol | KodKreskowy | Lokalizacja |
|----|-------|--------|-------------|-------------|
| 1001 | Przykładowy produkt | PROD-01 | 5900000000000 | A-01-01 |

Kolumna `id` jest uzupełniana automatycznie podczas dodawania produktu z poziomu aplikacji. Skrypt sprawdza największe istniejące ID i nadaje kolejny numer.

Kolumna `Lokalizacja` może pozostać pusta.

## HistoriaZmian

Przechowuje historię wszystkich zmian lokalizacji.

## Uzytkownicy

Lista użytkowników dostępnych w aplikacji.

## AktywniUzytkownicy

Lista aktualnie aktywnych użytkowników.

## Autoryzacje

Lista autoryzowanych urządzeń wraz z przypisanymi tokenami.

Każde urządzenie korzystające z aplikacji musi posiadać wpis w tej zakładce.

Dane zapisane w aplikacji muszą być zgodne z wartościami znajdującymi się w arkuszu.

---

# Instalacja

## 1. Przygotowanie arkusza Google

1. Prześlij plik `Magazyn.xlsx` na Dysk Google.
2. Otwórz przesłany plik.
3. Wybierz:

```text
Plik → Zapisz jako plik Arkuszy Google
```

4. Powstanie nowy arkusz w formacie Google Sheets.
5. Otwórz nowo utworzony arkusz.

---

## 2. Konfiguracja Google Apps Script

1. Otwórz utworzony wcześniej arkusz Google.
2. Wybierz:

```text
Rozszerzenia → Apps Script
```

3. Usuń domyślną zawartość projektu.
4. Wklej kod z pliku:

```text
JSONP_Code.gs
```

5. Zapisz projekt.

---

## 3. Publikacja aplikacji Apps Script

1. Wybierz:

```text
Wdrożenia → Nowe wdrożenie
```

2. Typ wdrożenia:

```text
Aplikacja internetowa
```

3. Ustaw:

```text
Uruchamiaj jako:
Ja

Kto ma dostęp:
Każdy
```

4. Zatwierdź wdrożenie.
5. Skopiuj wygenerowany adres URL aplikacji.

---

## 4. Konfiguracja pliku main.js

Po utworzeniu wdrożenia Google Apps Script należy skonfigurować aplikację frontendową.

Otwórz plik:

```text
main.js
```

### Konfiguracja adresu backendu

Znajdź zmienną przechowującą adres Google Apps Script i wklej adres wdrożenia zakończony na:

```text
/exec
```

Przykład:

```javascript
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxx/exec";
```

### Konfiguracja hasła ustawień

W pliku `main.js` znajduje się również hasło umożliwiające dostęp do panelu ustawień.

Przykład:

```javascript
const ADMIN_PASSWORD = "1234";
```

Hasło można zmienić według własnych potrzeb.

---

## 5. Nadanie uprawnień

Po utworzeniu wdrożenia należy jednorazowo uruchomić aplikację Apps Script.

1. Otwórz wygenerowany adres URL w przeglądarce.
2. Google poprosi o przyznanie wymaganych uprawnień.
3. Zaakceptuj wszystkie wymagane zgody.

Po wykonaniu tego kroku backend będzie gotowy do pracy.

---

## 6. Konfiguracja aplikacji

Przed pierwszym użyciem należy dodać urządzenie do arkusza autoryzacji.

Otwórz zakładkę:

```text
Autoryzacje
```

i dodaj nowy wpis zawierający:

* Device ID,
* Token 1,
* Token 2.

Przykład:

| Device ID | Token 1 | Token 2 |
| --------- | ------- | ------- |
| MAGAZYN01 | abc123  | xyz789  |

Wartości wpisane w arkuszu muszą być identyczne z wartościami podanymi później w ustawieniach aplikacji.

Następnie:

1. Uruchom aplikację.
2. Wejdź do sekcji:

```text
Ustawienia
```

3. Wprowadź:

* Device ID,
* Token 1,
* Token 2.

4. Zapisz konfigurację.

Po poprawnej konfiguracji urządzenie zostanie autoryzowane i uzyska dostęp do funkcji aplikacji.

---

# Wymagania dotyczące kamery

Skaner kamery korzysta z biblioteki `html5-qrcode`.

Kamera w przeglądarce działa poprawnie głównie w bezpiecznym kontekście, czyli przez:

* HTTPS,
* GitHub Pages,
* localhost.

Uruchomienie aplikacji bezpośrednio z pliku `index.html` przez `file://` może uniemożliwić dostęp do kamery.

---

# Uruchomienie

## Lokalnie

Otwórz plik `index.html` lub uruchom projekt przy pomocy lokalnego serwera HTTP.

## GitHub Pages

Aplikacja może zostać opublikowana poprzez GitHub Pages.

1. Wejdź do ustawień repozytorium.
2. Otwórz zakładkę:

```text
Settings → Pages
```

3. Wybierz:

```text
Deploy from a branch
```

4. Wskaż gałąź:

```text
main
```

5. Zapisz ustawienia.

Po kilku minutach aplikacja będzie dostępna pod adresem:

```text
https://twoj-login.github.io/nazwa-repozytorium/
```

---

# Dodawanie produktów do bazy

Aplikacja pozwala dodać nowy produkt bezpośrednio z poziomu interfejsu.

W formularzu należy uzupełnić:

* nazwę produktu,
* symbol,
* kod kreskowy,
* lokalizację — opcjonalnie.

Kod kreskowy można wpisać ręcznie, wkleić z komputera albo zeskanować kamerą.

Lokalizację można wpisać ręcznie albo zeskanować aparatem, jeśli lokalizacje magazynowe są oznaczone kodami kreskowymi lub QR.

Po zapisaniu Google Apps Script automatycznie:

1. sprawdza, czy symbol lub kod kreskowy nie istnieje już w bazie,
2. odczytuje największe ID z kolumny `id`,
3. nadaje nowemu produktowi kolejne ID,
4. dopisuje produkt jako nowy wiersz w zakładce `Magazyn`.

---

# Wersja demonstracyjna

Repozytorium zawiera przykładowy plik `Magazyn.xlsx`, który umożliwia szybkie uruchomienie projektu bez konieczności samodzielnego tworzenia struktury arkusza.

---

# Informacje dotyczące bezpieczeństwa

Hasło w sekcji ustawień służy wyłącznie do ochrony lokalnej konfiguracji urządzenia.

Nie zapewnia ono ochrony danych magazynowych ani nie pełni funkcji autoryzacji użytkowników systemu.

Błędna konfiguracja może jedynie uniemożliwić działanie aplikacji na danym urządzeniu.

---

# Autor

Pandinox

Projekt wykonany w ramach zajęć akademickich oraz rozwijany jako praktyczne narzędzie wspomagające pracę magazynową.
