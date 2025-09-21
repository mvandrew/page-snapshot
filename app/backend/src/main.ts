import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './shared/filters/validation-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Настройка лимитов для больших payload
  const requestSizeLimit = process.env.REQUEST_SIZE_LIMIT || '50mb';
  app.use(require('express').json({ limit: requestSizeLimit }));
  app.use(require('express').urlencoded({ limit: requestSizeLimit, extended: true }));

  // Включаем глобальную валидацию
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Включаем глобальный фильтр для обработки ошибок валидации
  app.useGlobalFilters(new ValidationExceptionFilter());

  // Включаем CORS для работы с расширением
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Сервер запущен на порту ${process.env.PORT ?? 3000}`);
  console.log(`📦 Лимит размера запроса: ${requestSizeLimit}`);
}
bootstrap();
