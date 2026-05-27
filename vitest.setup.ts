import { vi } from 'vitest';

// Global mock for Prisma Client to prevent connection errors in tests
vi.mock('@prisma/client', () => {
    class MockPrismaClient {
        $connect = vi.fn().mockResolvedValue(undefined);
        $disconnect = vi.fn().mockResolvedValue(undefined);
        $transaction = vi.fn().mockImplementation((cb) => cb(this));
        
        usuario = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };
        
        evento = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };
        
        pedidoCancion = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };

        estadisticasCancion = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
            upsert: vi.fn(),
        };

        configuracionSistema = {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        };

        bloqueo = {
            create: vi.fn(),
            deleteMany: vi.fn(),
            findMany: vi.fn(),
        };

        perfilArtista = {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
        };

        galeriaArtista = {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        };

        perfilPublico = {
            findUnique: vi.fn(),
            deleteMany: vi.fn(),
        };

        perfilDiscoteca = {
            findUnique: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        };

        artistaRedSocial = {
            deleteMany: vi.fn(),
        };

        artistaDonacion = {
            deleteMany: vi.fn(),
        };

        seguidor = {
            deleteMany: vi.fn(),
        };
    }

    return {
        PrismaClient: MockPrismaClient,
        Prisma: {
            UsuarioWhereInput: {},
            PedidoCancionWhereInput: {},
        },
    };
});
