# Цветовая палитра armtemiy.ru

## Эстетика и концепция

**Aesthetic:** The Underground Forge • Dark • High-contrast • Aggressive

**Философия цветов:** Красный + Чёрный = Сила, Доминирование, Победа

---

## Primary — Crimson Red

### Описание
Основной акцентный цвет. Символизирует мощь, триумф, борьбу. Ассоциируется с красным цветом армрестлинга — кровью, энергией, победой.

### Цветовая шкала (10 оттенков)

| Токен | HSL | Пример | Использование |
|--------|------|--------|--------------|
| `--color-primary-50` | hsl(5 100% 97%) | `#FDF7F6` | Фоновые подсветки |
| `--color-primary-100` | hsl(5 95% 90%) | `#F2EBEB` | Очень светлые фоны |
| `--color-primary-200` | hsl(5 90% 80%) | `#E6CCCB` | Светлые фоны |
| `--color-primary-300` | hsl(5 88% 68%) | `#D5A89B` | Текст на тёмном фоне |
| `--color-primary-400` | hsl(5 85% 58%) | `#BF8275` | Hover состояния |
| `--color-primary-500` | hsl(5 85% 60%) | `#E63946` | **Основной акцент (кнопки, CTA)** |
| `--color-primary-600` | hsl(5 80% 52%) | `#C62D3D` | Активные кнопки |
| `--color-primary-700` | hsl(5 78% 42%) | `#8B1D2B` | Hover на активном |
| `--color-primary-800` | hsl(5 75% 32%) | `#62131F` | Текст на светлом |
| `--color-primary-900` | hsl(5 70% 22%) | `#410E12` | Самый тёмный оттенок |

### Применение

- **Кнопки:** `--color-primary-500` для primary buttons, `--color-primary-600` для active
- **CTA элементы:** Выделение призывов к действию
- **Акценты:** Ключевые фразы, важные метки
- **Градиенты:** `primary-500` → `primary-700` для глубины

---

## Secondary — Orange-Red

### Описание
Вторичный акцентный цвет. Символизирует энергию, огонь, интенсивность. Более тёплый, чем primary, но агрессивный.

### Цветовая шкала (10 оттенков)

| Токен | HSL | Пример | Использование |
|--------|------|--------|--------------|
| `--color-secondary-50` | hsl(15 100% 96%) | `#FFF6F2` | Фоновые подсветки |
| `--color-secondary-100` | hsl(15 95% 88%) | `#FFE3D7` | Очень светлые фоны |
| `--color-secondary-200` | hsl(15 92% 78%) | `#FFC7AF` | Светлые фоны |
| `--color-secondary-300` | hsl(15 90% 65%) | `#E89F42` | Текст на тёмном фоне |
| `--color-secondary-400` | hsl(15 88% 55%) | `#CC8038` | Hover состояния |
| `--color-secondary-500` | hsl(15 90% 50%) | `#FF4500` | **Вторичный акцент** |
| `--color-secondary-600` | hsl(15 85% 45%) | `#CC3700` | Активные кнопки |
| `--color-secondary-700` | hsl(15 80% 35%) | `#992900` | Hover на активном |
| `--color-secondary-800` | hsl(15 75% 25%) | `#661C00` | Текст на светлом |
| `--color-secondary-900` | hsl(15 70% 18%) | `#331200` | Самый тёмный оттенок |

### Применение

- **Вторичные кнопки:** Альтернативный вариант primary
- **Hover эффекты:** Более тёплый, "горящий" эффект
- **Энергичные элементы:** Движение, активность, огонь
- **Комбинирование:** Primary + secondary для градиентов

---

## Neutral — Warm Black

### Описание
Нейтральные оттенки. Символизируют глубину, утончённость. Тёплый чёрный с лёгким оранжевым подтоном.

### Цветовая шкала (10 оттенков)

| Токен | HSL | Пример | Использование |
|--------|------|--------|--------------|
| `--color-neutral-50` | hsl(15 10% 96%) | `#F1F2F3` | Самый светлый текст |
| `--color-neutral-100` | hsl(15 10% 90%) | `#E5E9EB` | Основной текст |
| `--color-neutral-200` | hsl(15 8% 78%) | `#B5BFC4` | Вторичный текст |
| `--color-neutral-300` | hsl(15 6% 60%) | `#6A7D8F` | Мутный текст |
| `--color-neutral-400` | hsl(15 5% 45%) | `#455A6C` | Placeholder текст |
| `--color-neutral-500` | hsl(15 4% 30%) | `#3C4251` | Subtle разделители |
| `--color-neutral-600` | hsl(15 4% 20%) | `#2A2E35` | Borders |
| `--color-neutral-700` | hsl(15 5% 14%) | `#201E1F` | Фоны карт |
| `--color-neutral-800` | hsl(15 6% 10%) | `#161415` | **Основной фон страницы** |
| `--color-neutral-900` | hsl(15 8% 6%) | `#0D0C0E` | **Фон hero-секций** |

