# Shared Module

Модуль с общими сервисами, используемыми в различных частях приложения.

## Сервисы

### FileStorageService

Сервис для работы с файловым хранилищем. Предоставляет методы для:

- Создания директорий
- Записи файлов
- Чтения файлов
- Проверки существования файлов
- Получения информации о файлах

#### Основные методы:

- `getStoragePath()` - получение базового пути к хранилищу
- `ensureDirectoryExists(dirPath)` - создание директории если не существует
- `writeFile(filePath, content, encoding)` - запись содержимого в файл
- `readFile(filePath, encoding)` - чтение содержимого файла
- `fileExists(filePath)` - проверка существования файла
- `createFilePath(fileName)` - создание полного пути к файлу
- `getFileStats(filePath)` - получение информации о файле

#### Конфигурация:

Сервис использует переменную окружения `SNAPSHOT_STORAGE_PATH` для определения базового пути к хранилищу.

#### Пример использования:

```typescript
@Injectable()
export class SomeService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  async saveData(data: string) {
    const filePath = this.fileStorageService.createFilePath('data.txt');
    await this.fileStorageService.writeFile(filePath, data);
  }
}
```

