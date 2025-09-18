// Service Worker для Chrome Extension Manifest V3

// Глобальная обработка ошибок
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

// Настройки по умолчанию
const defaultSettings = {
    domains: [],
    serviceUrl: '',
    enableAutoSave: true,
    saveInterval: 10, // Минимальная задержка 10 секунд по умолчанию
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9,
    lastChecksum: null
};

// Константы для ограничений интервала
const MIN_SAVE_INTERVAL_SECONDS = 5; // Минимальная задержка 5 секунд
const MAX_SAVE_INTERVAL_SECONDS = 60; // Максимальная задержка 60 секунд

// Версия настроек для миграции
const SETTINGS_VERSION = '1.0.0';

// Функция миграции настроек
async function migrateSettings() {
    try {
        // Получаем текущие настройки
        const existingSettings = await chrome.storage.sync.get(null);

        // Проверяем версию настроек
        if (existingSettings.settingsVersion !== SETTINGS_VERSION) {
            console.log('Page Snapshot: Migrating settings from version', existingSettings.settingsVersion || 'unknown', 'to', SETTINGS_VERSION);

            // Создаем резервную копию существующих настроек
            const backupSettings = { ...existingSettings };
            backupSettings.backupDate = new Date().toISOString();
            await chrome.storage.local.set({ settingsBackup: backupSettings });

            // Создаем объект с настройками по умолчанию
            const migratedSettings = { ...defaultSettings };

            // Переносим существующие настройки, если они есть
            for (const [key, value] of Object.entries(existingSettings)) {
                if (key in defaultSettings && value !== undefined) {
                    migratedSettings[key] = value;
                }
            }

            // Нормализуем настройки после миграции
            if (migratedSettings.domains) {
                migratedSettings.domains = normalizeDomains(migratedSettings.domains);
            }

            if (migratedSettings.saveInterval !== undefined) {
                const originalInterval = migratedSettings.saveInterval;
                migratedSettings.saveInterval = normalizeSaveInterval(migratedSettings.saveInterval);

                if (originalInterval !== migratedSettings.saveInterval) {
                    console.log('Page Snapshot: Save interval normalized during migration:', {
                        original: originalInterval,
                        normalized: migratedSettings.saveInterval,
                        min: MIN_SAVE_INTERVAL_SECONDS,
                        max: MAX_SAVE_INTERVAL_SECONDS
                    });
                }
            }

            // Добавляем версию настроек
            migratedSettings.settingsVersion = SETTINGS_VERSION;

            // Сохраняем мигрированные настройки
            await chrome.storage.sync.set(migratedSettings);

            console.log('Page Snapshot: Settings migrated successfully');
            console.log('Page Snapshot: Backup saved to chrome.storage.local');
        } else {
            console.log('Page Snapshot: Settings are up to date');
        }
    } catch (error) {
        console.error('Page Snapshot: Error migrating settings:', error);
    }
}

// Функция восстановления настроек из резервной копии
async function restoreSettingsFromBackup() {
    try {
        const backup = await chrome.storage.local.get(['settingsBackup']);
        if (backup.settingsBackup) {
            console.log('Page Snapshot: Restoring settings from backup');
            await chrome.storage.sync.set(backup.settingsBackup);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Page Snapshot: Error restoring settings from backup:', error);
        return false;
    }
}

// Функция нормализации доменов
function normalizeDomains(domains) {
    if (!domains || !Array.isArray(domains)) {
        return [];
    }

    return domains.map(domain => {
        if (typeof domain !== 'string') {
            return domain;
        }

        // Убираем протокол если он есть
        let cleanDomain = domain;
        if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
            cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
        }

        // Убираем экранированные точки
        cleanDomain = cleanDomain.replace(/\\\./g, '.');

        // Убираем слеш в конце
        cleanDomain = cleanDomain.replace(/\/$/, '');

        return cleanDomain;
    }).filter(domain => domain && domain.trim() !== '');
}

