import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import type { MarkdownContent } from '../../types/markdown';
import { useEffect, useRef } from 'react';

interface MarkdownViewerProps {
    content: MarkdownContent | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Компонент для отображения markdown контента
 */
export function MarkdownViewer({ content, isLoading, error }: MarkdownViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Автоскролл к началу при загрузке нового контента
    useEffect(() => {
        if (content && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [content]);

    if (isLoading) {
        return (
            <Card className="h-96">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="space-y-2 mt-6">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-2 mt-6">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-96">
                <CardContent className="p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-destructive text-lg font-medium mb-2">
                            Ошибка загрузки
                        </div>
                        <div className="text-muted-foreground text-sm">
                            {error}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!content) {
        return (
            <Card className="h-96">
                <CardContent className="p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-muted-foreground text-lg font-medium mb-2">
                            Нет данных для отображения
                        </div>
                        <div className="text-muted-foreground text-sm">
                            Нажмите "Обновить" для загрузки markdown контента
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex-1">
            <CardContent className="p-0">
                <div
                    ref={containerRef}
                    className="h-96 overflow-auto p-6 prose prose-sm max-w-none dark:prose-invert"
                    style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                        lineHeight: '1.6',
                    }}
                >
                    <pre className="whitespace-pre-wrap break-words text-sm">
                        {content.content}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
