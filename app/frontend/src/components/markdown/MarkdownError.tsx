import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

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
    const isServerError = error.includes('сервер') || error.includes('404') || error.includes('500');

    const getErrorIcon = () => {
        if (isNetworkError) {
            return <WifiOff className="h-4 w-4" />;
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
        if (isServerError) {
            return 'Ошибка сервера';
        }
        return 'Ошибка загрузки';
    };

    const getErrorDescription = () => {
        if (isNetworkError) {
            return 'Проверьте подключение к интернету и попробуйте снова.';
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
        return 'Попробовать снова';
    };

    return (
        <Alert variant="destructive" className="mb-4">
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
