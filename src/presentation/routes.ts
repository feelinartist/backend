import { Router } from 'express';
import { ControladorAutenticacion } from './controllers/controlador-autenticacion';
import { ControladorUsuario } from './controllers/controlador-usuario';
import { ControladorAdminConfig } from './controllers/controlador-admin-config';

const router = Router();
const controladorAutenticacion = new ControladorAutenticacion();
const controladorUsuario = new ControladorUsuario();
const controladorAdminConfig = new ControladorAdminConfig();

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.post('/auth/login', (req, res) => controladorAutenticacion.iniciarSesion(req, res));
router.patch('/usuarios/rol', (req, res) => controladorUsuario.actualizarRol(req, res));
router.patch('/usuarios/perfil', (req, res) => controladorUsuario.actualizarPerfil(req, res));
router.get('/usuarios/perfil/:usuarioId', (req, res) => controladorUsuario.obtenerPerfil(req, res));
router.get('/usuarios/perfil-publico/:username', (req, res) => controladorUsuario.obtenerPerfilPublico(req, res));
router.patch('/usuarios/deshabilitar', (req, res) => controladorUsuario.deshabilitarCuenta(req, res));
router.delete('/usuarios/eliminar', (req, res) => controladorUsuario.eliminarCuenta(req, res));
router.patch('/usuarios/reactivar', (req, res) => controladorUsuario.reactivarCuenta(req, res));
router.post('/usuarios/banear', (req, res) => controladorUsuario.banearUsuario(req, res));
router.delete('/usuarios/eliminar-permanente', (req, res) => controladorUsuario.eliminarPermanente(req, res));
router.post('/usuarios/bloquear', (req, res) => controladorUsuario.bloquearUsuario(req, res));
router.post('/usuarios/desbloquear', (req, res) => controladorUsuario.desbloquearUsuario(req, res));
router.get('/usuarios/bloqueados/:bloqueadorId', (req, res) => controladorUsuario.obtenerBloqueados(req, res));
router.get('/usuarios/buscar', (req, res) => controladorUsuario.buscarArtistas(req, res));
router.post('/usuarios/migrar-rol', (req, res) => controladorUsuario.migrarRol(req, res));
router.post('/usuarios/verificar-nombre-usuario', (req, res) => controladorUsuario.verificarNombreUsuario(req, res));
router.post('/usuarios/marcar-perfil-completado', (req, res) => controladorUsuario.marcarPerfilCompletadoReconocido(req, res));
router.get('/paises', (req, res) => controladorUsuario.obtenerPaises(req, res));
router.get('/ciudades/:paisId', (req, res) => controladorUsuario.obtenerCiudades(req, res));
router.get('/admin/usuarios', (req, res) => controladorUsuario.listarUsuarios(req, res));

// Configuración (Admin & Public Lists)
router.get('/config/redes-sociales', (req, res) => controladorAdminConfig.listarRedesSociales(req, res));
router.post('/admin/config/redes-sociales', (req, res) => controladorAdminConfig.crearRedSocial(req, res));
router.patch('/admin/config/redes-sociales/:id', (req, res) => controladorAdminConfig.actualizarRedSocial(req, res));
router.delete('/admin/config/redes-sociales/:id', (req, res) => controladorAdminConfig.eliminarRedSocial(req, res));

router.get('/config/metodos-donacion', (req, res) => controladorAdminConfig.listarMetodosDonacion(req, res));
router.post('/admin/config/metodos-donacion', (req, res) => controladorAdminConfig.crearMetodoDonacion(req, res));
router.patch('/admin/config/metodos-donacion/:id', (req, res) => controladorAdminConfig.actualizarMetodoDonacion(req, res));
router.delete('/admin/config/metodos-donacion/:id', (req, res) => controladorAdminConfig.eliminarMetodoDonacion(req, res));
router.get('/admin/config/roles', (req, res) => controladorAdminConfig.listarRoles(req, res));

import { ControladorSeguidor } from './controllers/controlador-seguidor';
const controladorSeguidor = new ControladorSeguidor();
router.post('/usuarios/seguir', (req, res) => controladorSeguidor.seguir(req, res));
router.post('/usuarios/dejar-de-seguir', (req, res) => controladorSeguidor.dejarDeSeguir(req, res));

