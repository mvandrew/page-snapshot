// Service Worker для Chrome Extension Manifest V3

// Обработка установки расширения
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Page Snapshot extension installed:', details);

    // Инициализация настроек по умолчанию
    chrome.storage.sync.set({
        autoCapture: false,
        captureFormat: 'png',
        quality: 0.9
    });
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'capturePage':
            capturePage(sender.tab.id, request.options)
                .then(result => sendResponse({ success: true, data: result }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Указывает, что ответ будет асинхронным

        case 'getSettings':
            chrome.storage.sync.get(['autoCapture', 'captureFormat', 'quality'], (result) => {
                sendResponse(result);
            });
            return true;

        case 'saveSettings':
            chrome.storage.sync.set(request.settings, () => {
                sendResponse({ success: true });
            });
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

// Обработка обновления вкладки
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Можно добавить логику для автоматического захвата
        console.log('Tab updated:', tab.url);
    }
});
