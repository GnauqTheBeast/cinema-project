import express, { Router, Request, Response, NextFunction } from 'express';
import AuthController from '../controllers/authController.js';
import { IController } from '../types/index.js';

interface IRoute {
  method: string;
  path: string;
}

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/register', this.handleAsync(AuthController.register));
    this.router.post('/login', this.handleAsync(AuthController.login));
    this.router.post('/admin/login', this.handleAsync(AuthController.loginAdmin));
    this.router.post('/verify-otp', this.handleAsync(AuthController.verifyOtp));
    this.router.post('/resend-otp', this.handleAsync(AuthController.resendOtp));
    this.router.post('/staff', this.handleAsync(AuthController.createStaff));
    this.router.get('/permissions', this.handleAsync(AuthController.getPermissions));
    this.router.post('/verify-token', this.handleAsync(AuthController.verifyToken));
  }

  private handleAsync(fn: IController) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }

  public addMiddleware(middleware: express.RequestHandler): AuthRoutes {
    this.router.use(middleware);
    return this;
  }

  public addRoute(method: string, path: string, handler: IController): AuthRoutes {
    const routeMethod = method.toLowerCase() as keyof Router;
    if (typeof this.router[routeMethod] === 'function') {
      (this.router[routeMethod] as Function)(path, this.handleAsync(handler));
    }
    return this;
  }

  public getRegisteredRoutes(): IRoute[] {
    return this.router.stack.map(layer => ({
      method: Object.keys((layer.route as any)?.methods || {})[0]?.toUpperCase() || 'UNKNOWN',
      path: layer.route?.path || 'UNKNOWN'
    }));
  }

  public addValidation(path: string, validationMiddleware: express.RequestHandler): AuthRoutes {
    this.router.use(path, validationMiddleware);
    return this;
  }

  public addRateLimit(path: string, rateLimitMiddleware: express.RequestHandler): AuthRoutes {
    this.router.use(path, rateLimitMiddleware);
    return this;
  }
}

const authRoutes = new AuthRoutes();

export default authRoutes.getRouter();

export { AuthRoutes };