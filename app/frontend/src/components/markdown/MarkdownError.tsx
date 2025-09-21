import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, FileText } from 'lucide-react';

interface MarkdownErrorProps {
    error: string;
    onRetry: () => void;
    isRetrying?: boolean;
}

/**
 * Компонент для отображения ошибок markdown
 */
export function MarkdownError({ error, onRetry, isRetrying = false }: MarkdownErrorProps) {
    const isNetworkError = error.includes('сеть') || error.includes('подключение');
    const isNoDataError = error.includes('Нет данных для конвертации') || error.includes('HTML файл не найден');
    const isServerError = error.includes('сервер') || error.includes('500');

    const getErrorIcon = () => {
        if (isNetworkError) {
            return <WifiOff className="h-4 w-4" />;
        }
        if (isNoDataError) {
            return <FileText className="h-4 w-4" />;
        }
        if (isServerError) {
            return <AlertTriangle className="h-4 w-4" />;
        }
        return <AlertTriangle className="h-4 w-4" />;
    };

    const getErrorTitle = () => {
        if (isNetworkError) {
            return 'Ошибка сети';
        }
        if (isNoDataError) {
            return 'Нет данных';
        }
        if (isServerError) {
            return 'Ошибка сервера';
        }
        return 'Ошибка загрузки';
    };

    const getErrorDescription = () => {
        if (isNetworkError) {
            return 'Проверьте подключение к интернету и попробуйте снова.';
        }
        if (isNoDataError) {
            return 'Chrome расширение не сохранило HTML файл для конвертации. Убедитесь, что расширение активно и попробуйте снова.';
        }
        if (isServerError) {
            return 'Сервер временно недоступен. Попробуйте обновить страницу через несколько минут.';
        }
        return error;
    };

    const getRetryButtonText = () => {
        if (isRetrying) {
            return 'Повторяем...';
        }
        if (isNetworkError) {
            return 'Проверить соединение';
        }
        if (isNoDataError) {
            return 'Обновить данные';
        }
        return 'Попробовать снова';
    };

    return (
        <Alert variant={isNoDataError ? "default" : "destructive"} className="mb-4">
            {getErrorIcon()}
            <AlertTitle>{getErrorTitle()}</AlertTitle>
            <AlertDescription className="mt-2">
                {getErrorDescription()}
            </AlertDescription>
            <div className="mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                    {getRetryButtonText()}
                </Button>
            </div>
        </Alert>
    );
}