// Image upload routes
import { ControladorImagenes } from './controllers/controlador-imagenes';
const controladorImagenes = new ControladorImagenes();
router.post('/imagenes/galeria', (req, res) => controladorImagenes.subirImagenesGaleria(req, res));
router.post('/imagenes/qr-pago', (req, res) => controladorImagenes.subirQRPago(req, res));
router.post('/imagenes/perfil', (req, res) => controladorImagenes.subirImagenPerfil(req, res));
router.delete('/imagenes', (req, res) => controladorImagenes.eliminarImagen(req, res));

// Placeholder routes

import { ControladorEvento } from './controllers/controlador-evento';
const controladorEvento = new ControladorEvento();

router.post('/eventos', (req, res) => controladorEvento.crearEvento(req, res));
router.get('/eventos/artista/:perfilArtistaId', (req, res) => controladorEvento.obtenerEventosPorArtista(req, res));
router.get('/eventos/artista/:perfilArtistaId/paginated', (req, res) => controladorEvento.obtenerEventosPaginados(req, res));
router.patch('/eventos/:id/finalizar', (req, res) => controladorEvento.finalizarEvento(req, res));
router.get('/eventos/activo/:artistaId', (req, res) => controladorEvento.obtenerEventoActivo(req, res));
router.patch('/usuarios/perfil/pedidos', (req, res) => controladorEvento.togglePedidos(req, res));


import { ControladorPedido } from './controllers/controlador-pedido';
const controladorPedido = new ControladorPedido();

router.post('/pedidos', (req, res) => controladorPedido.crearPedido(req, res));
router.get('/eventos/:eventoId/pedidos', (req, res) => controladorPedido.obtenerPedidosPorEvento(req, res));
router.patch('/pedidos/:id/estado', (req, res) => controladorPedido.actualizarEstado(req, res));

// System Configuration Routes (Admin only)
import { ControladorConfigSistema } from './controllers/controlador-config-sistema';
const controladorConfigSistema = new ControladorConfigSistema();

import { ControladorConfigPublica } from './controllers/controlador-config-publica';
const controladorConfigPublica = new ControladorConfigPublica();

// Spotify / Music Routes
import { ControladorSpotify } from './controllers/controlador-spotify';
const controladorSpotify = new ControladorSpotify();
router.get('/music/search', (req, res) => controladorSpotify.search(req, res));

// Estadísticas Routes
import { ControladorEstadisticas } from './controllers/controlador-estadisticas';
const controladorEstadisticas = new ControladorEstadisticas();
router.get('/estadisticas/evento/:eventoId', (req, res) => controladorEstadisticas.obtenerEstadisticasEvento(req, res));
router.get('/estadisticas/artista/:perfilArtistaId', (req, res) => controladorEstadisticas.obtenerEstadisticasArtista(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/generos', (req, res) => controladorEstadisticas.obtenerGenerosArtista(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/top-canciones', (req, res) => controladorEstadisticas.obtenerTopCanciones(req, res));
router.get('/estadisticas/artista/:perfilArtistaId/canciones', (req, res) => controladorEstadisticas.obtenerDetalleCancionesArtista(req, res));
router.get('/estadisticas/evento/:eventoId/canciones', (req, res) => controladorEstadisticas.obtenerDetalleCancionesEvento(req, res));



router.get('/internal/config/auth', (req, res) => controladorConfigPublica.obtenerCredencialesAuth(req, res));

router.get('/admin/config-sistema', (req, res) => controladorConfigSistema.listarTodas(req, res));
router.get('/admin/config-sistema/:clave', (req, res) => controladorConfigSistema.obtenerPorClave(req, res));
router.post('/admin/config-sistema', (req, res) => controladorConfigSistema.crear(req, res));
router.patch('/admin/config-sistema/:id', (req, res) => controladorConfigSistema.actualizar(req, res));
router.delete('/admin/config-sistema/:id', (req, res) => controladorConfigSistema.eliminar(req, res));


export default router;
