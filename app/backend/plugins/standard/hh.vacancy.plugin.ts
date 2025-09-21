import { MarkdownPlugin } from '../../src/markdown/markdown-plugin.interface';
import * as fs from 'fs';

/**
 * Интерфейс для данных о вакансии hh.ru
 */
interface VacancyData {
    title: string;
    salary?: string;
    experience?: string;
    employment?: string;
    contractType?: string;
    schedule?: string;
    workingHours?: string;
    workFormat?: string;
    employerName?: string;
    employerUrl?: string;
    skills?: string[];
    description?: string;
}

/**
 * Плагин для обработки вакансий с сайта hh.ru
 * Срабатывает только для URL вида https://hh.ru/vacancy/{id} где id - цифры
 * Извлекает подробную информацию о вакансии включая заголовок, зарплату, опыт и условия работы
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
     * @returns Markdown с подробной информацией о вакансии или null если URL не соответствует паттерну
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

            // Извлекаем данные о вакансии
            const vacancyData = this.extractVacancyData(htmlContent);

            if (!vacancyData.title) {
                console.log('[HhVacancyPlugin] Не удалось извлечь заголовок вакансии');
                return null;
            }

            console.log(`[HhVacancyPlugin] Найдены данные вакансии:`, vacancyData);

            // Создаем Markdown с подробной информацией
            return this.createMarkdown(vacancyData, pageUrl);

        } catch (error) {
            console.error(`[HhVacancyPlugin] Ошибка при обработке файла ${htmlFilePath}:`, error.message);
            return null;
        }
    }

    /**
     * Извлекает данные о вакансии из HTML контента
     * @param htmlContent - HTML контент страницы
     * @returns объект с данными вакансии
     */
    private extractVacancyData(htmlContent: string): VacancyData {
        const vacancyData: VacancyData = {
            title: '',
        };

        // Извлекаем заголовок из h1 тега
        vacancyData.title = this.extractTitle(htmlContent);

        // Извлекаем зарплату
        vacancyData.salary = this.extractSalary(htmlContent);

        // Извлекаем опыт работы
        vacancyData.experience = this.extractExperience(htmlContent);

        // Извлекаем тип занятости
        vacancyData.employment = this.extractEmployment(htmlContent);

        // Извлекаем тип оформления
        vacancyData.contractType = this.extractContractType(htmlContent);

        // Извлекаем график работы
        vacancyData.schedule = this.extractSchedule(htmlContent);

        // Извлекаем рабочие часы
        vacancyData.workingHours = this.extractWorkingHours(htmlContent);

        // Извлекаем формат работы
        vacancyData.workFormat = this.extractWorkFormat(htmlContent);

        // Извлекаем информацию о работодателе
        const employerInfo = this.extractEmployerInfo(htmlContent);
        vacancyData.employerName = employerInfo.name;
        vacancyData.employerUrl = employerInfo.url;

        // Извлекаем ключевые навыки
        vacancyData.skills = this.extractSkills(htmlContent);

        // Извлекаем описание вакансии
        vacancyData.description = this.extractDescription(htmlContent);

        return vacancyData;
    }

    /**
     * Извлекает заголовок вакансии из h1 тега
     * @param htmlContent - HTML контент
     * @returns заголовок вакансии или пустую строку
     */
    private extractTitle(htmlContent: string): string {
        // Ищем h1 тег с data-qa="vacancy-title" и span внутри
        const h1Match = htmlContent.match(/<h1[^>]*data-qa="vacancy-title"[^>]*>.*?<span[^>]*>(.*?)<\/span>.*?<\/h1>/is);
        if (h1Match && h1Match[1]) {
            return h1Match[1].trim();
        }

        // Fallback на обычный h1 тег
        const h1SimpleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/is);
        if (h1SimpleMatch && h1SimpleMatch[1]) {
            const title = h1SimpleMatch[1].replace(/<[^>]*>/g, '').trim();
            if (title.length > 0) {
                return title;
            }
        }

        // Fallback на title тег
        const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1]
                .replace(/\s*-\s*работа\s+в\s+.*$/i, '')
                .replace(/\s*-\s*hh\.ru$/i, '')
                .replace(/\s*\|\s*HeadHunter$/i, '')
                .trim();
            if (title.length > 0) {
                return title;
            }
        }

        return '';
    }

    /**
     * Извлекает информацию о зарплате
     * @param htmlContent - HTML контент
     * @returns информация о зарплате или undefined
     */
    private extractSalary(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="vacancy-salary"
        const salaryBlockMatch = htmlContent.match(/<div[^>]*data-qa="vacancy-salary"[^>]*>(.*?)<\/div>/is);
        if (salaryBlockMatch && salaryBlockMatch[1]) {
            const salaryContent = salaryBlockMatch[1];
            // Извлекаем текст из span с data-qa="vacancy-salary-compensation-type-net"
            const salarySpanMatch = salaryContent.match(/<span[^>]*data-qa="vacancy-salary-compensation-type-net"[^>]*>(.*?)<\/span>/is);
            if (salarySpanMatch && salarySpanMatch[1]) {
                // Очищаем HTML теги и нормализуем пробелы
                const salaryText = salarySpanMatch[1]
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (salaryText.length > 0) {
                    return salaryText;
                }
            }
        }

        // Fallback на поиск по паттернам
        const salaryPatterns = [
            /(от\s+\d+[\s,]*\d*\s*₽[^<\n]*)/i,
            /(до\s+\d+[\s,]*\d*\s*₽[^<\n]*)/i,
            /(\d+[\s,]*\d*\s*₽[^<\n]*)/i,
            /(от\s+\d+[\s,]*\d*\s*рублей?[^<\n]*)/i,
            /(до\s+\d+[\s,]*\d*\s*рублей?[^<\n]*)/i,
            /(\d+[\s,]*\d*\s*рублей?[^<\n]*)/i,
        ];

        for (const pattern of salaryPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает информацию об опыте работы
     * @param htmlContent - HTML контент
     * @returns информация об опыте или undefined
     */
    private extractExperience(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="work-experience-text"
        const experienceBlockMatch = htmlContent.match(/<p[^>]*data-qa="work-experience-text"[^>]*>(.*?)<\/p>/is);
        if (experienceBlockMatch && experienceBlockMatch[1]) {
            const experienceContent = experienceBlockMatch[1];
            // Ищем span с data-qa="vacancy-experience"
            const experienceSpanMatch = experienceContent.match(/<span[^>]*data-qa="vacancy-experience"[^>]*>(.*?)<\/span>/is);
            if (experienceSpanMatch && experienceSpanMatch[1]) {
                return experienceSpanMatch[1].trim();
            }
            // Если span не найден, извлекаем весь текст
            const experienceText = experienceContent
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (experienceText.length > 0) {
                return experienceText;
            }
        }

        // Fallback на поиск по паттернам
        const experiencePatterns = [
            /опыт(?:\s+работы)?[:\s]*([^<\n]*(?:лет|года?|месяц))/i,
            /(без\s+опыта|нет\s+опыта)/i,
            /(\d+[-–]\d+\s+лет)/i,
            /(более\s+\d+\s+лет)/i,
        ];

        for (const pattern of experiencePatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает тип занятости
     * @param htmlContent - HTML контент
     * @returns тип занятости или undefined
     */
    private extractEmployment(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="common-employment-text"
        const employmentBlockMatch = htmlContent.match(/<div[^>]*data-qa="common-employment-text"[^>]*>(.*?)<\/div>/is);
        if (employmentBlockMatch && employmentBlockMatch[1]) {
            const employmentContent = employmentBlockMatch[1];
            // Ищем span с классом text
            const employmentSpanMatch = employmentContent.match(/<span[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)<\/span>/is);
            if (employmentSpanMatch && employmentSpanMatch[1]) {
                return employmentSpanMatch[1].trim();
            }
            // Если span не найден, извлекаем весь текст
            const employmentText = employmentContent
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (employmentText.length > 0) {
                return employmentText;
            }
        }

        // Fallback на поиск по паттернам
        const employmentPatterns = [
            /(полная\s+занятость)/i,
            /(частичная\s+занятость)/i,
            /(проектная\s+работа)/i,
            /(стажировка)/i,
        ];

        for (const pattern of employmentPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает тип оформления
     * @param htmlContent - HTML контент
     * @returns тип оформления или undefined
     */
    private extractContractType(htmlContent: string): string | undefined {
        // Ищем блок с классом "row" и span с текстом "Оформление"
        const contractBlockMatch = htmlContent.match(/<div[^>]*class="[^"]*row[^"]*"[^>]*>.*?Оформление.*?<span[^>]*class="[^"]*vacancy-key-info-item[^"]*"[^>]*>(.*?)<\/span>.*?<\/div>/is);
        if (contractBlockMatch && contractBlockMatch[1]) {
            const contractText = contractBlockMatch[1]
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (contractText.length > 0) {
                return contractText;
            }
        }

        // Fallback на поиск по паттернам
        const contractPatterns = [
            /(договор\s+гпх[^<\n]*)/i,
            /(трудовой\s+договор)/i,
            /(самозанятый)/i,
        ];

        for (const pattern of contractPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает график работы
     * @param htmlContent - HTML контент
     * @returns график работы или undefined
     */
    private extractSchedule(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="work-schedule-by-days-text"
        const scheduleBlockMatch = htmlContent.match(/<p[^>]*data-qa="work-schedule-by-days-text"[^>]*>(.*?)<\/p>/is);
        if (scheduleBlockMatch && scheduleBlockMatch[1]) {
            const scheduleContent = scheduleBlockMatch[1];
            // Извлекаем текст после "График:"
            const scheduleText = scheduleContent
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/^График:\s*/, '')
                .trim();
            if (scheduleText.length > 0) {
                return scheduleText;
            }
        }

        // Fallback на поиск по паттернам
        const schedulePatterns = [
            /график[:\s]*([^<\n]*(?:\d+\/\d+|\d+\s*дней))/i,
            /(\d+\/\d+)/,
            /(понедельник[-–]пятница)/i,
        ];

        for (const pattern of schedulePatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает рабочие часы
     * @param htmlContent - HTML контент
     * @returns рабочие часы или undefined
     */
    private extractWorkingHours(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="working-hours-text"
        const workingHoursBlockMatch = htmlContent.match(/<div[^>]*data-qa="working-hours-text"[^>]*>(.*?)<\/div>/is);
        if (workingHoursBlockMatch && workingHoursBlockMatch[1]) {
            const workingHoursContent = workingHoursBlockMatch[1];
            // Ищем span с классом text
            const workingHoursSpanMatch = workingHoursContent.match(/<span[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)<\/span>/is);
            if (workingHoursSpanMatch && workingHoursSpanMatch[1]) {
                const workingHoursText = workingHoursSpanMatch[1]
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\s+/g, ' ')
                    .replace(/^Рабочие\s+часы:\s*/, '')
                    .trim();
                if (workingHoursText.length > 0) {
                    return workingHoursText;
                }
            }
        }

        // Fallback на поиск по паттернам
        const hoursPatterns = [
            /(\d+)\s*час/i,
            /рабочие\s+часы[:\s]*(\d+)/i,
        ];

        for (const pattern of hoursPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает формат работы
     * @param htmlContent - HTML контент
     * @returns формат работы или undefined
     */
    private extractWorkFormat(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="work-formats-text"
        const workFormatBlockMatch = htmlContent.match(/<p[^>]*data-qa="work-formats-text"[^>]*>(.*?)<\/p>/is);
        if (workFormatBlockMatch && workFormatBlockMatch[1]) {
            const workFormatContent = workFormatBlockMatch[1];
            // Извлекаем текст после "Формат работы:"
            const workFormatText = workFormatContent
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/^Формат\s+работы:\s*/, '')
                .trim();
            if (workFormatText.length > 0) {
                return workFormatText;
            }
        }

        // Fallback на поиск по паттернам
        const formatPatterns = [
            /(удалённо|удаленно)/i,
            /(в\s+офисе)/i,
            /(гибридный\s+формат)/i,
            /(можно\s+удалённо)/i,
        ];

        for (const pattern of formatPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    /**
     * Извлекает информацию о работодателе
     * @param htmlContent - HTML контент
     * @returns объект с именем и URL работодателя
     */
    private extractEmployerInfo(htmlContent: string): { name?: string; url?: string } {
        // Ищем блок с data-qa="vacancy-company__details"
        const employerBlockMatch = htmlContent.match(/<div[^>]*data-qa="vacancy-company__details"[^>]*>(.*?)<\/div>/is);
        if (employerBlockMatch && employerBlockMatch[1]) {
            const employerContent = employerBlockMatch[1];

            // Извлекаем ссылку на работодателя
            const employerLinkMatch = employerContent.match(/<a[^>]*data-qa="vacancy-company-name"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/is);
            if (employerLinkMatch) {
                const employerUrl = employerLinkMatch[1];
                const employerLinkContent = employerLinkMatch[2];

                // Извлекаем название компании из span внутри ссылки
                const employerNameMatch = employerLinkContent.match(/<span[^>]*class="[^"]*magritte-text[^"]*"[^>]*>(.*?)<\/span>/is);
                if (employerNameMatch && employerNameMatch[1]) {
                    const employerName = employerNameMatch[1]
                        .replace(/<[^>]*>/g, '')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    // Формируем полный URL для работодателя
                    const fullEmployerUrl = employerUrl.startsWith('http')
                        ? employerUrl
                        : `https://hh.ru${employerUrl}`;

                    return {
                        name: employerName,
                        url: fullEmployerUrl
                    };
                }
            }
        }

        return {};
    }

    /**
     * Извлекает ключевые навыки из блока с тегами
     * @param htmlContent - HTML контент
     * @returns массив навыков или undefined
     */
    private extractSkills(htmlContent: string): string[] | undefined {
        // Ищем блок с классом vacancy-skill-list
        const skillsListMatch = htmlContent.match(/<ul[^>]*class="[^"]*vacancy-skill-list[^"]*"[^>]*>(.*?)<\/ul>/is);
        if (skillsListMatch && skillsListMatch[1]) {
            const skillsContent = skillsListMatch[1];
            const skills: string[] = [];

            // Ищем все li элементы с data-qa="skills-element"
            const skillMatches = skillsContent.matchAll(/<li[^>]*data-qa="skills-element"[^>]*>(.*?)<\/li>/gis);

            for (const skillMatch of skillMatches) {
                if (skillMatch[1]) {
                    const skillContent = skillMatch[1];
                    // Извлекаем текст из div с классом magritte-tag__label
                    const skillLabelMatch = skillContent.match(/<div[^>]*class="[^"]*magritte-tag__label[^"]*"[^>]*>(.*?)<\/div>/is);
                    if (skillLabelMatch && skillLabelMatch[1]) {
                        const skill = skillLabelMatch[1]
                            .replace(/<[^>]*>/g, '')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        if (skill.length > 0) {
                            skills.push(skill);
                        }
                    }
                }
            }

            return skills.length > 0 ? skills : undefined;
        }

        return undefined;
    }

    /**
     * Извлекает описание вакансии с форматированием
     * @param htmlContent - HTML контент
     * @returns отформатированное описание или undefined
     */
    private extractDescription(htmlContent: string): string | undefined {
        // Ищем блок с data-qa="vacancy-description"
        const descriptionMatch = htmlContent.match(/<div[^>]*data-qa="vacancy-description"[^>]*>(.*?)<\/div>/is);
        if (descriptionMatch && descriptionMatch[1]) {
            const descriptionContent = descriptionMatch[1];

            // Очищаем и форматируем HTML в Markdown
            let markdownDescription = this.convertHtmlToMarkdown(descriptionContent);

            // Нормализуем переносы строк, но сохраняем структуру подзаголовков
            markdownDescription = markdownDescription
                .replace(/\n{6,}/g, '\n\n\n\n\n') // Заменяем 6+ переносов на 5
                .replace(/\n{5}/g, '\n\n\n\n') // Заменяем 5 переносов на 4
                .replace(/\n{4}/g, '\n\n\n') // Заменяем 4 переноса на 3
                .replace(/^\s+|\s+$/g, '') // Убираем пробелы в начале и конце
                .trim();

            return markdownDescription.length > 0 ? markdownDescription : undefined;
        }

        return undefined;
    }

    /**
     * Конвертирует HTML в Markdown с поддержкой подзаголовков
     * @param htmlContent - HTML контент
     * @returns Markdown строка
     */
    private convertHtmlToMarkdown(htmlContent: string): string {
        let markdown = htmlContent;

        // Сначала конвертируем подзаголовки <p><strong> в ###
        markdown = markdown.replace(/<p>\s*<strong>\s*<span[^>]*>(.*?)<\/span>\s*<\/strong>\s*<\/p>/gis, '\n\n### $1\n\n');

        console.log('[HhVacancyPlugin] После обработки подзаголовков:', JSON.stringify(markdown.substring(0, 200)));

        // Затем конвертируем обычные параграфы (исключая те, что содержат strong)
        markdown = markdown.replace(/<p[^>]*>(?!.*<strong>)(.*?)<\/p>/gis, (match, content) => {
            // Сначала очищаем HTML теги, но сохраняем переносы строк
            const cleanContent = this.cleanHtmlTagsPreservingLineBreaks(content);
            return cleanContent.length > 0 ? `${cleanContent}\n\n` : '';
        });

        // Конвертируем списки
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
            const listItems = content.match(/<li[^>]*>(.*?)<\/li>/gis);
            if (listItems) {
                const markdownList = listItems.map(item => {
                    const cleanItem = this.cleanHtmlTagsPreservingLineBreaks(item.replace(/<li[^>]*>|<\/li>/gi, ''));
                    return `- ${cleanItem}`;
                }).join('\n');
                return `\n${markdownList}\n\n`;
            }
            return '';
        });

        // Конвертируем отдельные li элементы (если они не в ul)
        markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gis, (match, content) => {
            const cleanContent = this.cleanHtmlTagsPreservingLineBreaks(content);
            return `- ${cleanContent}`;
        });

        // Очищаем оставшиеся HTML теги только если они есть
        if (markdown.includes('<')) {
            markdown = this.cleanHtmlTagsPreservingLineBreaks(markdown);
        }

        // Нормализуем переносы строк, но сохраняем структуру подзаголовков
        markdown = markdown
            .replace(/\n{5,}/g, '\n\n\n\n') // Заменяем 5+ переносов на 4
            .replace(/\n{4}/g, '\n\n\n') // Заменяем 4 переноса на 3
            .replace(/^\n+/, '') // Убираем переносы в начале
            .replace(/\n+$/, '') // Убираем переносы в конце
            .trim();

        console.log('[HhVacancyPlugin] Финальный результат:', JSON.stringify(markdown.substring(0, 300)));

        return markdown;
    }

    /**
     * Очищает HTML теги и нормализует текст, сохраняя переносы строк
     * @param htmlContent - HTML контент
     * @returns очищенный текст
     */
    private cleanHtmlTagsPreservingLineBreaks(htmlContent: string): string {
        return htmlContent
            .replace(/<br\s*\/?>/gi, '\n') // Конвертируем <br> в переносы строк
            .replace(/<[^>]*>/g, '') // Убираем все HTML теги
            .replace(/&nbsp;/g, ' ') // Заменяем неразрывные пробелы
            .replace(/&amp;/g, '&') // Заменяем HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[ \t]+/g, ' ') // Нормализуем пробелы и табы, но сохраняем переносы строк
            .replace(/\n\s+/g, '\n') // Убираем пробелы в начале строк
            .replace(/\s+\n/g, '\n') // Убираем пробелы в конце строк
            .trim();
    }

    /**
     * Очищает HTML теги и нормализует текст
     * @param htmlContent - HTML контент
     * @returns очищенный текст
     */
    private cleanHtmlTags(htmlContent: string): string {
        return htmlContent
            .replace(/<br\s*\/?>/gi, '\n') // Конвертируем <br> в переносы строк
            .replace(/<[^>]*>/g, '') // Убираем все HTML теги
            .replace(/&nbsp;/g, ' ') // Заменяем неразрывные пробелы
            .replace(/&amp;/g, '&') // Заменяем HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/[ \t]+/g, ' ') // Нормализуем пробелы и табы, но сохраняем переносы строк
            .replace(/\n\s+/g, '\n') // Убираем пробелы в начале строк
            .replace(/\s+\n/g, '\n') // Убираем пробелы в конце строк
            .replace(/\n{4,}/g, '\n\n\n') // Заменяем 4+ переносов на 3, сохраняя структуру подзаголовков
            .trim();
    }

    /**
     * Создает Markdown из данных о вакансии
     * @param vacancyData - данные о вакансии
     * @param pageUrl - URL страницы
     * @returns Markdown строка
     */
    private createMarkdown(vacancyData: VacancyData, pageUrl: string): string {
        let markdown = `# ${vacancyData.title}\n\n`;

        // Добавляем информацию о работодателе
        if (vacancyData.employerName) {
            if (vacancyData.employerUrl) {
                markdown += `**🏢 Работодатель:** [${vacancyData.employerName}](${vacancyData.employerUrl})\n\n`;
            } else {
                markdown += `**🏢 Работодатель:** ${vacancyData.employerName}\n\n`;
            }
        }

        // Добавляем основную информацию
        if (vacancyData.salary) {
            markdown += `**💰 Зарплата:** ${vacancyData.salary}\n\n`;
        }

        if (vacancyData.experience) {
            markdown += `**👨‍💼 Опыт работы:** ${vacancyData.experience}\n\n`;
        }

        if (vacancyData.employment) {
            markdown += `**📋 Занятость:** ${vacancyData.employment}\n\n`;
        }

        if (vacancyData.contractType) {
            markdown += `**📝 Оформление:** ${vacancyData.contractType}\n\n`;
        }

        if (vacancyData.schedule) {
            markdown += `**📅 График:** ${vacancyData.schedule}\n\n`;
        }

        if (vacancyData.workingHours) {
            markdown += `**⏰ Рабочие часы:** ${vacancyData.workingHours}\n\n`;
        }

        if (vacancyData.workFormat) {
            markdown += `**🏠 Формат работы:** ${vacancyData.workFormat}\n\n`;
        }

        // Добавляем ключевые навыки
        if (vacancyData.skills && vacancyData.skills.length > 0) {
            markdown += `## 🔧 Ключевые навыки\n\n`;
            vacancyData.skills.forEach(skill => {
                markdown += `- ${skill}\n`;
            });
            markdown += `\n`;
        }

        // Добавляем описание вакансии
        if (vacancyData.description) {
            markdown += `## 📝 Описание вакансии\n\n${vacancyData.description}\n\n`;
        }

        // Добавляем ссылку на оригинальную вакансию
        if (pageUrl && pageUrl.trim().length > 0) {
            markdown += `---\n\n[🔗 Открыть оригинальную вакансию](${pageUrl})`;
        }

        return markdown;
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
