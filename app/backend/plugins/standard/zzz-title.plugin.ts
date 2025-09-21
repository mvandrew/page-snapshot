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
     * @param pageUrl - URL сохраненной страницы из data.json
     * @returns Markdown заголовок или null если тег <title> отсутствует
     */
    convert(htmlFilePath: string, pageUrl: string): string | null {
        try {
            console.log(`[ZzzTitlePlugin] Обрабатываем файл: ${htmlFilePath}`);
            console.log(`[ZzzTitlePlugin] URL страницы: ${pageUrl}`);

            // Читаем HTML файл
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

            // Ищем тег <title> в HTML
            const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);

            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].trim();

                if (title.length > 0) {
                    console.log(`[ZzzTitlePlugin] Найден заголовок: "${title}"`);

                    // Создаем Markdown с заголовком и ссылкой на оригинальную страницу
                    let markdown = `# ${title}`;

                    // Добавляем ссылку на оригинальную страницу, если URL доступен
                    if (pageUrl && pageUrl.trim().length > 0) {
                        markdown += `\n\n[Открыть оригинал](${pageUrl})`;
                    }

                    return markdown;
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
