import { Module } from '@nestjs/common';
import { GarageController } from './garage.controller.js';
import { GarageService } from './garage.service.js';

@Module({
  controllers: [GarageController],
  providers: [GarageService],
})
export class GarageModule {}