// Функция нормализации интервала сохранения
function normalizeSaveInterval(interval) {
    // Преобразуем в число
    const numInterval = parseInt(interval, 10);

    // Если не число или меньше 0, возвращаем минимальное значение
    if (isNaN(numInterval) || numInterval < 0) {
        return MIN_SAVE_INTERVAL_SECONDS;
    }

    // Если 0, отключаем автоматическое сохранение
    if (numInterval === 0) {
        return 0;
    }

    // Ограничиваем минимальным и максимальным значением
    return Math.max(MIN_SAVE_INTERVAL_SECONDS, Math.min(MAX_SAVE_INTERVAL_SECONDS, numInterval));
}

// Универсальная функция загрузки настроек с восстановлением
async function loadSettingsWithFallback() {
    try {
        console.log('Page Snapshot: Loading settings from chrome.storage.sync');
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        console.log('Page Snapshot: Raw settings from storage:', settings);

        // Если настройки пустые, пытаемся восстановить из резервной копии
        if (!settings || Object.keys(settings).length === 0) {
            console.log('Page Snapshot: No settings found, trying to restore from backup');
            const restored = await restoreSettingsFromBackup();
            if (restored) {
                console.log('Page Snapshot: Settings restored from backup');
                // Повторно получаем настройки после восстановления
                const restoredSettings = await chrome.storage.sync.get(Object.keys(defaultSettings));
                console.log('Page Snapshot: Restored settings:', restoredSettings);
                return ensureAllSettingsFields({ ...defaultSettings, ...restoredSettings });
            }
        }

        // Принудительно добавляем все поля из defaultSettings
        const mergedSettings = ensureAllSettingsFields({ ...defaultSettings, ...settings });
        console.log('Page Snapshot: Merged settings:', mergedSettings);

        // Нормализуем домены
        if (mergedSettings.domains) {
            mergedSettings.domains = normalizeDomains(mergedSettings.domains);
        }

        // Нормализуем интервал сохранения
        if (mergedSettings.saveInterval !== undefined) {
            const originalInterval = mergedSettings.saveInterval;
            mergedSettings.saveInterval = normalizeSaveInterval(mergedSettings.saveInterval);

            if (originalInterval !== mergedSettings.saveInterval) {
                console.log('Page Snapshot: Save interval normalized:', {
                    original: originalInterval,
                    normalized: mergedSettings.saveInterval,
                    min: MIN_SAVE_INTERVAL_SECONDS,
                    max: MAX_SAVE_INTERVAL_SECONDS
                });
            }
        }

        return mergedSettings;
    } catch (error) {
        console.error('Page Snapshot: Error loading settings:', error);
        console.error('Page Snapshot: Error stack:', error.stack);
        console.log('Page Snapshot: Returning default settings due to error');
        return { ...defaultSettings };
    }
}

// Функция для гарантированного наличия всех полей настроек
function ensureAllSettingsFields(settings) {
    const ensuredSettings = { ...defaultSettings };

    // Копируем только существующие поля из переданных настроек
    for (const [key, value] of Object.entries(settings)) {
        if (key in defaultSettings && value !== undefined) {
            ensuredSettings[key] = value;
        }
    }

    // Логируем отсутствующие поля
    const missingFields = [];
    for (const key of Object.keys(defaultSettings)) {
        if (!(key in settings) || settings[key] === undefined) {
            missingFields.push(key);
        }
    }

    if (missingFields.length > 0) {
        console.log('Page Snapshot: Missing fields, using defaults:', missingFields);
    }

    return ensuredSettings;
}

