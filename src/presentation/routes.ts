import { Router } from 'express';
import { ControladorAutenticacion } from './controllers/controlador-autenticacion';
import { ControladorUsuario } from './controllers/controlador-usuario';
import { ControladorAdminConfig } from './controllers/controlador-admin-config';
import { authLimiter, uploadLimiter } from '../middleware/rate-limit';
import { authMiddleware, roleGuard } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateRoleSchema, updateProfileSchema, usernameCheckSchema, blockUserSchema } from '../domain/schemas/user.schema';
import { uploadGallerySchema, uploadQRSchema, uploadProfileSchema } from '../domain/schemas/image.schema';

const router = Router();
const controladorAutenticacion = new ControladorAutenticacion();
const controladorUsuario = new ControladorUsuario();
const controladorAdminConfig = new ControladorAdminConfig();

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES — No authentication required
// ═══════════════════════════════════════════════════════════════

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Authentication (login creates/finds user and returns JWT)
router.post('/auth/login', authLimiter, (req, res) => controladorAutenticacion.iniciarSesion(req, res));

// Public data endpoints
router.get('/usuarios/perfil-publico/:username', (req, res) => controladorUsuario.obtenerPerfilPublico(req, res));
router.get('/paises', (req, res) => controladorUsuario.obtenerPaises(req, res));
router.get('/ciudades/:paisId', (req, res) => controladorUsuario.obtenerCiudades(req, res));
router.get('/config/redes-sociales', (req, res) => controladorAdminConfig.listarRedesSociales(req, res));
router.get('/config/metodos-donacion', (req, res) => controladorAdminConfig.listarMetodosDonacion(req, res));

// Song requests can be anonymous (público sin cuenta)
import { ControladorPedido } from './controllers/controlador-pedido';
const controladorPedido = new ControladorPedido();
router.post('/pedidos', (req, res) => controladorPedido.crearPedido(req, res));

// Active event check (used by public QR scan pages)
import { ControladorEvento } from './controllers/controlador-evento';
const controladorEvento = new ControladorEvento();
router.get('/eventos/activo/:artistaId', (req, res) => controladorEvento.obtenerEventoActivo(req, res));

// Internal config (protected by its own API key mechanism)
import { ControladorConfigPublica } from './controllers/controlador-config-publica';
const controladorConfigPublica = new ControladorConfigPublica();
router.get('/internal/config/auth', (req, res) => controladorConfigPublica.obtenerCredencialesAuth(req, res));

// Estadísticas de evento (público puede ver)
import { ControladorEstadisticas } from './controllers/controlador-estadisticas';
const controladorEstadisticas = new ControladorEstadisticas();
router.get('/estadisticas/evento/:eventoId', (req, res) => controladorEstadisticas.obtenerEstadisticasEvento(req, res));
router.get('/estadisticas/evento/:eventoId/canciones', (req, res) => controladorEstadisticas.obtenerDetalleCancionesEvento(req, res));

// ═══════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES — Require valid JWT
// ═══════════════════════════════════════════════════════════════

// User registration & role assignment
router.patch('/usuarios/rol', authMiddleware, authLimiter, validate(updateRoleSchema), (req, res) => controladorUsuario.actualizarRol(req, res));
router.patch('/usuarios/perfil', authMiddleware, validate(updateProfileSchema), (req, res) => controladorUsuario.actualizarPerfil(req, res));
router.get('/usuarios/perfil/:usuarioId', authMiddleware, (req, res) => controladorUsuario.obtenerPerfil(req, res));
router.post('/usuarios/verificar-nombre-usuario', authMiddleware, validate(usernameCheckSchema), (req, res) => controladorUsuario.verificarNombreUsuario(req, res));
router.post('/usuarios/marcar-perfil-completado', authMiddleware, (req, res) => controladorUsuario.marcarPerfilCompletadoReconocido(req, res));
router.get('/usuarios/buscar', authMiddleware, (req, res) => controladorUsuario.buscarArtistas(req, res));

// Account management
router.patch('/usuarios/deshabilitar', authMiddleware, (req, res) => controladorUsuario.deshabilitarCuenta(req, res));
router.delete('/usuarios/eliminar', authMiddleware, (req, res) => controladorUsuario.eliminarCuenta(req, res));
router.patch('/usuarios/reactivar', authMiddleware, (req, res) => controladorUsuario.reactivarCuenta(req, res));

// Blocking
router.post('/usuarios/bloquear', authMiddleware, validate(blockUserSchema), (req, res) => controladorUsuario.bloquearUsuario(req, res));
router.post('/usuarios/desbloquear', authMiddleware, validate(blockUserSchema), (req, res) => controladorUsuario.desbloquearUsuario(req, res));
router.get('/usuarios/bloqueados/:bloqueadorId', authMiddleware, (req, res) => controladorUsuario.obtenerBloqueados(req, res));

// Follow system
import { ControladorSeguidor } from './controllers/controlador-seguidor';
const controladorSeguidor = new ControladorSeguidor();
router.post('/usuarios/seguir', authMiddleware, (req, res) => controladorSeguidor.seguir(req, res));
router.post('/usuarios/dejar-de-seguir', authMiddleware, (req, res) => controladorSeguidor.dejarDeSeguir(req, res));

