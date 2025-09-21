import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Copy, Download, Trash2 } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';
import type { MarkdownContent } from '../../types/markdown';

interface MarkdownToolbarProps {
    content: MarkdownContent | null;
    onClear: () => void;
}

/**
 * Панель инструментов для работы с markdown
 */
export function MarkdownToolbar({
    content,
    onClear
}: MarkdownToolbarProps) {
    const { copyToClipboard, isCopied } = useClipboard();

    const handleCopy = async () => {
        if (content) {
            await copyToClipboard(content.content);
        }
    };

    const handleDownload = () => {
        if (!content) return;

        const blob = new Blob([content.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-snapshot-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        // Проверяем валидность даты
        if (!date || isNaN(date.getTime())) {
            return 'Неизвестно';
        }

        return new Intl.DateTimeFormat('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Информация о контенте */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
                        {content ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span>Размер: {formatFileSize(content.size)}</span>
                                    <span>•</span>
                                    <span>Обновлено: {formatDate(content.lastUpdated)}</span>
                                </div>
                            </>
                        ) : (
                            <span>Нет данных для отображения</span>
                        )}
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-2">
                        {content && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="flex items-center gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    {isCopied ? 'Скопировано!' : 'Копировать'}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    className="flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Скачать
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onClear}
                                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Очистить
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
