# Magazyn Salonu - Instrukcja Użytkowania

## 🎯 Jak używać skanera kodów kreskowych

### Na telefonie (Chrome/Safari)

#### Pierwsze uruchomienie:
1. Kliknij przycisk **"Skanuj Aparatem"**
2. Przeglądarka zapyta o dostęp do kamery - kliknij **"Zezwól"** / **"Allow"**
3. Skieruj kamerę telefonu na kod kreskowy
4. Aplikacja automatycznie wykryje i zeskanuje kod

### Jeśli kamera się nie włącza:

#### Chrome (Android):
1. Kliknij ikonę kłódki/informacji obok adresu URL
2. Wybierz **"Uprawnienia"** lub **"Permissions"**
3. Znajdź **"Kamera"** i ustaw na **"Zezwól"**
4. Odśwież stronę i spróbuj ponownie

#### Safari (iPhone/iPad):
1. Otwórz **Ustawienia** telefonu
2. Przewiń do **Safari**
3. Wybierz **"Kamera"**
4. Upewnij się, że jest ustawione na **"Zapytaj"** lub **"Zezwól"**
5. Wróć do aplikacji i odśwież stronę

#### Firefox (Android/iOS):
1. Kliknij ikonę kłódki obok adresu
2. Wybierz **"Uprawnienia"**
3. Włącz dostęp do kamery
4. Odśwież stronę

### Rozwiązywanie problemów:

**Problem:** Kamera nie włącza się wcale
- Sprawdź czy inna aplikacja nie używa kamery
- Zamknij wszystkie inne karty przeglądarki
- Zrestartuj przeglądarkę

**Problem:** "Nie znaleziono kamery"
- Upewnij się, że Twoje urządzenie ma kamerę
- Sprawdź czy kamera działa w innych aplikacjach

**Problem:** Czarny ekran po włączeniu kamery
- Poczekaj kilka sekund - kamera może się inicjalizować
- Upewnij się, że obiektyw nie jest zasłonięty

## 📱 Alternatywne metody skanowania

### 1. Ręczne wpisanie kodu
- Wpisz kod kreskowy w pole tekstowe
- Naciśnij **Enter** aby dodać produkt

### 2. Import z CSV
- Przygotuj plik CSV z produktami
- Kliknij **"Importuj CSV"**
- Wybierz plik z dysku

### 3. Skaner Bluetooth
- Połącz skaner Bluetooth z telefonem/komputerem
- Otwórz pole "wpisz ręcznie"
- Zeskanuj kod - pojawi się automatycznie w polu

## ✅ Wskazówki dla najlepszych rezultatów

1. **Dobre oświetlenie** - skanuj kody w dobrze oświetlonym miejscu
2. **Stabilna ręka** - trzymaj telefon stabilnie nad kodem
3. **Odpowiednia odległość** - 10-20 cm od kodu
4. **Czysta kamera** - wytrzyj obiektyw jeśli jest brudny
5. **Wyraźne kody** - upewnij się, że kod nie jest uszkodzony

## 🔒 Bezpieczeństwo i prywatność

- Aplikacja NIE wysyła zdjęć z kamery do internetu
- Wszystkie dane pozostają na Twoim urządzeniu
- Dostęp do kamery jest używany TYLKO do skanowania kodów
- Możesz wyłączyć dostęp do kamery w każdej chwili

## 🌐 Tryb Offline i Synchronizacja

### Jak działa tryb offline?

Aplikacja automatycznie wykrywa brak połączenia z internetem i przechodzi w **tryb offline**. Możesz kontynuować pracę normalnie - wszystkie Twoje zmiany zostaną zapisane lokalnie i automatycznie zsynchronizowane po powrocie połączenia.

### Co możesz robić offline?

