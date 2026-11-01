import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Actor } from './actor.js';
import { readSessionId } from './session-cookie.js';
import { GarageService } from './garage.service.js';

export type ActorRequest = {
  headers: { cookie?: string };
  actor?: Actor;
};

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor =>
    ctx.switchToHttp().getRequest<ActorRequest>().actor as Actor,
);

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly garage: GarageService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ActorRequest>();
    const sessionId = readSessionId(request.headers.cookie);
    const actor = sessionId ? this.garage.actorBySession(sessionId) : null;
    if (!actor) {
      throw new UnauthorizedException('Войдите в систему');
    }
    request.actor = actor;
    return true;
  }
}
