import { ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function createContext(request: Record<string, unknown>, handler = () => undefined): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
        getClass: () => class TestController {
            static readonly isTest = true;
        },
        getHandler: () => handler,
    } as unknown as ExecutionContext;
}

import crypto from 'node:crypto';

describe('NestJS auth compatibility', () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    let dynamicJwtSecret: string;

    beforeEach(() => {
        dynamicJwtSecret = crypto.randomUUID();
        process.env.JWT_SECRET = dynamicJwtSecret;
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalJwtSecret;
    });

    it('attaches the decoded bearer token user to the request', () => {
        const token = jwt.sign({ id: 'u1', email: 'user@test.dev', rol: 'ADMIN' }, dynamicJwtSecret);
        const request = { headers: { authorization: `Bearer ${token}` } };

        const result = new JwtAuthGuard().canActivate(createContext(request));

        expect(result).toBe(true);
        expect(request).toMatchObject({
            user: { id: 'u1', email: 'user@test.dev', rol: 'ADMIN' },
        });
    });

    it('rejects users without an allowed role using the existing message', () => {
        const handler = () => undefined;
        Reflect.defineMetadata(ROLES_KEY, ['SUPER_ADMIN'], handler);
        const request = { user: { id: 'u1', email: 'user@test.dev', rol: 'ADMIN' } };

        expect(() => new RolesGuard().canActivate(createContext(request, handler))).toThrow(
            'No tienes permisos para esta acciÃ³n',
        );
    });
});
