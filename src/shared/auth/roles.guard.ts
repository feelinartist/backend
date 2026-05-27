import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedRequest } from './auth.types';

class CompatibleForbiddenException extends HttpException {
    constructor(message: string) {
        super({ message }, HttpStatus.FORBIDDEN);
        this.message = message;
    }
}

class CompatibleUnauthorizedException extends HttpException {
    constructor(message: string) {
        super({ message }, HttpStatus.UNAUTHORIZED);
        this.message = message;
    }
}

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly reflector = new Reflector();

    canActivate(context: ExecutionContext): boolean {
        const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!allowedRoles?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        if (!request.user) {
            throw new CompatibleUnauthorizedException('Usuario no autenticado');
        }

        if (!request.user.rol || !allowedRoles.includes(request.user.rol)) {
            throw new CompatibleForbiddenException('No tienes permisos para esta acciÃ³n');
        }

        return true;
    }
}
