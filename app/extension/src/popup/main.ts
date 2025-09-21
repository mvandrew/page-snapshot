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
 * @param type - тип сообщения (success, error, warning)
 * @param duration - длительность показа в миллисекундах (по умолчанию 3000)
 */
const showStatus = (message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 3000): void => {
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
 * Обработчик клика по кнопке создания снимка
 * Пока что заглушка - показывает уведомление о том, что функция в разработке
 */
const handleCaptureClick = async (): Promise<void> => {
  try {
    setButtonLoading(captureBtn, true);

    // Заглушка: имитируем процесс создания снимка
    await new Promise(resolve => setTimeout(resolve, 1500));

    showStatus('Функция создания снимка в разработке', 'warning');
  } catch (error) {
    console.error('Ошибка при создании снимка:', error);
    showStatus('Произошла ошибка при создании снимка', 'error');
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
