import { Request, Response, NextFunction } from "express";
import LoginUseCase from "../../../application/use-cases/user/login.use-case";
import RefreshTokenUseCase from "../../../application/use-cases/user/refreshToken.use-case";
import LogoutUseCase from "../../../application/use-cases/user/logout.use-case";
import CreateUserUseCase from "../../../application/use-cases/user/createUser.use-case";
import GetCurrentUserUseCase from "../../../application/use-cases/user/getCurrentUser.use-case";
import UpdateUserNameUseCase from "../../../application/use-cases/user/updateUserName.use-case";
import ChangePasswordUseCase from "../../../application/use-cases/user/changePassword.use-case";
import ListUsersUseCase from "../../../application/use-cases/user/listUsers.use-case";
import GetUserProfileUseCase from "../../../application/use-cases/user/getUserProfile.use-case";
import UpdateUserProfileUseCase from "../../../application/use-cases/user/updateUserProfile.use-case";
import SoftDeleteUserUseCase from "../../../application/use-cases/user/softDeleteUser.use-case";
import { AppError } from "../../../domain/errors/AppError";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";

export class UserController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly updateUserNameUseCase: UpdateUserNameUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly softDeleteUserUseCase: SoftDeleteUserUseCase
  ) { }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, password } = req.body;

      const data = await this.loginUseCase.execute({ user, password });

      if (!data) {
        console.warn(`[AUTH] Intento de login fallido: ${user}`);
        throw new AppError("Usuario o contraseña incorrectos", 401);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError("Refresh token no proporcionado", 400);
      }

      const data = await this.refreshTokenUseCase.execute(refreshToken);

      if (!data) {
        throw new AppError("Refresh token inválido o expirado", 401);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError("Refresh token no proporcionado", 400);
      }

      await this.logoutUseCase.execute(refreshToken);

      res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, password, accessibleSystems } = req.body;
      const profile = await this.createUserUseCase.execute(this.requireUserId(req), {
        name,
        password,
        accessibleSystems
      });
      res.status(201).json(profile);
    } catch (error) {
      console.error("[UserController] Error in create:", error);
      next(error);
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.getCurrentUserUseCase.execute(this.requireUserId(req));
      res.status(200).json(profile);
    } catch (error) {
      console.error("[UserController] Error in getMe:", error);
      next(error);
    }
  };

  updateName = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.updateUserNameUseCase.execute({
        id: this.requireUserId(req),
        name: req.body.name
      });
      res.status(200).json(profile);
    } catch (error) {
      console.error("[UserController] Error in updateName:", error);
      next(error);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      await this.changePasswordUseCase.execute({
        id: this.requireUserId(req),
        currentPassword,
        newPassword
      });
      res.status(200).json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      console.error("[UserController] Error in changePassword:", error);
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profiles = await this.listUsersUseCase.execute(this.requireUserId(req));
      res.status(200).json(profiles);
    } catch (error) {
      console.error("[UserController] Error in list:", error);
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.getUserProfileUseCase.execute(this.requireUserId(req), this.requireParamId(req));
      res.status(200).json(profile);
    } catch (error) {
      console.error("[UserController] Error in getById:", error);
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, accessibleSystems } = req.body;
      const profile = await this.updateUserProfileUseCase.execute({
        actorId: this.requireUserId(req),
        id: this.requireParamId(req),
        name,
        accessibleSystems
      });
      res.status(200).json(profile);
    } catch (error) {
      console.error("[UserController] Error in update:", error);
      next(error);
    }
  };

  softDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.softDeleteUserUseCase.execute(this.requireUserId(req), this.requireParamId(req));
      res.status(204).send();
    } catch (error) {
      console.error("[UserController] Error in softDelete:", error);
      next(error);
    }
  };

  private requireParamId(req: AuthenticatedRequest): string {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      throw new AppError("El identificador de usuario es requerido", 400);
    }
    return id;
  }

  private requireUserId(req: AuthenticatedRequest): string {
    if (!req.user) {
      throw new AppError("No autorizado", 401);
    }
    return req.user;
  }
}