import { MainLayout } from './components/layout/MainLayout';
import { MarkdownToolbar } from './components/markdown/MarkdownToolbar';
import { MarkdownViewer } from './components/markdown/MarkdownViewer';
import { MarkdownError } from './components/markdown/MarkdownError';
import { Toaster } from './components/ui/toaster';
import { useMarkdown } from './hooks/useMarkdown';
import { useToast } from './components/ui/use-toast';
import { useEffect } from 'react';

/**
 * Главный компонент приложения Page Snapshot
 */
function App() {
  const {
    content,
    isLoading,
    error,
    loadMarkdown,
    clearError,
    clearContent,
  } = useMarkdown();

  const { toast } = useToast();

  // Обработка успешного обновления
  useEffect(() => {
    if (content && !isLoading && !error) {
      toast({
        title: 'Контент обновлен',
        description: `Загружено ${content.size} символов`,
      });
    }
  }, [content, isLoading, error, toast]);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleRefresh = async () => {
    clearError();
    await loadMarkdown();
  };

  const handleClear = () => {
    clearContent();
    toast({
      title: 'Контент очищен',
      description: 'Markdown данные удалены',
    });
  };

  return (
    <>
      <MainLayout onRefresh={handleRefresh} isRefreshing={isLoading}>
        <div className="flex flex-col h-[calc(100vh-12rem)] min-h-0">
          {/* Панель инструментов */}
          <MarkdownToolbar
            content={content}
            onClear={handleClear}
          />

          {/* Область отображения markdown */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {error ? (
              <MarkdownError
                error={error}
                onRetry={handleRefresh}
                isRetrying={isLoading}
              />
            ) : (
              <MarkdownViewer
                content={content}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
        </div>
      </MainLayout>

      {/* Toast уведомления */}
      <Toaster />
    </>
  );
}

export default App;
