import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';

@Module({
    imports: [SharedModule],
    controllers: [SnapshotController],
    providers: [SnapshotService],
    exports: [SnapshotService],
})
export class SnapshotModule { }
