import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema } from "../schemas/login.schema";
import { changePasswordSchema, createUserSchema, updateUserNameSchema, updateUserProfileSchema } from "../schemas/user.schema";
import { authMiddleware, userController } from "../../dependencies";

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
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador del usuario.
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *         accessibleSystems:
 *           type: array
 *           items:
 *             type: string
 *           description: Sistemas a los que el usuario tiene acceso. Un array vacío significa acceso a todos.
 *         isAdmin:
 *           type: boolean
 *           description: Indica si la cuenta puede administrar usuarios. Las cuentas nuevas se crean siempre en false.
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre único de la nueva cuenta.
 *         password:
 *           type: string
 *           minLength: 8
 *           description: Contraseña de la nueva cuenta (mínimo 8 caracteres).
 *         accessibleSystems:
 *           type: array
 *           items:
 *             type: string
 *           description: Sistemas accesibles. Si se omite, se guarda un array vacío.
 *     UpdateUserNameInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nuevo nombre del usuario autenticado.
 *     ChangePasswordInput:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Contraseña actual.
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           description: Nueva contraseña (mínimo 8 caracteres).
 *     UpdateUserProfileInput:
 *       type: object
 *       description: Al menos uno de los campos es obligatorio. No modifica la contraseña ni el rol de administrador.
 *       properties:
 *         name:
 *           type: string
 *           description: Nuevo nombre del usuario.
 *         accessibleSystems:
 *           type: array
 *           items:
 *             type: string
 *           description: Sistemas accesibles. Un array vacío significa acceso a todos.
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
 *       400:
 *         description: Refresh token no proporcionado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/logout', userController.logout);

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Crear una cuenta de usuario
 *     description: Requiere sesión de administrador. No hay registro público. La cuenta se crea siempre sin permisos de administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: Cuenta creada. No incluye la contraseña.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El usuario de la sesión no es administrador.
 *       409:
 *         description: Ya existe un usuario con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/users", authMiddleware, validateSchema(createUserSchema), userController.create);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario de la sesión.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: El usuario ya no existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/users/me", authMiddleware, userController.getMe);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Cambiar el nombre del usuario autenticado
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserNameInput'
 *     responses:
 *       200:
 *         description: Nombre actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: El usuario ya no existe.
 *       409:
 *         description: Ya existe un usuario con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/users/me", authMiddleware, validateSchema(updateUserNameSchema), userController.updateName);

/**
 * @openapi
 * /users/me/password:
 *   patch:
 *     summary: Cambiar la contraseña del usuario autenticado
 *     description: Comprueba la contraseña actual, guarda la nueva y revoca los refresh tokens. El access token sigue vigente hasta que caduque.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       200:
 *         description: Contraseña actualizada y refresh tokens revocados.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado o contraseña actual incorrecta.
 *       404:
 *         description: El usuario ya no existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/users/me/password", authMiddleware, validateSchema(changePasswordSchema), userController.changePassword);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Listar usuarios activos
 *     description: Devuelve los perfiles de las cuentas que no están borradas. No incluye contraseñas. Requiere administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de perfiles activos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El usuario de la sesión no es administrador.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/users", authMiddleware, userController.list);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Obtener un usuario activo
 *     description: Devuelve el perfil si la cuenta existe y no está borrada. Requiere administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario.
 *     responses:
 *       200:
 *         description: Perfil del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El usuario de la sesión no es administrador.
 *       404:
 *         description: El usuario no existe o está borrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/users/:id", authMiddleware, userController.getById);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     summary: Editar el perfil de un usuario
 *     description: Permite cambiar el nombre y los sistemas accesibles. El identificador va en la ruta. No modifica la contraseña ni el rol de administrador. Requiere administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileInput'
 *     responses:
 *       200:
 *         description: Perfil actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El usuario de la sesión no es administrador.
 *       404:
 *         description: El usuario no existe o está borrado.
 *       409:
 *         description: Ya existe un usuario con ese nombre.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/users/:id", authMiddleware, validateSchema(updateUserProfileSchema), userController.update);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Borrar lógicamente un usuario
 *     description: Marca la cuenta como borrada, revoca sus refresh tokens e invalida la caché de sesión. No permite borrar la propia cuenta ni a otro administrador. Requiere administrador.
 *     tags:
 *       - Usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador del usuario.
 *     responses:
 *       204:
 *         description: Usuario borrado.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El actor no es administrador, intenta borrarse a sí mismo o el objetivo es administrador.
 *       404:
 *         description: El usuario no existe o ya está borrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/users/:id", authMiddleware, userController.softDelete);

export default router;