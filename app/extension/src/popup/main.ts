/**
 * Главный модуль popup интерфейса расширения Page Snapshot
 * Обеспечивает взаимодействие пользователя с расширением через popup окно
 */

// DOM элементы
const captureBtn = document.getElementById('capture-btn') as HTMLButtonElement | null;
const optionsBtn = document.getElementById('options-btn') as HTMLAnchorElement | null;
const statusDiv = document.getElementById('status') as HTMLDivElement | null;

// Проверка наличия необходимых DOM элементов
if (!captureBtn || !optionsBtn || !statusDiv) {
  throw new Error('Popup initialization failed: required DOM elements not found');
}

/**
 * Показывает статусное сообщение пользователю
 * @param message - текст сообщения
 * @param type - тип сообщения (success, error, warning, info)
 * @param duration - длительность показа в миллисекундах (по умолчанию 3000)
 */
const showStatus = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration: number = 3000): void => {
  if (!statusDiv) return;

  // Очищаем предыдущие классы
  statusDiv.className = 'status';

  // Добавляем соответствующий класс типа
  statusDiv.classList.add(`status-${type}`);
  statusDiv.classList.add('show');
  statusDiv.textContent = message;

  // Автоматически скрываем сообщение через указанное время
  setTimeout(() => {
    statusDiv.classList.remove('show');
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 300); // Время для анимации исчезновения
  }, duration);
};

/**
 * Устанавливает состояние загрузки для кнопки
 * @param button - кнопка для установки состояния
 * @param isLoading - состояние загрузки
 */
const setButtonLoading = (button: HTMLButtonElement, isLoading: boolean): void => {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
  }
};

/**
 * Интерфейс для данных снимка страницы
 */
interface SnapshotData {
  content: {
    html: string;
    url: string;
    title: string;
    timestamp: string;
  };
  userAgent: string;
}

/**
 * Получает полный DOM текущей активной страницы
 * @returns Promise с данными снимка страницы
 */
const capturePageSnapshot = async (): Promise<SnapshotData> => {
  try {
    // Получаем активную вкладку
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.id) {
      throw new Error('Не удалось получить активную вкладку');
    }

    // Проверяем, что это не chrome:// страница
    if (activeTab.url?.startsWith('chrome://') || activeTab.url?.startsWith('chrome-extension://')) {
      throw new Error('Невозможно создать снимок системных страниц Chrome');
    }

    // Внедряем контент-скрипт для получения DOM
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        return {
          html: document.documentElement.outerHTML,
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString()
        };
      }
    });

    if (!results || results.length === 0) {
      throw new Error('Не удалось получить данные страницы');
    }

    const pageData = results[0].result;

    return {
      content: {
        html: pageData.html,
        url: pageData.url,
        title: pageData.title,
        timestamp: pageData.timestamp
      },
      userAgent: navigator.userAgent
    };
  } catch (error) {
    console.error('Ошибка при создании снимка страницы:', error);
    throw error;
  }
};

/**
 * Отправляет снимок страницы на настроенный endpoint
 * @param snapshotData - данные снимка для отправки
 * @param endpointUrl - URL endpoint для отправки
 */
const sendSnapshotToServer = async (snapshotData: SnapshotData, endpointUrl: string): Promise<void> => {
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(snapshotData),
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Показываем уведомление об успехе
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Page Snapshot',
      message: 'Снимок страницы успешно отправлен на сервер'
    });

  } catch (error) {
    console.error('Ошибка при отправке снимка:', error);

    // Показываем уведомление об ошибке
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Page Snapshot - Ошибка',
      message: `Не удалось отправить снимок: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    });

    throw error;
  }
};

/**
 * Обработчик клика по кнопке создания снимка
 * Создает полный снимок текущей страницы и отправляет на настроенный endpoint
 */
const handleCaptureClick = async (): Promise<void> => {
  try {
    setButtonLoading(captureBtn, true);
    showStatus('Создание снимка страницы...', 'info');

    // Получаем настроенный endpoint URL
    const result = await chrome.storage.sync.get('endpointUrl');
    const endpointUrl = result.endpointUrl;

    if (!endpointUrl || typeof endpointUrl !== 'string' || endpointUrl.trim() === '') {
      throw new Error('Не настроен endpoint URL. Перейдите в настройки расширения.');
    }

    // Создаем снимок страницы
    const snapshotData = await capturePageSnapshot();

    showStatus('Отправка снимка на сервер...', 'info');

    // Отправляем снимок на сервер
    await sendSnapshotToServer(snapshotData, endpointUrl.trim());

    showStatus('Снимок успешно создан и отправлен!', 'success');

  } catch (error) {
    console.error('Ошибка при создании снимка:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    showStatus(`Ошибка: ${errorMessage}`, 'error', 5000);
  } finally {
    setButtonLoading(captureBtn, false);
  }
};

/**
 * Обработчик клика по кнопке настроек
 * Открывает страницу настроек расширения
 */
const handleOptionsClick = (event: Event): void => {
  event.preventDefault();

  try {
    // Открываем страницу настроек в новой вкладке
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });

    // Закрываем popup
    window.close();
  } catch (error) {
    console.error('Ошибка при открытии настроек:', error);
    showStatus('Не удалось открыть настройки', 'error');
  }
};

/**
 * Инициализация popup интерфейса
 * Настраивает обработчики событий и проверяет состояние расширения
 */
export const initializePopup = (): void => {
  console.log('Инициализация popup интерфейса Page Snapshot');

  // Настраиваем обработчики событий
  captureBtn.addEventListener('click', handleCaptureClick);
  optionsBtn.addEventListener('click', handleOptionsClick);

  // Проверяем, настроен ли endpoint URL
  checkEndpointConfiguration();

  console.log('Popup интерфейс успешно инициализирован');
};

/**
 * Проверяет, настроен ли endpoint URL для отправки снимков
 * Показывает предупреждение, если настройки не завершены
 */
const checkEndpointConfiguration = async (): Promise<void> => {
  try {
    const result = await chrome.storage.sync.get('endpointUrl');
    const endpointUrl = result.endpointUrl;

    if (!endpointUrl || typeof endpointUrl !== 'string' || endpointUrl.trim() === '') {
      showStatus('Сначала настройте endpoint URL в настройках', 'warning', 5000);
    }
  } catch (error) {
    console.error('Ошибка при проверке конфигурации:', error);
  }
};

// Инициализируем popup при загрузке
initializePopup();
