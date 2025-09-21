import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { SnapshotModule } from './snapshot/snapshot.module';
import { MarkdownModule } from './markdown/markdown.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    SnapshotModule,
    MarkdownModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
