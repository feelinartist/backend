import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding REDIS_URL to ConfiguracionSistema...');

    await (prisma as any).configuracionSistema.upsert({
        where: { clave: 'REDIS_URL' },
        update: { valor: 'redis://localhost:6379' },
        create: {
            clave: 'REDIS_URL',
            valor: 'redis://localhost:6379',
            categoria: 'GENERAL',
            descripcion: 'URL de conexión a Redis para caché'
        }
    });

    console.log('✅ REDIS_URL added successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