### Применение

- **Основной фон:** `--color-neutral-900` для страницы
- **Hero фоны:** `--color-neutral-900` для заголовков
- **Карточки:** `--color-neutral-700` для карточек
- **Текст:** `--color-neutral-100` для основного текста
- **Разделители:** `--color-neutral-600` для границ

---

## Семантические цвета

| Токен | HSL | Пример | Назначение |
|--------|------|--------|-----------|
| `--color-background` | var(--color-neutral-900) | `#0D0C0E` | Фон страницы |
| `--color-surface` | var(--color-neutral-800) | `#161415` | Фон карточек |
| `--color-surface-elevated` | var(--color-neutral-700) | `#201E1F` | Повышенные элементы |
| `--color-text-primary` | var(--color-neutral-50) | `#F1F2F3` | Основной текст |
| `--color-text-secondary` | var(--color-neutral-300) | `#B5BFC4` | Вторичный текст |
| `--color-text-muted` | var(--color-neutral-400) | `#455A6C` | Мутный текст, placeholder |
| `--color-accent` | var(--color-primary-500) | `#E63946` | Акцентные элементы |
| `--color-accent-hover` | var(--color-primary-400) | `#BF8275` | Hover на акцентах |
| `--color-accent-active` | var(--color-primary-600) | `#C62D3D` | Активные акценты |
| `--color-border` | var(--color-neutral-700) | `#201E1F` | Границы |
| `--color-border-subtle` | hsl(15 5% 14% / 0.5) | `#363C4480` | Мутные границы (50% opacity) |

---

## Статусные цвета

### Success (зелёный)
- **Токен:** `--color-success`
- **HSL:** hsl(142 76% 36%)
- **Пример:** `#2EB885`
- **Использование:** Успешные действия, подтверждения, позитивный feedback

### Warning (жёлтый)
- **Токен:** `--color-warning`
- **HSL:** hsl(38 92% 50%)
- **Пример:** `#F0C028`
- **Использование:** Предупреждения, cautions, awaiting

### Error (красный)
- **Токен:** `--color-error`
- **HSL:** hsl(5 85% 60%)
- **Пример:** `#E63946`
- **Использование:** Ошибки, failed actions, destructive actions
- **Примечание:** Совпадает с `--color-primary-500` (цельное совпадение)

### Info (синий)
- **Токен:** `--color-info`
- **HSL:** hsl(199 89% 48%)
- **Пример:** `#4A90E2`
- **Использование:** Информационные сообщения, tips, help

---

## Tailwind / Shadcn совместимость

### Основные токены

| Tailwind | Token | HSL | Пример |
|---------|-------|------|--------|
| `background` | `--background` | hsl(15 8% 6%) | `#0D0C0E` |
| `foreground` | `--foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `card` | `--card` | hsl(15 6% 10%) | `#201E1F` |
| `card-foreground` | `--card-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `primary` | `--primary` | hsl(5 85% 60%) | `#E63946` |
| `primary-foreground` | `--primary-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `secondary` | `--secondary` | hsl(15 90% 50%) | `#FF4500` |
| `secondary-foreground` | `--secondary-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `muted` | `--muted` | hsl(15 4% 20%) | `#3C4251` |
| `muted-foreground` | `--muted-foreground` | hsl(15 6% 60%) | `#7A8E99` |
| `accent` | `--accent` | hsl(15 4% 20%) | `#5C6D7E` |
| `accent-foreground` | `--accent-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `destructive` | `--destructive` | hsl(5 85% 60%) | `#E63946` |
| `destructive-foreground` | `--destructive-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `border` | `--border` | hsl(15 5% 14%) | `#363C44` |
| `input` | `--input` | hsl(15 5% 14%) | `#363C44` |
| `ring` | `--ring` | hsl(5 85% 60%) | `#E63946` |
| `radius` | `--radius` | 0.5rem | `8px` |

### Sidebar токены