// Функция обработки HTML-контента для уменьшения размера
function processHtmlContent(content) {
    if (!content || !content.html) {
        return content;
    }

    let processedHtml = content.html;

    try {
        // 1. Удаляем лишние пробелы и переносы строк
        processedHtml = processedHtml.replace(/\s+/g, ' ');

        // 2. Удаляем комментарии HTML
        processedHtml = processedHtml.replace(/<!--[\s\S]*?-->/g, '');

        // 3. Удаляем лишние атрибуты (оставляем только важные)
        processedHtml = processedHtml.replace(/\s+(style|class|id|href|src|alt|title)="[^"]*"/g, '');

        // 4. Удаляем пустые теги
        processedHtml = processedHtml.replace(/<(\w+)[^>]*>\s*<\/\1>/g, '');

        // 5. Сжимаем JavaScript и CSS
        processedHtml = processedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
            // Оставляем только внешние скрипты
            if (match.includes('src=')) {
                return match;
            }
            // Удаляем встроенные скрипты
            return '';
        });

        processedHtml = processedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

        // 6. Ограничиваем размер HTML (максимум 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (processedHtml.length > maxSize) {
            console.warn(`Page Snapshot: HTML too large (${processedHtml.length} bytes), truncating to ${maxSize} bytes`);
            processedHtml = processedHtml.substring(0, maxSize) + '... [TRUNCATED]';
        }

        console.log('Page Snapshot: HTML processed:', {
            originalSize: content.html.length,
            processedSize: processedHtml.length,
            reduction: content.html.length - processedHtml.length,
            reductionPercent: ((content.html.length - processedHtml.length) / content.html.length * 100).toFixed(1) + '%'
        });

    } catch (error) {
        console.error('Page Snapshot: Error processing HTML:', error);
        // В случае ошибки возвращаем оригинальный контент
        return content;
    }

    return {
        ...content,
        html: processedHtml
    };
}

// Переменные для автоматического сохранения
let saveIntervalId = null;
let lastPageContent = null;
let lastChecksum = null;

// Переменные для защиты от частых запросов
let isSaving = false;
let lastSaveTime = 0;
const MIN_SAVE_INTERVAL = 2000; // Минимальный интервал между сохранениями (2 секунды)

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Page Snapshot extension installed:', details);

    // Инициализация настроек по умолчанию только при первой установке
    if (details.reason === 'install') {
        chrome.storage.sync.set(defaultSettings, () => {
            if (chrome.runtime.lastError) {
                console.error('Error setting default settings:', chrome.runtime.lastError);
            } else {
                console.log('Default settings initialized');
            }
        });
    } else if (details.reason === 'update') {
        console.log('Extension updated, migrating settings');

        // При обновлении мигрируем настройки
        migrateSettings();
    }

    // Настройка автоматического сохранения
    setupAutoSave();
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Page Snapshot: Message received:', {
        action: request.action,
        sender: sender.tab ? { tabId: sender.tab.id, url: sender.tab.url } : 'no tab',
        hasContent: !!request.content
    });

    // Используем async/await для современного подхода
    (async () => {
        try {
            let result;

            switch (request.action) {
                case 'savePageContent':
                    console.log('Page Snapshot: Processing savePageContent message');

                    // Получаем tabId из sender или из активной вкладки
                    let tabId = null;
                    if (sender.tab && sender.tab.id) {
                        tabId = sender.tab.id;
                        console.log('Page Snapshot: Using sender tabId:', tabId);
                    } else {
                        console.log('Page Snapshot: No sender tab, getting active tab');
                        // Если tabId не доступен, получаем активную вкладку
                        try {
                            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                            if (tab && tab.id) {
                                tabId = tab.id;
                                console.log('Page Snapshot: Got active tabId:', tabId);
                            }
                        } catch (error) {
                            console.error('Error getting active tab:', error);
                        }
                    }

                    if (!tabId) {
                        console.error('Page Snapshot: No valid tabId found');
                        sendResponse({ error: 'Invalid tab information' });
                        return;
                    }

                    console.log('Page Snapshot: About to call savePageContent with tabId:', tabId);
                    result = await savePageContent(tabId, request.content);
                    console.log('Page Snapshot: savePageContent completed:', result);
                    sendResponse({ success: true, data: result });
                    break;

                case 'getSettings':
                    try {
                        const settings = await loadSettingsWithFallback();

                        // Отладочная информация
                        if (settings.enableDebug) {
                            console.log('Page Snapshot: Getting settings:', settings);
                        }

                        sendResponse(settings);
                    } catch (error) {
                        console.error('Error getting settings:', error);
                        sendResponse({ ...defaultSettings });
                    }
                    break;

                case 'saveSettings':
                    try {
                        // Нормализуем настройки перед сохранением
                        const normalizedSettings = { ...request.settings };

                        // Нормализуем домены
                        if (normalizedSettings.domains) {
                            normalizedSettings.domains = normalizeDomains(normalizedSettings.domains);
                        }

                        // Нормализуем интервал сохранения
                        if (normalizedSettings.saveInterval !== undefined) {
                            const originalInterval = normalizedSettings.saveInterval;
                            normalizedSettings.saveInterval = normalizeSaveInterval(normalizedSettings.saveInterval);

                            if (originalInterval !== normalizedSettings.saveInterval) {
                                console.log('Page Snapshot: Save interval normalized on save:', {
                                    original: originalInterval,
                                    normalized: normalizedSettings.saveInterval,
                                    min: MIN_SAVE_INTERVAL_SECONDS,
                                    max: MAX_SAVE_INTERVAL_SECONDS
                                });
                            }
                        }

                        await chrome.storage.sync.set(normalizedSettings);
                        setupAutoSave(); // Перезапускаем автоматическое сохранение
                        sendResponse({ success: true });
                    } catch (error) {
                        console.error('Error saving settings:', error);
                        sendResponse({ error: 'Failed to save settings' });
                    }
                    break;

                case 'settingsUpdated':
                    setupAutoSave(); // Перезапускаем при обновлении настроек
                    sendResponse({ success: true });
                    break;

                case 'checkDomainMatch':
                    try {
                        const match = await checkDomainMatch(request.url);
                        sendResponse({ match });
                    } catch (error) {
                        console.error('Error checking domain match:', error);
                        sendResponse({ match: false });
                    }
                    break;

                default:
                    console.log('Page Snapshot: Unknown action:', request.action);
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Page Snapshot: Error handling message:', error);
            console.error('Page Snapshot: Error stack:', error.stack);
            sendResponse({ error: error.message });
        }
    })();

    // Возвращаем true для асинхронного ответа (все еще требуется в Manifest V3)
    return true;
});

