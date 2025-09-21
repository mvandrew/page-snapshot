# Настройка shadcn/ui

## Что настроено

✅ **Tailwind CSS** с поддержкой темной темы  
✅ **shadcn/ui** с оранжевой цветовой схемой  
✅ **Провайдер темы** с переключением light/dark/system  
✅ **Алиасы путей** (@/ для src/)  
✅ **Базовые компоненты** (Button, ThemeToggle)  

## Структура файлов

```
src/
├── components/
│   ├── ui/
│   │   └── button.tsx          # Компонент кнопки
│   ├── theme-provider.tsx      # Провайдер темы
│   └── theme-toggle.tsx        # Переключатель темы
├── lib/
│   └── utils.ts                # Утилиты для классов
└── index.css                   # CSS переменные для тем
```

## Использование

### Добавление новых компонентов

```bash
# Установка компонента из shadcn/ui
npx shadcn@latest add [component-name]

# Примеры:
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
```

### Использование в коде

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Заголовок</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline">Кнопка</Button>
      </CardContent>
    </Card>
  )
}
```

### Переключение темы

```tsx
import { useTheme } from '@/components/theme-provider'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Переключить на темную тему
    </button>
  )
}
```

## Цветовая схема

- **Primary**: Оранжевый (#f97316)
- **Secondary**: Серый
- **Background**: Белый (светлая) / Темный (темная)
- **Foreground**: Темный (светлая) / Светлый (темная)

## Настройки

### Изменение цветов

Отредактируйте переменные в `src/index.css`:

```css
:root {
  --primary: 24.6 95% 53.1%; /* Оранжевый */
  /* Другие цвета... */
}
```

### Добавление новых тем

1. Добавьте CSS переменные в `index.css`
2. Обновите `ThemeProvider` для поддержки новой темы
3. Добавьте переключатель в `ThemeToggle`

## Запуск

```bash
npm run dev
```

Проект будет доступен по адресу http://localhost:5173

## Полезные ссылки

- [shadcn/ui документация](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
