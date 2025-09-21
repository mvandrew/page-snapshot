/**
 * Интерфейс для плагинов конвертации HTML в Markdown
 */
export interface MarkdownPlugin {
    /**
     * Конвертирует HTML файл в Markdown
     * @param htmlFilePath - путь к HTML файлу
     * @returns Markdown код или null если плагин не может обработать файл
     */
    convert(htmlFilePath: string): string | null;
}
