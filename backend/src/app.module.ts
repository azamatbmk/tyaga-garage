import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GarageModule } from './garage/garage.module.js';

@Module({
  imports: [GarageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
