import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AssignDriverDto } from './dto/assign-driver.dto.js';
import { AssignRequestDto } from './dto/assign-request.dto.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { CreateWaybillDto } from './dto/create-waybill.dto.js';
import { UpdateWaybillDto } from './dto/update-waybill.dto.js';
import type { Actor } from './actor.js';
import { GarageService } from './garage.service.js';
import { CurrentActor, SessionGuard } from './session.guard.js';

@UseGuards(SessionGuard)
@Controller()
export class GarageController {
  constructor(private readonly garage: GarageService) {}

  @Get('garage')
  getGarage(@CurrentActor() actor: Actor) {
    return this.garage.getSnapshot(actor);
  }

  @Get('garage/export')
  async exportGarage(@CurrentActor() actor: Actor) {
    const file = await this.garage.exportExcel(actor);
    return new StreamableFile(file.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${file.filename}"`,
      length: file.buffer.length,
    });
  }

  @Post('requests')
  createRequest(@CurrentActor() actor: Actor, @Body() dto: CreateRequestDto) {
    return this.garage.createRequest(dto, actor);
  }

  @Post('requests/:id/assign')
  assignRequest(
    @CurrentActor() actor: Actor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRequestDto,
  ) {
    return this.garage.assignRequest(id, dto.vehicleId, actor);
  }

  @Post('fleet')
  createVehicle(@CurrentActor() actor: Actor, @Body() dto: CreateVehicleDto) {
    return this.garage.createVehicle(dto, actor);
  }

  @Post('fleet/:id/assign-driver')
  assignDriver(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.garage.assignDriver(id, dto, actor);
  }

  @Post('fleet/:id/finish-service')
  finishService(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.garage.finishService(id, actor);
  }

  @Post('waybills')
  createWaybill(@CurrentActor() actor: Actor, @Body() dto: CreateWaybillDto) {
    return this.garage.createWaybill(dto, actor);
  }

  @Patch('waybills/:id')
  updateWaybill(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateWaybillDto,
  ) {
    return this.garage.updateWaybill(id, dto, actor);
  }
}
