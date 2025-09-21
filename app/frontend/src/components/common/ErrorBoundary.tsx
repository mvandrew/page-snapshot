import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Граничный компонент для обработки ошибок React
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Произошла ошибка</AlertTitle>
                            <AlertDescription className="mt-2">
                                Приложение столкнулось с неожиданной ошибкой.
                                Попробуйте обновить страницу или обратитесь к разработчику.
                            </AlertDescription>
                            {this.state.error && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm font-medium">
                                        Детали ошибки
                                    </summary>
                                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                                        {this.state.error.message}
                                    </pre>
                                </details>
                            )}
                            <div className="mt-4">
                                <Button
                                    onClick={this.handleRetry}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Попробовать снова
                                </Button>
                            </div>
                        </Alert>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
