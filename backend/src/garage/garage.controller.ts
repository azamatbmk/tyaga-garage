import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AssignRequestDto } from './dto/assign-request.dto.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { GarageService } from './garage.service.js';

@Controller()
export class GarageController {
  constructor(private readonly garage: GarageService) {}

  @Get('garage')
  getGarage() {
    return this.garage.getSnapshot();
  }

  @Post('requests')
  createRequest(@Body() dto: CreateRequestDto) {
    return this.garage.createRequest(dto);
  }

  @Post('requests/:id/assign')
  assignRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRequestDto,
  ) {
    return this.garage.assignRequest(id, dto.vehicleId);
  }

  @Post('fleet/:id/finish-service')
  finishService(@Param('id') id: string) {
    return this.garage.finishService(id);
  }
}
