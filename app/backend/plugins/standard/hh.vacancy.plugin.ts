import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';
import * as fs from 'fs';

/**
 * Плагин для обработки вакансий с сайта hh.ru
 * Срабатывает только для URL вида https://hh.ru/vacancy/{id} где id - цифры
 * Извлекает заголовок из тега <title> и создает markdown с заголовком и ссылкой
 */
export class HhVacancyPlugin implements MarkdownPlugin {
    /**
     * Регулярное выражение для проверки URL вакансии hh.ru
     * Паттерн: https://hh.ru/vacancy/ + цифры + опциональные параметры
     */
    private readonly hhVacancyUrlPattern = /^https:\/\/hh\.ru\/vacancy\/\d+/i;

    /**
     * Конвертирует HTML файл в Markdown для вакансий hh.ru
     * @param htmlFilePath - путь к HTML файлу
     * @param pageUrl - URL сохраненной страницы из data.json
     * @returns Markdown заголовок с ссылкой или null если URL не соответствует паттерну
     */
    convert(htmlFilePath: string, pageUrl: string): string | null {
        try {
            console.log(`[HhVacancyPlugin] Обрабатываем файл: ${htmlFilePath}`);
            console.log(`[HhVacancyPlugin] URL страницы: ${pageUrl}`);

            // Проверяем, соответствует ли URL паттерну вакансии hh.ru
            if (!this.isHhVacancyUrl(pageUrl)) {
                console.log('[HhVacancyPlugin] URL не соответствует паттерну вакансии hh.ru');
                return null;
            }

            // Читаем HTML файл
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

            // Ищем тег <title> в HTML
            const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);

            if (titleMatch && titleMatch[1]) {
                const title = titleMatch[1].trim();

                if (title.length > 0) {
                    console.log(`[HhVacancyPlugin] Найден заголовок вакансии: "${title}"`);

                    // Создаем Markdown с заголовком и ссылкой на оригинальную вакансию
                    let markdown = `# ${title}`;

                    // Добавляем ссылку на оригинальную вакансию
                    if (pageUrl && pageUrl.trim().length > 0) {
                        markdown += `\n\n[Открыть вакансию](${pageUrl})`;
                    }

                    return markdown;
                }
            }

            console.log('[HhVacancyPlugin] Тег <title> не найден или пуст');
            return null;
        } catch (error) {
            console.error(`[HhVacancyPlugin] Ошибка при обработке файла ${htmlFilePath}:`, error.message);
            return null;
        }
    }

    /**
     * Проверяет, соответствует ли URL паттерну вакансии hh.ru
     * @param url - URL для проверки
     * @returns true если URL соответствует паттерну вакансии hh.ru
     */
    private isHhVacancyUrl(url: string): boolean {
        if (!url || typeof url !== 'string') {
            return false;
        }

        return this.hhVacancyUrlPattern.test(url.trim());
    }
}
