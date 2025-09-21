import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

/**
 * Компонент индикатора загрузки
 */
export function LoadingSpinner({
    className,
    size = 'md',
    text
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
            <div
                className={cn(
                    'animate-spin rounded-full border-2 border-muted border-t-primary',
                    sizeClasses[size]
                )}
                role="status"
                aria-label="Загрузка"
            />
            {text && (
                <p className="text-sm text-muted-foreground">{text}</p>
            )}
        </div>
    );
}
