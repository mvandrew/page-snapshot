import { Injectable, Logger } from '@nestjs/common';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

export interface ProcessedSnapshot {
    id: string;
    receivedAt: string;
}

@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    async processSnapshot(snapshotData: CreateSnapshotDto): Promise<ProcessedSnapshot> {
        const id = this.generateId();
        const receivedAt = new Date().toISOString();

        // Логирование полученных данных
        this.logger.log(`Получен снимок страницы: ${snapshotData.content.url}`);
        this.logger.debug(`ID: ${id}`);
        this.logger.debug(`Заголовок: ${snapshotData.content.title}`);
        this.logger.debug(`Размер HTML: ${snapshotData.content.html.length} символов`);
        this.logger.debug(`User Agent: ${snapshotData.userAgent}`);
        this.logger.debug(`Временная метка: ${snapshotData.content.timestamp}`);

        // TODO: Здесь будет сохранение в базу данных
        // await this.saveToDatabase(snapshotData, id);

        // TODO: Здесь будет обработка HTML контента
        // await this.processHtmlContent(snapshotData.content.html);

        // TODO: Здесь будет извлечение метаданных
        // const metadata = await this.extractMetadata(snapshotData);

        return {
            id,
            receivedAt
        };
    }

    private generateId(): string {
        // Генерируем уникальный ID для снимка
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `snapshot_${timestamp}_${random}`;
    }

    // TODO: Методы для будущей реализации
    // private async saveToDatabase(data: SnapshotData, id: string): Promise<void> {
    //   // Сохранение в базу данных
    // }

    // private async processHtmlContent(html: string): Promise<void> {
    //   // Обработка HTML контента
    // }

    // private async extractMetadata(data: SnapshotData): Promise<any> {
    //   // Извлечение метаданных из HTML
    // }
}
