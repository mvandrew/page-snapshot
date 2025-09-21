import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';
import { SnapshotValidatorService } from './services/snapshot-validator.service';

@Module({
    imports: [SharedModule],
    controllers: [SnapshotController],
    providers: [SnapshotService, SnapshotValidatorService],
    exports: [SnapshotService, SnapshotValidatorService],
})
export class SnapshotModule { }
