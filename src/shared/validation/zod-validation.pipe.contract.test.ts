import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
    it('returns value if parsing succeeds', () => {
        const schema = z.object({ nombre: z.string() });
        const pipe = new ZodValidationPipe(schema);
        const data = { nombre: 'David' };
        expect(pipe.transform(data)).toBe(data);
    });

    it('keeps the existing validation error response shape', () => {
        const pipe = new ZodValidationPipe(z.object({ nombre: z.string().min(1, 'Nombre requerido') }));

        expect(() => pipe.transform({ nombre: '' })).toThrow(
            expect.objectContaining({
                response: {
                    message: 'Error de validaciÃ³n',
                    errors: [{ field: 'nombre', message: 'Nombre requerido' }],
                },
            }),
        );
    });

    it('uses different message shape when metadata type is query', () => {
        const pipe = new ZodValidationPipe(z.object({ q: z.string() }));
        
        expect(() => pipe.transform({}, { type: 'query', metatype: String })).toThrow(
            expect.objectContaining({
                response: {
                    message: 'Error de validaciÃ³n en parÃ¡metros',
                    errors: [{ field: 'q', message: 'Invalid input: expected string, received undefined' }],
                },
            }),
        );
    });

    it('rethrows non-Zod errors', () => {
        const mockSchema = {
            parse: () => {
                throw new Error('Some unexpected error');
            }
        } as any;
        const pipe = new ZodValidationPipe(mockSchema);

        expect(() => pipe.transform({})).toThrow('Some unexpected error');
    });
});
