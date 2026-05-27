import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

function getSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET or NEXTAUTH_SECRET not configured');
    }
    return secret;
}

class CompatibleUnauthorizedException extends HttpException {
    constructor(message: string) {
        super({ message }, HttpStatus.UNAUTHORIZED);
        this.message = message;
    }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        try {
            const authHeader = request.headers.authorization;

            if (!authHeader?.startsWith('Bearer ')) {
                throw new CompatibleUnauthorizedException('No se proporcionÃ³ token de autenticaciÃ³n');
            }

            const token = authHeader.substring(7);
            request.user = jwt.verify(token, getSecret()) as AuthenticatedUser;
            return true;
        } catch (error) {
            if (error instanceof CompatibleUnauthorizedException) {
                throw error;
            }
            throw new CompatibleUnauthorizedException('Token invÃ¡lido o expirado');
        }
    }
}
