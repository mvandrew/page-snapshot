import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';
import * as fs from 'fs';

/**
 * Стандартный плагин для извлечения заголовка страницы из тега <title>
 * Возвращает заголовок в формате Markdown: # {заголовок}
 */
export class ZzzTitlePlugin implements MarkdownPlugin {
    /**
     * Конвертирует HTML файл в Markdown, извлекая заголовок из тега <title>
     * @param htmlFilePath - путь к HTML файлу
     * @returns Markdown заголовок или null если тег <title> отсутствует
     */
    convert(htmlFilePath: string): string | null {
        try {
            console.log(`[ZzzTitlePlugin] Обрабатываем файл: ${htmlFilePath}`);

            // Читаем HTML файл
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

            // Ищем тег <title> в HTML
            const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);

            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].trim();

                if (title.length > 0) {
                    console.log(`[ZzzTitlePlugin] Найден заголовок: "${title}"`);
                    // Возвращаем заголовок в формате Markdown
                    return `# ${title}`;
                }
            }

            console.log('[ZzzTitlePlugin] Тег <title> не найден или пуст');
            return null;
        } catch (error) {
            console.error(`[ZzzTitlePlugin] Ошибка при обработке файла ${htmlFilePath}:`, error.message);
            return null;
        }
    }
}