// Функция захвата страницы удалена - теперь только автоматическое сохранение содержимого

// Настройка автоматического сохранения
async function setupAutoSave() {
    console.log('Page Snapshot: Setting up auto-save...');

    // Очищаем предыдущий интервал
    if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = null;
    }

    try {
        const settings = await loadSettingsWithFallback();
        const {
            enableAutoSave = true,
            saveInterval = 0,
            enableDebug = false,
            domains = [],
            serviceUrl = ''
        } = settings;

        // Отладочная информация
        console.log('Page Snapshot: Setup auto-save:', {
            enableAutoSave: enableAutoSave,
            saveInterval: saveInterval,
            domains: domains,
            serviceUrl: serviceUrl,
            isConfigured: isExtensionConfigured(domains, serviceUrl),
            minInterval: MIN_SAVE_INTERVAL_SECONDS,
            maxInterval: MAX_SAVE_INTERVAL_SECONDS,
            rawSettings: settings
        });

        if (enableAutoSave && saveInterval > 0) {
            saveIntervalId = setInterval(async () => {
                await performAutoSave();
            }, saveInterval * 1000);

            console.log(`Page Snapshot: Auto-save enabled with interval: ${saveInterval}s (min: ${MIN_SAVE_INTERVAL_SECONDS}s, max: ${MAX_SAVE_INTERVAL_SECONDS}s)`);
        } else {
            console.log('Page Snapshot: Auto-save disabled', {
                enableAutoSave: enableAutoSave,
                saveInterval: saveInterval
            });
        }
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

// Выполнение автоматического сохранения
async function performAutoSave() {
    try {
        const settings = await loadSettingsWithFallback();
        const {
            domains = [],
            serviceUrl = '',
            saveOnlyOnChange = true,
            enableDebug = false
        } = settings;

        // Отладочная информация
        if (enableDebug) {
            console.log('Page Snapshot: Current settings:', {
                domains: domains,
                serviceUrl: serviceUrl,
                saveOnlyOnChange: saveOnlyOnChange
            });
        }

        // Проверяем обязательные настройки
        if (!isExtensionConfigured(domains, serviceUrl)) {
            if (enableDebug) {
                console.log('Page Snapshot: Extension not configured:', {
                    domains: domains,
                    serviceUrl: serviceUrl,
                    domainsLength: domains ? domains.length : 'undefined',
                    serviceUrlLength: serviceUrl ? serviceUrl.length : 'undefined'
                });
            }
            return;
        }

        // Получаем активную вкладку
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;

        // Проверяем соответствие домену
        const domainMatch = await checkDomainMatch(tab.url, domains);
        if (!domainMatch) return;

        // Получаем содержимое страницы
        const pageContent = await getPageContent(tab.id);
        if (!pageContent) return;

        // Вычисляем контрольную сумму для проверки изменений
        const currentChecksum = await calculateChecksumSync(pageContent);

        // Проверяем изменение содержимого по контрольной сумме
        if (saveOnlyOnChange && currentChecksum === lastChecksum) {
            if (enableDebug) {
                console.log('Page content unchanged (checksum match), skipping save');
            }
            return;
        }

        // Сохраняем содержимое
        const result = await savePageContent(tab.id, pageContent);

        // Обновляем кэш только при успешном сохранении
        if (result && result.success) {
            lastPageContent = pageContent;
            lastChecksum = currentChecksum;
        } else if (result && result.error) {
            // Логируем причину пропуска сохранения
            if (enableDebug) {
                console.log('Page Snapshot: Save skipped:', result.error);
            }
        }

        if (enableDebug) {
            console.log('Auto-save completed');
        }

    } catch (error) {
        console.error('Error in auto-save:', error);
    }
}

// Вычисление контрольной суммы по алгоритму backend
function calculateChecksum(pageContent) {
    // Создаем строку для хэширования из всех важных данных (как в backend)
    const dataToHash = JSON.stringify({
        html: pageContent.html,
        url: pageContent.url
    });

    // Вычисляем SHA-256 хэш (используем Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);

    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

// Синхронная версия для использования в условиях
async function calculateChecksumSync(pageContent) {
    const dataToHash = JSON.stringify({
        html: pageContent.html,
        url: pageContent.url
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Проверка конфигурации расширения
function isExtensionConfigured(domains, serviceUrl) {
    // Проверяем, что задан хотя бы один домен
    if (!domains || domains.length === 0) {
        return false;
    }

    // Проверяем, что задан URL сервиса
    if (!serviceUrl || serviceUrl.trim() === '') {
        return false;
    }

    return true;
}

// Проверка соответствия домену
async function checkDomainMatch(url, domains) {
    if (!domains || domains.length === 0) {
        console.log('Page Snapshot: No domains configured for matching');
        return false; // Должны быть заданы домены
    }

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        console.log('Page Snapshot: Checking domain match:', {
            url: url,
            hostname: hostname,
            domains: domains
        });

        for (const domain of domains) {
            console.log('Page Snapshot: Testing domain pattern:', domain);

            try {
                // Сначала пробуем как регулярное выражение
                const regex = new RegExp(domain);
                if (regex.test(hostname) || regex.test(url)) {
                    console.log('Page Snapshot: Domain match found (regex):', domain);
                    return true;
                }
            } catch (e) {
                console.log('Page Snapshot: Not a valid regex, trying as string:', domain);

                // Если не регулярное выражение, проверяем как обычную строку
                // Убираем протокол из домена если он есть
                let cleanDomain = domain;
                if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
                    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
                }

                // Убираем экранированные точки
                cleanDomain = cleanDomain.replace(/\\\./g, '.');

                console.log('Page Snapshot: Cleaned domain:', cleanDomain);

                if (hostname === cleanDomain || hostname.endsWith('.' + cleanDomain) ||
                    hostname.includes(cleanDomain) || url.includes(cleanDomain)) {
                    console.log('Page Snapshot: Domain match found (string):', cleanDomain);
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking domain match:', error);
        return false;
    }
}

// Получение содержимого страницы
async function getPageContent(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
                return {
                    html: document.documentElement.outerHTML,
                    url: window.location.href,
                    title: document.title,
                    timestamp: new Date().toISOString()
                };
            }
        });

        return results[0]?.result || null;
    } catch (error) {
        console.error('Error getting page content:', error);
        // Возвращаем базовую информацию о странице при ошибке
        try {
            const tab = await chrome.tabs.get(tabId);
            return {
                html: '<html>Content not available</html>',
                url: tab.url,
                title: tab.title,
                timestamp: new Date().toISOString()
            };
        } catch (tabError) {
            console.error('Error getting tab info:', tabError);
            return null;
        }
    }
}

// Сохранение содержимого страницы на сервер
async function savePageContent(tabId, content) {
    try {
        console.log('Page Snapshot: savePageContent called with tabId:', tabId);
        console.log('Page Snapshot: Content received:', {
            hasHtml: !!content?.html,
            hasUrl: !!content?.url,
            htmlLength: content?.html?.length || 0
        });

        // Защита от одновременных запросов
        if (isSaving) {
            console.log('Page Snapshot: Save already in progress, skipping');
            return { success: false, error: 'Save already in progress' };
        }

        // Проверяем минимальный интервал между сохранениями
        const now = Date.now();
        if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
            console.log('Page Snapshot: Too soon to save, skipping');
            return { success: false, error: 'Too soon to save' };
        }

        // Устанавливаем флаг сохранения
        isSaving = true;
        lastSaveTime = now;

        const settings = await loadSettingsWithFallback();
        console.log('Page Snapshot: Settings loaded in savePageContent:', settings);

        // Принудительно проверяем наличие всех полей
        const safeSettings = ensureAllSettingsFields(settings);
        console.log('Page Snapshot: Safe settings for savePageContent:', safeSettings);

        const {
            domains,
            serviceUrl,
            maxRetries,
            enableNotifications,
            enableDebug
        } = safeSettings;

        console.log('Page Snapshot: Destructured settings:', {
            domains,
            serviceUrl,
            maxRetries,
            enableNotifications,
            enableDebug
        });

        // Отладочная информация
        console.log('Page Snapshot: Save page content settings:', {
            domains: domains,
            serviceUrl: serviceUrl,
            maxRetries: maxRetries,
            enableNotifications: enableNotifications,
            enableDebug: enableDebug,
            isConfigured: isExtensionConfigured(domains, serviceUrl),
            rawSettings: settings
        });

        // Проверяем конфигурацию перед сохранением
        if (!isExtensionConfigured(domains, serviceUrl)) {
            if (enableDebug) {
                console.log('Page Snapshot: Extension not configured for save:', {
                    domains: domains,
                    serviceUrl: serviceUrl,
                    domainsLength: domains ? domains.length : 'undefined',
                    serviceUrlLength: serviceUrl ? serviceUrl.length : 'undefined'
                });
            }
            throw new Error('Extension not configured: missing domains or service URL');
        }

        // Обрабатываем HTML-контент для уменьшения размера
        const processedContent = processHtmlContent(content);
        console.log('Page Snapshot: Content size info:', {
            originalHtmlLength: content.html?.length || 0,
            processedHtmlLength: processedContent.html?.length || 0,
            compressionRatio: content.html?.length ? (processedContent.html.length / content.html.length * 100).toFixed(1) + '%' : 'N/A'
        });

        const headers = {
            'Content-Type': 'application/json'
        };

        const payload = {
            content: processedContent,
            userAgent: navigator.userAgent
        };

        // Проверяем размер payload
        const payloadSize = JSON.stringify(payload).length;
        const maxPayloadSize = 10 * 1024 * 1024; // 10MB

        console.log('Page Snapshot: Payload size:', {
            size: payloadSize,
            sizeMB: (payloadSize / 1024 / 1024).toFixed(2) + ' MB',
            maxSizeMB: (maxPayloadSize / 1024 / 1024).toFixed(2) + ' MB'
        });

        if (payloadSize > maxPayloadSize) {
            throw new Error(`Payload too large: ${(payloadSize / 1024 / 1024).toFixed(2)}MB (max: ${(maxPayloadSize / 1024 / 1024).toFixed(2)}MB)`);
        }

        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(serviceUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                // Парсим ответ от backend
                const responseData = await response.json();

                if (enableDebug) {
                    console.log('Backend response:', responseData);
                }

                // Проверяем успешность операции
                if (responseData.success) {
                    if (enableNotifications) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon48.png',
                            title: 'Page Snapshot',
                            message: 'Страница успешно сохранена'
                        });
                    }

                    return {
                        success: true,
                        attempt,
                        checksum: responseData.data?.checksum,
                        id: responseData.data?.id
                    };
                } else {
                    throw new Error(responseData.message || 'Unknown backend error');
                }

            } catch (error) {
                lastError = error;
                console.error(`Save attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    // Ждем перед следующей попыткой
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        throw lastError;

    } catch (error) {
        console.error('Error saving page content:', error);

        // Получаем настройки для уведомлений в случае ошибки
        try {
            const settings = await loadSettingsWithFallback();
            const safeSettings = ensureAllSettingsFields(settings);

            if (safeSettings.enableNotifications) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Page Snapshot',
                    message: 'Ошибка сохранения: ' + error.message
                });
            }
        } catch (notificationError) {
            console.error('Error showing notification:', notificationError);
        }

        throw error;
    } finally {
        // Сбрасываем флаг сохранения в любом случае
        isSaving = false;
    }
}

// Обработка обновления вкладки
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab.url) {
            // Сбрасываем кэш содержимого и контрольной суммы при обновлении страницы
            lastPageContent = null;
            lastChecksum = null;

            // Проверяем, нужно ли сохранить страницу сразу
            checkAndSaveOnUpdate(tabId, tab.url);
        }
    } catch (error) {
        console.error('Error in tab update handler:', error);
    }
});

// Обработка запуска расширения
chrome.runtime.onStartup.addListener(async () => {
    console.log('Page Snapshot: Extension started');

    // Миграция настроек при запуске
    await migrateSettings();

    // Настройка автоматического сохранения при запуске
    setupAutoSave();
});

// Обработка приостановки расширения
chrome.runtime.onSuspend.addListener(() => {
    console.log('Page Snapshot: Extension suspended');

    // Очищаем интервал при приостановке
    if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = null;
    }
});

// Проверка и сохранение при обновлении страницы
async function checkAndSaveOnUpdate(tabId, url) {
    try {
        const settings = await loadSettingsWithFallback();
        const {
            domains = [],
            serviceUrl = '',
            saveOnlyOnChange = true,
            enableDebug = false
        } = settings;

        // Отладочная информация
        if (enableDebug) {
            console.log('Page Snapshot: Check and save on update:', {
                url: url,
                domains: domains,
                serviceUrl: serviceUrl,
                isConfigured: isExtensionConfigured(domains, serviceUrl)
            });
        }

        // Проверяем конфигурацию
        if (!isExtensionConfigured(domains, serviceUrl)) {
            if (enableDebug) {
                console.log('Page Snapshot: Extension not configured:', {
                    domains: domains,
                    serviceUrl: serviceUrl,
                    domainsLength: domains ? domains.length : 'undefined',
                    serviceUrlLength: serviceUrl ? serviceUrl.length : 'undefined'
                });
            }
            return;
        }

        const domainMatch = await checkDomainMatch(url, domains);
        if (!domainMatch) return;

        // Небольшая задержка для полной загрузки страницы
        setTimeout(async () => {
            const pageContent = await getPageContent(tabId);
            if (pageContent) {
                // Вычисляем контрольную сумму для проверки изменений
                const currentChecksum = await calculateChecksumSync(pageContent);

                // Проверяем изменение содержимого по контрольной сумме
                if (saveOnlyOnChange && currentChecksum === lastChecksum) {
                    if (enableDebug) {
                        console.log('Page content unchanged (checksum match), skipping save on update');
                    }
                    return;
                }

                const result = await savePageContent(tabId, pageContent);

                // Обновляем кэш только при успешном сохранении
                if (result && result.success) {
                    lastPageContent = pageContent;
                    lastChecksum = currentChecksum;
                }
            }
        }, 2000);

    } catch (error) {
        console.error('Error in checkAndSaveOnUpdate:', error);
    }
}
