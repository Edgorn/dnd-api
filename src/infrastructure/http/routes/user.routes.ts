import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema } from "../schemas/login.schema";
import { userController } from "../../dependencies";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - user
 *         - password
 *       properties:
 *         user:
 *           type: string
 *           description: Nombre de usuario.
 *         password:
 *           type: string
 *           description: Contraseña del usuario.
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Access token JWT (vigencia de 15 minutos).
 *         refreshToken:
 *           type: string
 *           description: Refresh token (vigencia de 7 días).
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *     RefreshTokenInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de refresco previo.
 *     LogoutInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de refresco a revocar.
 */

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso. Retorna el access token, refresh token e info básica.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Usuario o contraseña incorrectos.
 *       429:
 *         description: Demasiados intentos de inicio de sesión.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/login', loginLimiter, validateSchema(loginSchema), userController.login);

/**
 * @openapi
 * /refresh:
 *   post:
 *     summary: Renovar access token mediante refresh token
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenInput'
 *     responses:
 *       200:
 *         description: Token renovado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Refresh token no proporcionado.
 *       401:
 *         description: Refresh token inválido o expirado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/refresh', userController.refreshToken);

/**
 * @openapi
 * /logout:
 *   post:
 *     summary: Cerrar sesión y revocar refresh token
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutInput'
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/logout', userController.logout);

export default router;