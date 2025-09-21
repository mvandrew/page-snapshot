import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/components/theme-provider'

function App() {
  const [count, setCount] = useState(0)
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        {/* Header с переключателем темы */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">
            Page Snapshot
          </h1>
          <ThemeToggle />
        </div>

        {/* Информация о текущей теме */}
        <div className="mb-8 p-4 rounded-lg bg-card border">
          <h2 className="text-xl font-semibold mb-2">Текущая тема: {theme}</h2>
          <p className="text-muted-foreground">
            Используйте переключатель в правом верхнем углу для смены темы
          </p>
        </div>

        {/* Демонстрация компонентов */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-card border">
            <h3 className="text-2xl font-semibold mb-4">Демонстрация shadcn/ui</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium mb-2">Кнопки</h4>
                <div className="flex gap-4 flex-wrap">
                  <Button onClick={() => setCount((count) => count + 1)}>
                    Счетчик: {count}
                  </Button>
                  <Button variant="secondary">Вторичная</Button>
                  <Button variant="outline">Контурная</Button>
                  <Button variant="ghost">Призрачная</Button>
                  <Button variant="destructive">Опасная</Button>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium mb-2">Цветовая схема</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded bg-primary text-primary-foreground">
                    <div className="font-medium">Primary</div>
                    <div className="text-sm opacity-80">Оранжевый</div>
                  </div>
                  <div className="p-4 rounded bg-secondary text-secondary-foreground">
                    <div className="font-medium">Secondary</div>
                    <div className="text-sm opacity-80">Серый</div>
                  </div>
                  <div className="p-4 rounded bg-muted text-muted-foreground">
                    <div className="font-medium">Muted</div>
                    <div className="text-sm opacity-80">Приглушенный</div>
                  </div>
                  <div className="p-4 rounded bg-accent text-accent-foreground">
                    <div className="font-medium">Accent</div>
                    <div className="text-sm opacity-80">Акцентный</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-card border">
            <h3 className="text-2xl font-semibold mb-4">О проекте</h3>
            <p className="text-muted-foreground mb-4">
              Это frontend часть проекта Page Snapshot с настроенным shadcn/ui,
              темной темой по умолчанию и оранжевой цветовой схемой.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
                  Документация shadcn/ui
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer">
                  Tailwind CSS
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
