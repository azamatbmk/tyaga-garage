import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { GarageController } from './garage.controller.js';
import { GarageService } from './garage.service.js';
import { SessionGuard } from './session.guard.js';

@Module({
  controllers: [AuthController, GarageController],
  providers: [GarageService, SessionGuard],
})
export class GarageModule {}
