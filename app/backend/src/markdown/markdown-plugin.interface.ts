/**
 * Интерфейс для плагинов конвертации HTML в Markdown
 */
export interface MarkdownPlugin {
    /**
     * Конвертирует HTML файл в Markdown
     * @param htmlFilePath - путь к HTML файлу
     * @param pageUrl - URL сохраненной страницы из data.json
     * @returns Markdown код или null если плагин не может обработать файл
     */
    convert(htmlFilePath: string, pageUrl: string): string | null;
}
