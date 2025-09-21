import { ThemeToggle } from '../theme-toggle';
import { Button } from '../ui/button';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface HeaderProps {
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

/**
 * Компонент шапки приложения
 */
export function Header({ onRefresh, isRefreshing = false }: HeaderProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [isServerOnline, setIsServerOnline] = useState(false);

    // Проверяем статус сервера
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const status = await apiService.checkHealth();
                setIsServerOnline(status);
            } catch (error) {
                setIsServerOnline(false);
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 60000); // Проверяем каждые 60 секунд

        return () => clearInterval(interval);
    }, []);

    // Отслеживаем онлайн статус браузера
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Логотип и название */}
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-primary">
                            Page Snapshot
                        </h1>

                        {/* Индикаторы статуса */}
                        <div className="flex items-center space-x-2">
                            {/* Статус интернета */}
                            <div className="flex items-center space-x-1">
                                {isOnline ? (
                                    <Wifi className="h-4 w-4 text-green-500" />
                                ) : (
                                    <WifiOff className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {isOnline ? 'Онлайн' : 'Офлайн'}
                                </span>
                            </div>

                            {/* Статус сервера */}
                            <div className="flex items-center space-x-1">
                                <div
                                    className={`h-2 w-2 rounded-full ${isServerOnline ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {isServerOnline ? 'Сервер' : 'Нет связи'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Действия */}
                    <div className="flex items-center space-x-2">
                        {/* Кнопка обновления */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isRefreshing || !isOnline || !isServerOnline}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            <span>Обновить</span>
                        </Button>

                        {/* Переключатель темы */}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
