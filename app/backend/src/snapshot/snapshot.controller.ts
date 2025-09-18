import { Controller, Post, Body, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotResponseDto } from './dto/snapshot-response.dto';

@Controller('api/snapshot')
export class SnapshotController {
    constructor(private readonly snapshotService: SnapshotService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    async createSnapshot(@Body() snapshotData: CreateSnapshotDto): Promise<SnapshotResponseDto> {
        console.log('=== ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ СНИМКА ===');
        console.log('Время запроса:', new Date().toISOString());
        console.log('Размер payload:', JSON.stringify(snapshotData).length, 'байт');

        try {
            // Валидация входящих данных
            this.validateSnapshotData(snapshotData);

            // Обработка данных (пока только логирование)
            const result = await this.snapshotService.processSnapshot(snapshotData);

            console.log('=== СНИМОК УСПЕШНО ОБРАБОТАН ===');
            console.log('Результат:', result);

            return {
                success: true,
                message: 'Снимок страницы успешно получен',
                data: {
                    id: result.id,
                    receivedAt: result.receivedAt,
                    checksum: result.checksum
                }
            };
        } catch (error) {
            console.error('=== ОШИБКА ПРИ ОБРАБОТКЕ СНИМКА ===');
            console.error('Тип ошибки:', error.constructor.name);
            console.error('Сообщение ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);

            // Если ошибка связана с сохранением файлов, возвращаем 500
            if (error.message.includes('Не удалось сохранить снимок')) {
                console.error('Ошибка сохранения файлов, возвращаем 500');
                throw new HttpException(
                    {
                        success: false,
                        message: error.message
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // Для других ошибок возвращаем 400
            console.error('Ошибка валидации, возвращаем 400');
            throw new HttpException(
                {
                    success: false,
                    message: `Ошибка обработки снимка: ${error.message}`
                },
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private validateSnapshotData(data: CreateSnapshotDto): void {
        // Детальное логирование входящих данных
        console.log('=== ВАЛИДАЦИЯ ДАННЫХ СНИМКА ===');
        console.log('Получены данные:', {
            hasData: !!data,
            dataType: typeof data,
            dataKeys: data ? Object.keys(data) : 'N/A'
        });

        if (data && data.content) {
            console.log('Content данные:', {
                hasContent: !!data.content,
                contentType: typeof data.content,
                contentKeys: Object.keys(data.content),
                htmlLength: data.content.html?.length || 'N/A',
                htmlType: typeof data.content.html,
                url: data.content.url,
                urlType: typeof data.content.url,
                title: data.content.title,
                titleType: typeof data.content.title,
                timestamp: data.content.timestamp,
                timestampType: typeof data.content.timestamp
            });
        }

        console.log('UserAgent данные:', {
            hasUserAgent: !!data?.userAgent,
            userAgentType: typeof data?.userAgent,
            userAgentValue: data?.userAgent
        });

        if (!data) {
            console.error('ОШИБКА: Данные снимка не предоставлены');
            throw new Error('Данные снимка не предоставлены');
        }

        if (!data.content || typeof data.content !== 'object') {
            console.error('ОШИБКА: Неверная структура данных content', {
                hasContent: !!data.content,
                contentType: typeof data.content
            });
            throw new Error('Неверная структура данных content');
        }

        if (!data.content.html || typeof data.content.html !== 'string') {
            console.error('ОШИБКА: HTML контент не предоставлен или неверного типа', {
                hasHtml: !!data.content.html,
                htmlType: typeof data.content.html,
                htmlLength: data.content.html?.length
            });
            throw new Error('HTML контент не предоставлен или неверного типа');
        }

        if (!data.content.url || typeof data.content.url !== 'string') {
            console.error('ОШИБКА: URL страницы не предоставлен или неверного типа', {
                hasUrl: !!data.content.url,
                urlType: typeof data.content.url,
                urlValue: data.content.url
            });
            throw new Error('URL страницы не предоставлен или неверного типа');
        }

        if (!data.content.title || typeof data.content.title !== 'string') {
            console.error('ОШИБКА: Title не предоставлен или неверного типа', {
                hasTitle: !!data.content.title,
                titleType: typeof data.content.title,
                titleValue: data.content.title
            });
            throw new Error('Title не предоставлен или неверного типа');
        }

        if (!data.content.timestamp || typeof data.content.timestamp !== 'string') {
            console.error('ОШИБКА: Timestamp не предоставлен или неверного типа', {
                hasTimestamp: !!data.content.timestamp,
                timestampType: typeof data.content.timestamp,
                timestampValue: data.content.timestamp
            });
            throw new Error('Timestamp не предоставлен или неверного типа');
        }

        if (!data.userAgent || typeof data.userAgent !== 'string') {
            console.error('ОШИБКА: User Agent не предоставлен или неверного типа', {
                hasUserAgent: !!data.userAgent,
                userAgentType: typeof data.userAgent,
                userAgentValue: data.userAgent
            });
            throw new Error('User Agent не предоставлен или неверного типа');
        }

        // Валидация URL
        try {
            console.log('Валидация URL:', data.content.url);
            new URL(data.content.url);
            console.log('URL валиден');
        } catch (urlError) {
            console.error('ОШИБКА: Неверный формат URL', {
                url: data.content.url,
                error: urlError.message
            });
            throw new Error('Неверный формат URL');
        }

        // Валидация timestamp
        try {
            console.log('Валидация timestamp:', data.content.timestamp);
            const timestamp = new Date(data.content.timestamp);
            if (isNaN(timestamp.getTime())) {
                console.error('ОШИБКА: Неверный формат временной метки', {
                    timestamp: data.content.timestamp,
                    parsedTimestamp: timestamp,
                    isNaN: isNaN(timestamp.getTime())
                });
                throw new Error('Неверный формат временной метки');
            }
            console.log('Timestamp валиден:', timestamp.toISOString());
        } catch (timestampError) {
            console.error('ОШИБКА: Проблема с timestamp', {
                timestamp: data.content.timestamp,
                error: timestampError.message
            });
            throw new Error('Неверный формат временной метки');
        }

        console.log('=== ВАЛИДАЦИЯ ПРОЙДЕНА УСПЕШНО ===');
    }
}