| Tailwind | Token | HSL | Пример |
|---------|-------|------|--------|
| `sidebar-background` | `--sidebar-background` | hsl(15 6% 10%) | `#201E1F` |
| `sidebar-foreground` | `--sidebar-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `sidebar-primary` | `--sidebar-primary` | hsl(5 85% 60%) | `#E63946` |
| `sidebar-primary-foreground` | `--sidebar-primary-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `sidebar-accent` | `--sidebar-accent` | hsl(15 4% 20%) | `#5C6D7E` |
| `sidebar-accent-foreground` | `--sidebar-accent-foreground` | hsl(15 10% 96%) | `#E5E9EB` |
| `sidebar-border` | `--sidebar-border` | hsl(15 5% 14%) | `#363C44` |
| `sidebar-ring` | `--sidebar-ring` | hsl(5 85% 60%) | `#E63946` |

### Popover токены

| Tailwind | Token | HSL | Пример |
|---------|-------|------|--------|
| `popover` | `--popover` | hsl(15 6% 10%) | `#201E1F` |
| `popover-foreground` | `--popover-foreground` | hsl(15 10% 96%) | `#E5E9EB` |

---

## Эффекты

### Градиенты

**Primary градиент:**
```css
background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
```

**Secondary градиент:**
```css
background: linear-gradient(135deg, var(--color-secondary-500), var(--color-secondary-700));
```

**Fire эффект:**
```css
background: linear-gradient(180deg, var(--color-secondary-500), var(--color-primary-600));
```

### Glow эффект (свечение)

- **Токен:** `--shadow-glow`
- **CSS:** `0 0 40px hsl(5 85% 60% / 0.3)`
- **Применение:** Hero секции, featured элементы, активные кнопки

### Glass эффект (матовое стекло)

```css
background: var(--color-neutral-800 / 0.6);
backdrop-filter: blur(12px);
border: 1px solid var(--color-border-subtle);
```

---

## Типографика

### Шрифты

| Токен | Значение | Использование |
|--------|-----------|--------------|
| `--font-display` | 'Clash Display', system-ui, sans-serif | Заголовки, hero-текст |
| `--font-body` | 'Satoshi', system-ui, sans-serif | Основной текст |
| `--font-mono` | 'JetBrains Mono', monospace | Код, технический текст |

### Размеры шрифта (8 уровней)

| Токен | Размер (px) | Использование |
|--------|--------------|--------------|
| `--font-size-xs` | 12px | Мелкие метки, helper text |
| `--font-size-sm` | 14px | Вторичный текст |
| `--font-size-base` | 16px | **Основной текст** |
| `--font-size-lg` | 18px | Подзаголовки |
| `--font-size-xl` | 20px | Заголовки H3 |
| `--font-size-2xl` | 24px | Заголовки H2 |
| `--font-size-3xl` | 30px | Hero подзаголовки |
| `--font-size-4xl` | 36px | Заголовки H1, hero |
| `--font-size-5xl` | 48px | Hero-текст крупный |
| `--font-size-6xl` | 60px | Hero-текст очень крупный |
| `--font-size-7xl` | 72px | Hero-текст максимальный |
| `--font-size-8xl` | 96px | Display элементы |

### Начертания

| Токен | Вес | Использование |
|--------|------|--------------|
| `--font-weight-light` | 300 | Тонкий текст |
| `--font-weight-normal` | 400 | **Обычный текст** |
| `--font-weight-medium` | 500 | Акцентный текст |
| `--font-weight-semibold` | 600 | Подзаголовки |
| `--font-weight-bold` | 700 | **Заголовки** |

---

## Отступы и интервалы (12 уровней)

| Токен | Размер (px) | Использование |
|--------|--------------|--------------|
| `--space-1` | 4px | Мелкие отступы |
| `--space-2` | 8px | Внутренние отступы |
| `--space-3` | 12px | Стандартные отступы |
| `--space-4` | 16px | **Основные отступы** |
| `--space-5` | 20px | Секционные отступы |
| `--space-6` | 24px | Большие отступы |
| `--space-8` | 32px | Вертикальные секции |
| `--space-10` | 40px | Крупные секции |
| `--space-12` | 48px | Hero секции |
| `--space-16` | 64px | Очень крупные секции |
| `--space-20` | 80px | Максимальные секции |
| `--space-24` | 96px | Экранные секции |

---

## Анимация

### Длительность (3 скорости)

| Токен | Длительность | Использование |
|--------|-------------|--------------|
| `--duration-fast` | 150ms | Hover эффекты, быстрые transition |
| `--duration-normal` | 300ms | **Обычные анимации** |
| `--duration-slow` | 500ms | Медленные анимации, complex effects |

### Easing функции

| Токен | Кривая | Использование |
|--------|---------|--------------|
| `--ease-out` | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Exit анимации |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | **Обычные анимации** |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Spring эффекты |

---

## Радиус скругления (5 уровней)

