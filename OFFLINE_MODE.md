# Tryb Offline - Dokumentacja Techniczna

## Przegląd

Aplikacja Magazyn Salonu obsługuje pełny tryb offline z automatyczną synchronizacją danych. Użytkownicy mogą kontynuować pracę bez połączenia z internetem, a wszystkie zmiany zostaną automatycznie zsynchronizowane po przywróceniu połączenia.

## Architektura

### Komponenty

1. **useOnlineStatus Hook** (`src/hooks/use-online-status.ts`)
   - Monitoruje status połączenia internetowego
   - Reaguje na zdarzenia `online` i `offline`
   - Zwraca boolean wskazujący stan połączenia

2. **useOfflineSync Hook** (`src/hooks/use-offline-sync.ts`)
   - Główny hook zarządzający synchronizacją
   - Przechowuje kolejkę operacji w `spark.kv`
   - Automatycznie przetwarza kolejkę po przywróceniu połączenia
   - Oferuje funkcje do dodawania operacji CRUD

3. **Sync Library** (`src/lib/sync.ts`)
   - Definiuje typy operacji synchronizacji
   - Implementuje logikę łączenia operacji (merge)
   - Optymalizuje kolejkę poprzez eliminację redundantnych operacji

### Przepływ Danych

```
Użytkownik wykonuje akcję (create/update/delete)
    ↓
Aktualizacja lokalnego stanu (useKV - 'salon-products')
    ↓
Dodanie operacji do kolejki synchronizacji (useKV - 'sync-queue')
    ↓
Jeśli online → Automatyczna synchronizacja (1s delay)
    ↓
Wyczyszczenie kolejki po udanej synchronizacji
```

### Przechowywanie Danych

Wszystkie dane są przechowywane w `spark.kv` (Key-Value Store):

- **salon-products**: Główna lista produktów
- **sync-queue**: Kolejka operacji oczekujących na synchronizację

```typescript
interface SyncQueue {
  operations: SyncOperation[]
  lastSync: string | null
}

interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  timestamp: string
  product?: Product
  productId?: string
}
```

## Strategie Synchronizacji

### Łączenie Operacji

System automatycznie optymalizuje kolejkę operacji:

- **Create → Update**: Zachowuje tylko create z najnowszymi danymi
- **Create → Delete**: Usuwa obie operacje (produkt nigdy nie trafił do serwera)
- **Update → Update**: Zachowuje tylko ostatni update
- **Update → Delete**: Zachowuje tylko delete
- **Delete po innych**: Delete zawsze wygrywa

### Strategia Konfliktów

Aplikacja używa strategii "Last Write Wins" (ostatni zapis wygrywa):
- Operacje są sortowane według timestamp
- Najnowsza operacja dla danego produktu ma pierwszeństwo
- Brak złożonej detekcji konfliktów (odpowiednie dla single-user app)

## Komponenty UI

### OfflineStatusBanner
Wyświetla się gdy:
- Brak połączenia z internetem
- Są oczekujące zmiany do synchronizacji
- Wystąpił błąd synchronizacji

Pokazuje:
- Status połączenia (online/offline)
- Liczbę oczekujących zmian
- Ostatni czas synchronizacji
- Przycisk manualnej synchronizacji

### ConnectionIndicator
Mały wskaźnik w nagłówku pokazujący:
- Zielona ikona WiFi gdy online
- Pomarańczowa ikona WiFi przekreślona gdy offline

### SyncSettingsDialog
Dialog ustawień synchronizacji oferujący:
- Podgląd statusu synchronizacji
- Licznik oczekujących operacji
- Czas ostatniej synchronizacji
- Przycisk manualnej synchronizacji
- Przycisk czyszczenia kolejki (emergency)

## Powiadomienia (Toasts)

Aplikacja pokazuje automatyczne powiadomienia:
- ✅ "Połączenie przywrócone" - gdy wracamy online
- ⚠️ "Brak połączenia" - gdy tracimy połączenie
- ✅ "Synchronizacja zakończona" - po udanej synchronizacji
- ❌ "Błąd synchronizacji" - gdy synchronizacja się nie powiodła

## Funkcje dla Użytkownika

1. **Automatyczna Synchronizacja**
   - Działa w tle po wykryciu połączenia
   - 1 sekunda delay przed rozpoczęciem
   - Brak interakcji wymaganej od użytkownika

2. **Manualna Synchronizacja**
   - Dostępna w bannerze statusu (gdy są pending changes)
   - Dostępna w dialogu ustawień
   - Pokazuje feedback wizualny podczas procesu

3. **Czyszczenie Kolejki**
   - Dostępne tylko w dialogu ustawień
   - Wymaga potwierdzenia
   - Używane w przypadku problemów z synchronizacją

## Testowanie Trybu Offline

### W Przeglądarce

1. **Chrome DevTools**:
   - Otwórz DevTools (F12)
   - Przejdź do zakładki Network
   - Zmień throttling na "Offline"

2. **Firefox DevTools**:
   - Otwórz DevTools (F12)
   - Przejdź do zakładki Network
   - Zaznacz checkbox "Offline"

### Scenariusze Testowe

1. **Dodawanie produktu offline**:
   - Przełącz na offline
   - Dodaj nowy produkt
   - Sprawdź banner statusu (powinien pokazać 1 zmianę)
   - Przełącz na online
   - Sprawdź czy produkt został zsynchronizowany

2. **Wiele operacji offline**:
   - Przełącz na offline
   - Dodaj 3 produkty
   - Edytuj 2 produkty
   - Usuń 1 produkt
   - Sprawdź licznik zmian
   - Przełącz na online
   - Sprawdź czy wszystkie zmiany zostały zsynchronizowane

3. **Optymalizacja kolejki**:
   - Przełącz na offline
   - Dodaj produkt
   - Edytuj ten sam produkt 3 razy
   - Sprawdź dialog ustawień (powinien pokazać tylko 1 operację create)

## Ograniczenia

1. **Brak prawdziwego backendu**: 
   - Synchronizacja symuluje wysyłanie do serwera (500ms delay)
   - W produkcji należy dodać prawdziwe API calls

2. **Single User**: 
   - Brak obsługi konfliktów między wieloma użytkownikami
   - Last-write-wins może spowodować utratę danych w multi-user scenario

3. **Limit kolejki**: 
   - Brak limitu rozmiaru kolejki
   - W produkcji należy rozważyć limit i pagination

## Przyszłe Usprawnienia

1. **Conflict Resolution**:
   - Detekcja konfliktów między urządzeniami
   - UI do ręcznego rozwiązywania konfliktów

2. **Background Sync API**:
   - Wykorzystanie Service Workers
   - Synchronizacja w tle nawet gdy app jest zamknięty

3. **Batch Sync**:
   - Grupowanie operacji w batche
   - Redukcja liczby API calls

4. **Delta Sync**:
   - Wysyłanie tylko zmienionych pól
   - Redukcja rozmiaru payloadu

5. **Sync Status per Product**:
   - Wizualne oznaczenie produktów oczekujących na sync
   - Badge lub ikona przy każdym produkcie