W trybie offline masz dostęp do wszystkich funkcji:
- ✅ Dodawanie nowych produktów (skanowanie lub ręcznie)
- ✅ Edycja istniejących produktów
- ✅ Zmiana statusu produktów
- ✅ Usuwanie produktów
- ✅ Wyszukiwanie i filtrowanie
- ✅ Export do CSV

### Wskaźniki statusu połączenia

**W nagłówku aplikacji:**
- 🟢 **Online** - zielona ikona WiFi = masz połączenie
- 🟠 **Offline** - pomarańczowa przekreślona ikona WiFi = brak połączenia

**Banner statusu (pokazuje się gdy jest offline lub są niesynchronizowane zmiany):**
- Informuje o statusie połączenia
- Pokazuje liczbę oczekujących zmian
- Wyświetla czas ostatniej synchronizacji
- Pozwala na manualną synchronizację

### Automatyczna synchronizacja

Gdy odzyskasz połączenie z internetem:
1. Zobaczysz powiadomienie: **"Połączenie przywrócone"**
2. Aplikacja automatycznie rozpocznie synchronizację (1 sekunda delay)
3. Wszystkie zmiany zostaną wysłane w kolejności ich wykonania
4. Po zakończeniu zobaczysz potwierdzenie

### Ręczna synchronizacja

Możesz ręcznie wymусić synchronizację na 2 sposoby:

**1. Z banneru statusu:**
- Kliknij przycisk **"Synchronizuj"** w bannerze (pojawia się gdy są oczekujące zmiany)

**2. Z ustawień synchronizacji:**
- Kliknij przycisk **"Synchronizacja"** w sekcji Szybkie Akcje
- Zobaczysz szczegółowy status synchronizacji
- Kliknij **"Synchronizuj Teraz"** aby wymusić synchronizację

### Dialog Ustawień Synchronizacji

Aby otworzyć szczegółowe ustawienia:
1. Znajdź przycisk **"Synchronizacja"** w panelu Szybkie Akcje
2. Kliknij aby otworzyć dialog
3. Zobaczysz:
   - Status połączenia (Online/Offline)
   - Liczbę oczekujących zmian
   - Czas ostatniej synchronizacji
   - Przyciski do manualnej synchronizacji lub czyszczenia kolejki

### Rozwiązywanie problemów z synchronizacją

**Problem:** Zmiany nie synchronizują się automatycznie
- Sprawdź czy masz połączenie z internetem (ikona w nagłówku)
- Spróbuj ręcznej synchronizacji z banneru lub ustawień
- Odśwież stronę i spróbuj ponownie

**Problem:** Błąd synchronizacji
- Banner pokaże komunikat o błędzie
- Sprawdź połączenie internetowe
- Spróbuj ponownie za chwilę
- Jeśli problem się powtarza, możesz wyczyścić kolejkę (opcja nuklearna - straci niesynchronizowane zmiany)

**Problem:** Zbyt wiele oczekujących zmian
- Aplikacja automatycznie optymalizuje kolejkę (łączy podobne operacje)
- Jeśli masz bardzo dużo zmian, synchronizacja może potrwać kilka sekund
- Poczekaj aż synchronizacja się zakończy

### Powiadomienia

Aplikacja pokazuje automatyczne powiadomienia:
- 🟢 **"Połączenie przywrócone"** - gdy wracasz online
- 🟠 **"Brak połączenia"** - gdy tracisz połączenie
- ✅ **"Synchronizacja zakończona"** - po udanej synchronizacji
- ❌ **"Błąd synchronizacji"** - gdy coś poszło nie tak

### Bezpieczeństwo danych w trybie offline

- Wszystkie zmiany są zapisywane lokalnie na Twoim urządzeniu
- Kolejka synchronizacji jest przechowywana bezpiecznie
- Dane nie są tracone nawet jeśli zamkniesz aplikację
- Po otwarciu aplikacji, kolejka synchronizacji zostanie przywrócona
- Gdy odzyskasz połączenie, zmiany zostaną automatycznie zsynchronizowane