| Токен | Размер | Использование |
|--------|--------|--------------|
| `--radius-sm` | 0.25rem | 4px | Мелкие элементы |
| `--radius-md` | 0.5rem | 8px | **Кнопки, карточки** |
| `--radius-lg` | 1rem | 16px | Крупные элементы |
| `--radius-xl` | 1.5rem | 24px | Очень крупные элементы |
| `--radius-full` | 9999px | Круглые элементы |

---

## Тени (4 уровня)

| Токен | CSS | Пример | Использование |
|--------|------|--------|--------------|
| `--shadow-sm` | `0 1px 2px hsl(0 0% 0% / 0.1)` | Лёгкая тень |
| `--shadow-md` | `0 4px 6px hsl(0 0% 0% / 0.15)` | **Обычная тень** |
| `--shadow-lg` | `0 10px 15px hsl(0 0% 0% / 0.2)` | Крупная тень |
| `--shadow-glow` | `0 0 40px hsl(5 85% 60% / 0.3)` | Glow эффект (primary) |

---

## Примеры применения

### Кнопка Primary
```css
background: var(--color-primary-500);
color: var(--color-neutral-50);
border-radius: var(--radius-md);
font-weight: var(--font-weight-semibold);
transition: all var(--duration-normal) var(--ease-in-out);
}

button:hover {
  background: var(--color-primary-600);
}

button:active {
  background: var(--color-primary-700);
}
```

### Кнопка Secondary
```css
background: var(--color-secondary-500);
color: var(--color-neutral-50);
border-radius: var(--radius-md);
font-weight: var(--font-weight-semibold);
}

button:hover {
  background: var(--color-secondary-600);
}
```

### Карточка с glass эффектом
```css
background: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
backdrop-filter: blur(12px);
```

### Hero секция с glow
```css
background: var(--color-neutral-900);
background: radial-gradient(circle at center, var(--shadow-glow), transparent);
color: var(--color-text-primary);
```

---

## Философия дизайна

### Цветовая семантика

**Красный (Primary/Secondary/Error)**
- **Символика:** Мощь, победа, агрессия, доминирование
- **Психология:** Внимание, энергия, действие
- **Применение:** CTA, кнопки, ошибки, акценты

**Чёрный/Тёмно-серый (Neutral)**
- **Символика:** Глубина, профессионализм, фокус
- **Психология:** Спокойствие, надежность, контраст
- **Применение:** Фоны, текст, границы

### Контрастность

**High-contrast дизайн:**
- Background: `neutral-900` (`#0D0C0E`)
- Foreground: `neutral-50` (`#F1F2F3`)
- **Контраст:** ~15:1 (WCAG AAA)

### Aggressive эстетика

- **Тёмные фоны:** Максимальный тёмный `neutral-900`
- **Яркие акценты:** Максимальный насыщенный `primary-500`
- **Жёсткие тени:** Чёткие, размытые, glow эффекты
- **Резкие границы:** `neutral-700` для чёткого разделения

---

## Использование в Tailwind CSS

```html
<!-- Primary кнопка -->
<button class="bg-primary text-primary-foreground hover:bg-primary-600">
  Действие
</button>

<!-- Secondary кнопка -->
<button class="bg-secondary text-secondary-foreground">
  Вторичное
</button>

<!-- Карточка -->
<div class="card card-foreground">
  Содержание
</div>

<!-- Статус -->
<div class="text-success">
  Успешно
</div>

<div class="text-error">
  Ошибка
</div>
```

---

## Быстрый справочник

### Для текста
- Основной текст: `text-primary` или `text-neutral-100`
- Вторичный текст: `text-secondary` или `text-neutral-300`
- Мутный текст: `text-muted` или `text-neutral-400`

### Для фонов
- Страница: `bg-background` или `bg-neutral-900`
- Карточка: `bg-card` или `bg-neutral-700`
- Elevated: `bg-surface-elevated` или `bg-neutral-700`

### Для границ
- Стандартная: `border-border` или `border-neutral-700`
- Мутная: `border-border-subtle`

### Для акцентов
- Основной: `text-accent` / `bg-accent`
- Hover: `text-accent-hover` / `bg-accent-hover`
- Active: `text-accent-active` / `bg-accent-active`

### Для анимации
- Быстрая: `duration-fast`
- Обычная: `duration-normal`
- Медленная: `duration-slow`

---

## Конфликт токенов

- `--color-error` == `--color-primary-500` (оба `hsl(5 85% 60%)`)
- **Цельное совпадение:** Ошибки = акцент = внимание
- **Использовать:** `--color-error` для ошибок, `--color-primary-500` для buttons
