import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentActor, SessionGuard, type ActorRequest } from './session.guard.js';
import type { Actor } from './actor.js';
import { publicProfile } from './actor.js';
import { LoginDto } from './dto/login.dto.js';
import { GarageService } from './garage.service.js';
import {
  clearSessionCookie,
  readSessionId,
  sessionCookie,
} from './session-cookie.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly garage: GarageService) {}

  @Get('staff')
  staff() {
    return this.garage.listLoginStaff();
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = this.garage.openSession(dto.staffId, dto.password);
    res.setHeader('Set-Cookie', sessionCookie(sessionId));
    const actor = this.garage.actorBySession(sessionId);
    if (!actor) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    return publicProfile(actor);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  logout(
    @Req() req: ActorRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = readSessionId(req.headers.cookie);
    if (sessionId) this.garage.closeSession(sessionId);
    res.setHeader('Set-Cookie', clearSessionCookie());
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentActor() actor: Actor) {
    return publicProfile(actor);
  }
}
