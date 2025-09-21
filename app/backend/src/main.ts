import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('Page Snapshot API')
    .setDescription('API для приема снимков веб-страниц и конвертации в Markdown')
    .setVersion('1.0')
    .addTag('snapshot', 'Операции со снимками страниц')
    .addTag('markdown', 'Конвертация в Markdown')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Page Snapshot API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Сервер запущен на порту ${process.env.PORT ?? 3000}`);
  console.log(`📦 Лимит размера запроса: ${requestSizeLimit}`);
  console.log(`📚 Swagger документация: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