// Image upload routes with rate limiting and validation
import { ControladorImagenes } from './controllers/controlador-imagenes';
const controladorImagenes = new ControladorImagenes();
router.post('/imagenes/galeria', authMiddleware, uploadLimiter, validate(uploadGallerySchema), (req, res) => controladorImagenes.subirImagenesGaleria(req, res));
router.post('/imagenes/qr-pago', authMiddleware, uploadLimiter, validate(uploadQRSchema), (req, res) => controladorImagenes.subirQRPago(req, res));
router.post('/imagenes/perfil', authMiddleware, uploadLimiter, validate(uploadProfileSchema), (req, res) => controladorImagenes.subirImagenPerfil(req, res));
router.delete('/imagenes', authMiddleware, (req, res) => controladorImagenes.eliminarImagen(req, res));

// Events (authenticated artist actions)
router.post('/eventos', authMiddleware, (req, res) => controladorEvento.crearEvento(req, res));
router.get('/eventos/artista/:perfilArtistaId', authMiddleware, (req, res) => controladorEvento.obtenerEventosPorArtista(req, res));
router.get('/eventos/artista/:perfilArtistaId/paginated', authMiddleware, (req, res) => controladorEvento.obtenerEventosPaginados(req, res));
router.patch('/eventos/:id/finalizar', authMiddleware, (req, res) => controladorEvento.finalizarEvento(req, res));
router.patch('/usuarios/perfil/pedidos', authMiddleware, (req, res) => controladorEvento.togglePedidos(req, res));

// Song requests management (artist managing their queue)
router.get('/eventos/:eventoId/pedidos', authMiddleware, (req, res) => controladorPedido.obtenerPedidosPorEvento(req, res));
router.patch('/pedidos/:id/estado', authMiddleware, (req, res) => controladorPedido.actualizarEstado(req, res));

// Artist statistics (authenticated)
router.get('/estadisticas/artista/:perfilArtistaId', authMiddleware, (req, res) => controladorEstadisticas.obtenerEstadisticasArtista(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/generos', authMiddleware, (req, res) => controladorEstadisticas.obtenerGenerosArtista(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/top-canciones', authMiddleware, (req, res) => controladorEstadisticas.obtenerTopCanciones(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/canciones', authMiddleware, (req, res) => controladorEstadisticas.obtenerDetalleCancionesArtista(req, res));

// Role migration
router.post('/usuarios/migrar-rol', authMiddleware, (req, res) => controladorUsuario.migrarRol(req, res));

// ═══════════════════════════════════════════════════════════════
// ADMIN ROUTES — Require JWT + SUPER_ADMIN or ADMIN role
// ═══════════════════════════════════════════════════════════════

const adminGuard = roleGuard(['SUPER_ADMIN', 'ADMIN']);

// Social networks management
router.post('/admin/config/redes-sociales', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.crearRedSocial(req, res));
router.patch('/admin/config/redes-sociales/:id', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.actualizarRedSocial(req, res));
router.delete('/admin/config/redes-sociales/:id', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.eliminarRedSocial(req, res));

// Donation methods management
router.post('/admin/config/metodos-donacion', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.crearMetodoDonacion(req, res));
router.patch('/admin/config/metodos-donacion/:id', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.actualizarMetodoDonacion(req, res));
router.delete('/admin/config/metodos-donacion/:id', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.eliminarMetodoDonacion(req, res));
router.get('/admin/config/roles', authMiddleware, adminGuard, (req, res) => controladorAdminConfig.listarRoles(req, res));

// User management (admin)
router.get('/admin/usuarios', authMiddleware, adminGuard, (req, res) => controladorUsuario.listarUsuarios(req, res));
router.post('/usuarios/banear', authMiddleware, adminGuard, (req, res) => controladorUsuario.banearUsuario(req, res));
router.delete('/usuarios/eliminar-permanente', authMiddleware, adminGuard, (req, res) => controladorUsuario.eliminarPermanente(req, res));
router.delete('/admin/usuarios/perfil/:tipo', authMiddleware, adminGuard, (req, res) => controladorUsuario.eliminarPerfilEspecifico(req, res));

// System configuration (admin)
import { ControladorConfigSistema } from './controllers/controlador-config-sistema';
const controladorConfigSistema = new ControladorConfigSistema();
router.get('/admin/config-sistema', authMiddleware, adminGuard, (req, res) => controladorConfigSistema.listarTodas(req, res));
router.get('/admin/config-sistema/:clave', authMiddleware, adminGuard, (req, res) => controladorConfigSistema.obtenerPorClave(req, res));
router.post('/admin/config-sistema', authMiddleware, adminGuard, (req, res) => controladorConfigSistema.crear(req, res));
router.patch('/admin/config-sistema/:id', authMiddleware, adminGuard, (req, res) => controladorConfigSistema.actualizar(req, res));
router.delete('/admin/config-sistema/:id', authMiddleware, adminGuard, (req, res) => controladorConfigSistema.eliminar(req, res));


export default router;
