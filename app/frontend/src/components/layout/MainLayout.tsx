import { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
    children: ReactNode;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

/**
 * Основной макет приложения
 */
export function MainLayout({
    children,
    onRefresh,
    isRefreshing = false
}: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <Header onRefresh={onRefresh} isRefreshing={isRefreshing} />

            <main className="container mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
}
