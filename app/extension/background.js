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
    saveInterval: 0,
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9,
    lastChecksum: null
};

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

// Универсальная функция загрузки настроек с восстановлением
async function loadSettingsWithFallback() {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));

        // Если настройки пустые, пытаемся восстановить из резервной копии
        if (!settings || Object.keys(settings).length === 0) {
            console.log('Page Snapshot: No settings found, trying to restore from backup');
            const restored = await restoreSettingsFromBackup();
            if (restored) {
                console.log('Page Snapshot: Settings restored from backup');
                // Повторно получаем настройки после восстановления
                const restoredSettings = await chrome.storage.sync.get(Object.keys(defaultSettings));
                return { ...defaultSettings, ...restoredSettings };
            }
        }

        const mergedSettings = { ...defaultSettings, ...settings };

        // Нормализуем домены
        if (mergedSettings.domains) {
            mergedSettings.domains = normalizeDomains(mergedSettings.domains);
        }

        return mergedSettings;
    } catch (error) {
        console.error('Page Snapshot: Error loading settings:', error);
        return defaultSettings;
    }
}

// Переменные для автоматического сохранения
let saveIntervalId = null;
let lastPageContent = null;
let lastChecksum = null;

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
    // Используем async/await для современного подхода
    (async () => {
        try {
            let result;

            switch (request.action) {
                case 'savePageContent':
                    if (!sender.tab || !sender.tab.id) {
                        sendResponse({ error: 'Invalid tab information' });
                        return;
                    }
                    result = await savePageContent(sender.tab.id, request.content);
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
                        // Нормализуем домены перед сохранением
                        const normalizedSettings = { ...request.settings };
                        if (normalizedSettings.domains) {
                            normalizedSettings.domains = normalizeDomains(normalizedSettings.domains);
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
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
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
        const { saveInterval, enableDebug, domains, serviceUrl } = settings;

        // Отладочная информация
        console.log('Page Snapshot: Setup auto-save:', {
            saveInterval: saveInterval,
            domains: domains,
            serviceUrl: serviceUrl,
            isConfigured: isExtensionConfigured(domains, serviceUrl),
            rawSettings: settings
        });

        if (saveInterval > 0) {
            saveIntervalId = setInterval(async () => {
                await performAutoSave();
            }, saveInterval * 1000);

            console.log(`Page Snapshot: Auto-save enabled with interval: ${saveInterval}s`);
        } else {
            console.log('Page Snapshot: Auto-save disabled (interval = 0)');
        }
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

// Выполнение автоматического сохранения
async function performAutoSave() {
    try {
        const settings = await loadSettingsWithFallback();
        const { domains, serviceUrl, saveOnlyOnChange, enableDebug } = settings;

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
        const settings = await loadSettingsWithFallback();
        const { domains, serviceUrl, maxRetries, enableNotifications, enableDebug } = settings;

        // Отладочная информация
        if (enableDebug) {
            console.log('Page Snapshot: Save page content:', {
                domains: domains,
                serviceUrl: serviceUrl,
                isConfigured: isExtensionConfigured(domains, serviceUrl)
            });
        }

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

        const headers = {
            'Content-Type': 'application/json'
        };

        const payload = {
            content: content,
            userAgent: navigator.userAgent
        };

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

        if (enableNotifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Page Snapshot',
                message: 'Ошибка сохранения: ' + error.message
            });
        }

        throw error;
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
        const { domains, serviceUrl, saveOnlyOnChange, enableDebug } = settings;

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
