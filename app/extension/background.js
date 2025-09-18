// Service Worker для Chrome Extension Manifest V3

// Настройки по умолчанию
const defaultSettings = {
    domains: [],
    serviceUrl: '',
    serviceMethod: 'POST',
    serviceHeaders: '{}',
    saveInterval: 0,
    saveOnlyOnChange: true,
    enableNotifications: true,
    enableDebug: false,
    maxRetries: 3,
    autoCapture: false,
    captureFormat: 'png',
    quality: 0.9
};

// Переменные для автоматического сохранения
let saveIntervalId = null;
let lastPageContent = null;

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Page Snapshot extension installed:', details);

    // Инициализация настроек по умолчанию
    chrome.storage.sync.set(defaultSettings);

    // Настройка автоматического сохранения
    setupAutoSave();
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'capturePage':
            capturePage(sender.tab.id, request.options)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'savePageContent':
            savePageContent(sender.tab.id, request.content)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;

        case 'getSettings':
            chrome.storage.sync.get(Object.keys(defaultSettings), (result) => {
                sendResponse({ ...defaultSettings, ...result });
            });
            return true;

        case 'saveSettings':
            chrome.storage.sync.set(request.settings, () => {
                setupAutoSave(); // Перезапускаем автоматическое сохранение
                sendResponse({ success: true });
            });
            return true;

        case 'settingsUpdated':
            setupAutoSave(); // Перезапускаем при обновлении настроек
            sendResponse({ success: true });
            return true;

        case 'checkDomainMatch':
            checkDomainMatch(request.url)
                .then(match => sendResponse({ match }))
                .catch(error => sendResponse({ match: false, error: error.message }));
            return true;

        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Функция захвата страницы
async function capturePage(tabId, options = {}) {
    try {
        const { captureFormat = 'png', quality = 0.9 } = options;

        // Захват видимой области страницы
        const dataUrl = await chrome.tabs.captureVisibleTab({
            format: captureFormat,
            quality: quality
        });

        // Создание имени файла с временной меткой
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `page-snapshot-${timestamp}.${captureFormat}`;

        // Скачивание файла
        await chrome.downloads.download({
            url: dataUrl,
            filename: filename,
            saveAs: true
        });

        return {
            filename: filename,
            dataUrl: dataUrl,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error capturing page:', error);
        throw error;
    }
}

// Настройка автоматического сохранения
async function setupAutoSave() {
    // Очищаем предыдущий интервал
    if (saveIntervalId) {
        clearInterval(saveIntervalId);
        saveIntervalId = null;
    }

    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { saveInterval, enableDebug } = { ...defaultSettings, ...settings };

        if (saveInterval > 0) {
            saveIntervalId = setInterval(async () => {
                await performAutoSave();
            }, saveInterval * 1000);

            if (enableDebug) {
                console.log(`Auto-save enabled with interval: ${saveInterval}s`);
            }
        }
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

// Выполнение автоматического сохранения
async function performAutoSave() {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { domains, serviceUrl, saveOnlyOnChange, enableDebug } = { ...defaultSettings, ...settings };

        if (!serviceUrl) return; // Нет URL сервиса

        // Получаем активную вкладку
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;

        // Проверяем соответствие домену
        const domainMatch = await checkDomainMatch(tab.url, domains);
        if (!domainMatch) return;

        // Получаем содержимое страницы
        const pageContent = await getPageContent(tab.id);
        if (!pageContent) return;

        // Проверяем изменение содержимого
        if (saveOnlyOnChange && pageContent === lastPageContent) {
            if (enableDebug) {
                console.log('Page content unchanged, skipping save');
            }
            return;
        }

        // Сохраняем содержимое
        await savePageContent(tab.id, pageContent);
        lastPageContent = pageContent;

        if (enableDebug) {
            console.log('Auto-save completed');
        }

    } catch (error) {
        console.error('Error in auto-save:', error);
    }
}

// Проверка соответствия домену
async function checkDomainMatch(url, domains) {
    if (!domains || domains.length === 0) return true; // Нет ограничений

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        for (const domain of domains) {
            try {
                const regex = new RegExp(domain);
                if (regex.test(hostname) || regex.test(url)) {
                    return true;
                }
            } catch (e) {
                // Если не регулярное выражение, проверяем как обычную строку
                if (hostname.includes(domain) || url.includes(domain)) {
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
        return null;
    }
}

// Сохранение содержимого страницы на сервер
async function savePageContent(tabId, content) {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { serviceUrl, serviceMethod, serviceHeaders, maxRetries, enableNotifications } = { ...defaultSettings, ...settings };

        if (!serviceUrl) {
            throw new Error('Service URL not configured');
        }

        const headers = {
            'Content-Type': 'application/json',
            ...JSON.parse(serviceHeaders || '{}')
        };

        const payload = {
            content: content,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(serviceUrl, {
                    method: serviceMethod,
                    headers: headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                if (enableNotifications) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Page Snapshot',
                        message: 'Страница успешно сохранена'
                    });
                }

                return { success: true, attempt };

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
    if (changeInfo.status === 'complete' && tab.url) {
        // Сбрасываем кэш содержимого при обновлении страницы
        lastPageContent = null;

        // Проверяем, нужно ли сохранить страницу сразу
        checkAndSaveOnUpdate(tabId, tab.url);
    }
});

// Проверка и сохранение при обновлении страницы
async function checkAndSaveOnUpdate(tabId, url) {
    try {
        const settings = await chrome.storage.sync.get(Object.keys(defaultSettings));
        const { domains, serviceUrl, enableDebug } = { ...defaultSettings, ...settings };

        if (!serviceUrl) return;

        const domainMatch = await checkDomainMatch(url, domains);
        if (!domainMatch) return;

        // Небольшая задержка для полной загрузки страницы
        setTimeout(async () => {
            const pageContent = await getPageContent(tabId);
            if (pageContent) {
                await savePageContent(tabId, pageContent);
                lastPageContent = pageContent;
            }
        }, 2000);

    } catch (error) {
        console.error('Error in checkAndSaveOnUpdate:', error);
    }
}
