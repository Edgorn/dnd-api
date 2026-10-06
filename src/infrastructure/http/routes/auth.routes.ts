import { Request, Response } from "express";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema, logoutSchema, refreshTokenSchema } from "../schemas/auth.schema";
import { authController } from "../../dependencies";
import { TOO_MANY_AUTH_ATTEMPTS_MESSAGE } from "../../../domain/errors/AppError";

const router = Router();

const AUTH_WINDOW_MS = 15 * 60 * 1000;

type RateLimitedRequest = Request & {
  rateLimit?: {
    resetTime?: Date;
  };
};

const retryAfterSeconds = (req: Request, fallbackMs: number): number => {
  const resetTime = (req as RateLimitedRequest).rateLimit?.resetTime;
  if (resetTime instanceof Date) {
    return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
  }
  return Math.max(1, Math.ceil(fallbackMs / 1000));
};

const sendTooManyAttempts = (req: Request, res: Response, windowMs: number): void => {
  res.setHeader("Retry-After", String(retryAfterSeconds(req, windowMs)));
  res.status(429).json({ error: TOO_MANY_AUTH_ATTEMPTS_MESSAGE });
};

const loginLimiterByIp = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: 20,
  skipSuccessfulRequests: true,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (req, res) => sendTooManyAttempts(req, res, AUTH_WINDOW_MS)
});

const loginLimiterByUser = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: 10,
  skipSuccessfulRequests: true,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  keyGenerator: (req) => {
    const user = typeof req.body?.user === "string" ? req.body.user.trim().toLowerCase() : "";
    if (user) {
      return `user:${user}`;
    }
    return ipKeyGenerator(req.ip ?? "unknown");
  },
  handler: (req, res) => sendTooManyAttempts(req, res, AUTH_WINDOW_MS)
});

const refreshLimiterByIp = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: 30,
  skipSuccessfulRequests: true,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: (req, res) => sendTooManyAttempts(req, res, AUTH_WINDOW_MS)
});

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       additionalProperties: false
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
 *           description: Refresh token opaco nuevo (vigencia de 7 días). Cada refresh invalida el anterior y emite uno nuevo.
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *     RefreshTokenInput:
 *       type: object
 *       additionalProperties: false
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de refresco previo. Tras un refresh correcto deja de ser válido.
 *     LogoutInput:
 *       type: object
 *       additionalProperties: false
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
 *         description: Login exitoso. Retorna el access token, un refresh token nuevo e info básica.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Datos inválidos o campos no permitidos.
 *       401:
 *         description: Usuario o contraseña incorrectos.
 *       429:
 *         description: Demasiados intentos. Consultar la cabecera Retry-After (segundos).
 *         headers:
 *           Retry-After:
 *             description: Segundos hasta poder reintentar.
 *             schema:
 *               type: integer
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/login", loginLimiterByIp, loginLimiterByUser, validateSchema(loginSchema), authController.login);

/**
 * @openapi
 * /refresh:
 *   post:
 *     summary: Renovar access token mediante refresh token
 *     description: Rota el refresh token. La respuesta incluye un refreshToken nuevo; el enviado deja de ser válido.
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
 *         description: Token renovado. El refreshToken de la respuesta es nuevo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Datos inválidos o campos no permitidos.
 *       401:
 *         description: Refresh token inválido o expirado.
 *       429:
 *         description: Demasiados intentos. Consultar la cabecera Retry-After (segundos).
 *         headers:
 *           Retry-After:
 *             description: Segundos hasta poder reintentar.
 *             schema:
 *               type: integer
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/refresh", refreshLimiterByIp, validateSchema(refreshTokenSchema), authController.refreshToken);

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
 *       400:
 *         description: Datos inválidos o campos no permitidos.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/logout", validateSchema(logoutSchema), authController.logout);

export default router;
