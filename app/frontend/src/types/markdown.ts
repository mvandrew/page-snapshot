/**
 * Типы для работы с Markdown контентом
 */

export interface MarkdownContent {
  /** Содержимое markdown в виде строки */
  content: string;
  /** Время последнего обновления */
  lastUpdated: Date;
  /** Размер контента в символах */
  size: number;
}

export interface MarkdownState {
  /** Текущий контент */
  content: MarkdownContent | null;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Ошибка загрузки */
  error: string | null;
  /** Время последнего успешного обновления */
  lastSuccessUpdate: Date | null;
}

export interface ClipboardState {
  /** Успешно ли скопировано */
  isCopied: boolean;
  /** Время последнего копирования */
  lastCopied: Date | null;
  /** Ошибка копирования */
  error: string | null;
}
