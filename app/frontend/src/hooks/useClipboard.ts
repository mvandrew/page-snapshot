import { useState, useCallback } from 'react';
import type { ClipboardState } from '../types/markdown';

/**
 * Хук для работы с буфером обмена
 */
export function useClipboard() {
  const [state, setState] = useState<ClipboardState>({
    isCopied: false,
    lastCopied: null,
    error: null,
  });

  /**
   * Копирует текст в буфер обмена
   */
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (!text || text.trim().length === 0) {
      setState({
        isCopied: false,
        lastCopied: null,
        error: 'Нет текста для копирования',
      });
      return false;
    }

    try {
      // Проверяем поддержку Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback для старых браузеров
        await fallbackCopyToClipboard(text);
      }

      const now = new Date();
      setState({
        isCopied: true,
        lastCopied: now,
        error: null,
      });

      // Сбрасываем состояние через 2 секунды
      setTimeout(() => {
        setState(prev => ({ ...prev, isCopied: false }));
      }, 2000);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка копирования';
      setState({
        isCopied: false,
        lastCopied: null,
        error: errorMessage,
      });
      return false;
    }
  }, []);

  /**
   * Fallback метод копирования для старых браузеров
   */
  const fallbackCopyToClipboard = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          resolve();
        } else {
          reject(new Error('Не удалось скопировать текст'));
        }
      } catch (error) {
        document.body.removeChild(textArea);
        reject(error);
      }
    });
  };

  /**
   * Очищает состояние копирования
   */
  const clearState = useCallback(() => {
    setState({
      isCopied: false,
      lastCopied: null,
      error: null,
    });
  }, []);

  /**
   * Проверяет поддержку Clipboard API
   */
  const isSupported = useCallback(() => {
    return !!(navigator.clipboard && window.isSecureContext);
  }, []);

  return {
    ...state,
    copyToClipboard,
    clearState,
    isSupported: isSupported(),
  };
}
