import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    constructor(private readonly schema: z.ZodSchema) { }

    transform(value: unknown, metadata?: ArgumentMetadata) {
        try {
            this.schema.parse(value);
            return value;
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new BadRequestException({
                    message: metadata?.type === 'query'
                        ? 'Error de validaciÃ³n en parÃ¡metros'
                        : 'Error de validaciÃ³n',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            throw error;
        }
    }
}
