# Geocoding API для Armtemiy Lab

## Текущая реализация

В проекте используется **Nominatim (OpenStreetMap)** — полностью бесплатный геокодинг без регистрации.

### Особенности Nominatim

- **Бесплатно**: Без ограничений по запросам (но есть rate limit)
- **Rate limit**: ~1 запрос в секунду
- **Без API-ключа**: Не требует регистрации
- **User-Agent**: Обязателен (уже настроен: `ArmtemiyLab/1.0`)

### Функции в `src/lib/sparring.ts`

```typescript
// Поиск адреса → координаты
geocodeAddress(query: string): Promise<GeocodingResult | null>

// Координаты → адрес (reverse)
reverseGeocode(lat: number, lon: number): Promise<string | null>

// Геолокация браузера
requestGeolocation(): Promise<GeolocationPosition>
```

---

## Альтернативы (если понадобится)

### 1. Mapbox Geocoding API

**Бесплатно**: 100,000 запросов/месяц

**Как подключить:**

1. Зарегистрироваться на https://www.mapbox.com/
2. Создать Access Token: Account → Tokens → Create a token
3. Добавить в `.env`:
   ```
   VITE_MAPBOX_TOKEN=pk.xxxxxxxxxxxxx
   ```
4. Использовать API:
   ```typescript
   const response = await fetch(
     `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
   )
   ```

### 2. Google Maps Geocoding API

**Платно**: $5 за 1000 запросов (первые $200/месяц бесплатно)

**Как подключить:**

1. Google Cloud Console → APIs & Services → Enable "Geocoding API"
2. Создать API Key: Credentials → Create Credentials → API Key
3. Добавить в `.env`:
   ```
   VITE_GOOGLE_MAPS_KEY=AIzaxxxxxxxxxxxxx
   ```

### 3. Yandex Geocoder API

**Бесплатно**: 1000 запросов/день

**Как подключить:**

1. Зарегистрироваться на https://developer.tech.yandex.ru/
2. Создать приложение → Получить API-ключ
3. Добавить в `.env`:
   ```
   VITE_YANDEX_GEOCODER_KEY=xxxxxxxxxxxxx
   ```

---

## Рекомендация

**Для MVP используем Nominatim** — бесплатно, без регистрации, достаточно для текущих объёмов.

Если будет много пользователей (>10,000 запросов/день), переключиться на Mapbox.

---

## Карта (Tile Layer)

Карта использует **CartoDB Dark Matter** — бесплатный тёмный стиль:

```typescript
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  maxZoom: 19
})
```

Альтернативы:
- **OpenStreetMap**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Mapbox Dark**: Требует токен
- **Stadia Dark**: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png`
