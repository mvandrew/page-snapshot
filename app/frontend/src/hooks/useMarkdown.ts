import { useState, useCallback, useEffect } from 'react';
import { MarkdownState, MarkdownContent } from '@/types/markdown';
import { apiService } from '@/services/api';

/**
 * Хук для управления состоянием markdown контента
 */
export function useMarkdown() {
  const [state, setState] = useState<MarkdownState>({
    content: null,
    isLoading: false,
    error: null,
    lastSuccessUpdate: null,
  });

  /**
   * Загружает markdown контент с сервера
   */
  const loadMarkdown = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const content = await apiService.getMarkdown();
      const now = new Date();
      
      const markdownContent: MarkdownContent = {
        content,
        lastUpdated: now,
        size: content.length,
      };

      setState({
        content: markdownContent,
        isLoading: false,
        error: null,
        lastSuccessUpdate: now,
      });

      // Сохраняем в localStorage для кеширования
      localStorage.setItem('markdown-cache', JSON.stringify(markdownContent));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      }));
    }
  }, []);

  /**
   * Очищает ошибку
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Загружает кешированный контент из localStorage
   */
  const loadCachedContent = useCallback(() => {
    try {
      const cached = localStorage.getItem('markdown-cache');
      if (cached) {
        const markdownContent: MarkdownContent = JSON.parse(cached);
        setState(prev => ({
          ...prev,
          content: markdownContent,
          error: null,
        }));
      }
    } catch {
      // Игнорируем ошибки парсинга кеша
    }
  }, []);

  /**
   * Очищает весь контент
   */
  const clearContent = useCallback(() => {
    setState({
      content: null,
      isLoading: false,
      error: null,
      lastSuccessUpdate: null,
    });
    localStorage.removeItem('markdown-cache');
  }, []);

  // Загружаем кешированный контент при инициализации
  useEffect(() => {
    loadCachedContent();
  }, [loadCachedContent]);

  return {
    ...state,
    loadMarkdown,
    clearError,
    clearContent,
    hasContent: !!state.content,
    isEmpty: !state.content && !state.isLoading && !state.error,
  };
}
