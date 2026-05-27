
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const redesSocialesData = [
    { nombre: 'Facebook', urlBase: 'https://facebook.com/', icono: 'https://cdn.simpleicons.org/facebook/1877F2' },
    { nombre: 'YouTube', urlBase: 'https://youtube.com/@', icono: 'https://cdn.simpleicons.org/youtube/FF0000' },
    { nombre: 'Kick', urlBase: 'https://kick.com/', icono: 'https://cdn.simpleicons.org/kick/05FF00' },
    { nombre: 'Twitch', urlBase: 'https://twitch.tv/', icono: 'https://cdn.simpleicons.org/twitch/9146FF' },
    { nombre: 'Twitter (X)', urlBase: 'https://x.com/', icono: 'https://cdn.simpleicons.org/x/000000' },
    { nombre: 'SoundCloud', urlBase: 'https://soundcloud.com/', icono: 'https://cdn.simpleicons.org/soundcloud/FF3300' },
    { nombre: 'Instagram', urlBase: 'https://instagram.com/', icono: 'https://cdn.simpleicons.org/instagram/E4405F' },
    { nombre: 'TikTok', urlBase: 'https://tiktok.com/@', icono: 'https://cdn.simpleicons.org/tiktok/FFFFFF' },
];

const metodosDonacionData = [
    { nombre: 'Yape', icono: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Yape_text_app_icon.png/240px-Yape_text_app_icon.png' },
    { nombre: 'Plin', icono: 'https://vectorseek.com/wp-content/uploads/2023/09/Plin-Logo-Vector.svg-.png' },
    { nombre: 'PayPal', icono: 'https://cdn.simpleicons.org/paypal/00457C' },
    { nombre: 'Transferencia BCP', icono: 'https://cdn.simpleicons.org/chase/117ACA' }, // Placeholder/Generic bank
    { nombre: 'Transferencia Interbank', icono: 'https://cdn.simpleicons.org/chase/00965E' }, // Placeholder
    { nombre: 'Transferencia BBVA', icono: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/BBVA_2019.svg/640px-BBVA_2019.svg.png' },
    { nombre: 'Transferencia Scotiabank', icono: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Scotiabank-logo-red.png' },
    { nombre: 'Binance Pay', icono: 'https://cdn.simpleicons.org/binance/F0B90B' },
];

async function main() {
    console.log('🌱 Start seeding...');

    // 1. Seed Roles
    const roles = [
        { nombre: 'SUPER_ADMIN' },
        { nombre: 'ADMIN' },
        { nombre: 'ARTISTA' },
        { nombre: 'PUBLICO' },
        { nombre: 'DISCOTECA' },
    ];

    console.log('   - Seeding Roles...');
    for (const rol of roles) {
        await prisma.rol.upsert({
            where: { nombre: rol.nombre },
            update: {},
            create: { nombre: rol.nombre },
        });
    }

    // 2. Seed Super Admin
    console.log('   - Seeding Super Admin...');
    const superAdminEmail = 'feelinappartist@gmail.com';
    const superAdminRole = await prisma.rol.findUnique({ where: { nombre: 'SUPER_ADMIN' } });

    if (superAdminRole) {
        await prisma.usuario.upsert({
            where: { correo: superAdminEmail },
            update: { rol: { connect: { id: superAdminRole.id } } },
            create: {
                correo: superAdminEmail,
                rol: { connect: { id: superAdminRole.id } }
            },
        });
    }

    // 3. Seed Redes Sociales
    console.log('   - Seeding Redes Sociales...');
    for (const red of redesSocialesData) {
        await prisma.redSocial.upsert({
            where: { nombre: red.nombre },
            update: { urlBase: red.urlBase, icono: red.icono },
            create: {
                nombre: red.nombre,
                urlBase: red.urlBase,
                icono: red.icono,
                activo: true
            }
        });
    }

    // 4. Seed Metodos Donacion
    console.log('   - Seeding Metodos Donacion...');
    for (const metodo of metodosDonacionData) {
        await prisma.metodoDonacion.upsert({
            where: { nombre: metodo.nombre },
            update: { icono: metodo.icono },
            create: {
                nombre: metodo.nombre,
                icono: metodo.icono,
                activo: true
            }
        });
    }

    console.log('✅ Seeding finished successfully.');
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
