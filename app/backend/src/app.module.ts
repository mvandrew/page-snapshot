import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnapshotModule } from './snapshot/snapshot.module';

@Module({
  imports: [SnapshotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
