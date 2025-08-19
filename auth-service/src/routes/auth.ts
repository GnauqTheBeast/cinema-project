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
    // Authentication routes
    this.router.post('/register', this.handleAsync(AuthController.register));
    this.router.post('/login', this.handleAsync(AuthController.login));
    this.router.post('/verify-otp', this.handleAsync(AuthController.verifyOtp));
  }

  // Async error handler wrapper
  private handleAsync(fn: IController) {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }

  // Method to add custom middleware
  public addMiddleware(middleware: express.RequestHandler): AuthRoutes {
    this.router.use(middleware);
    return this;
  }

  // Method to add custom route
  public addRoute(method: string, path: string, handler: IController): AuthRoutes {
    const routeMethod = method.toLowerCase() as keyof Router;
    if (typeof this.router[routeMethod] === 'function') {
      (this.router[routeMethod] as Function)(path, this.handleAsync(handler));
    }
    return this;
  }

  // Get all registered routes for debugging
  public getRegisteredRoutes(): IRoute[] {
    return this.router.stack.map(layer => ({
      method: Object.keys(layer.route?.methods || {})[0]?.toUpperCase() || 'UNKNOWN',
      path: layer.route?.path || 'UNKNOWN'
    }));
  }

  // Method to add validation middleware for specific routes
  public addValidation(path: string, validationMiddleware: express.RequestHandler): AuthRoutes {
    this.router.use(path, validationMiddleware);
    return this;
  }

  // Method to add rate limiting for specific routes
  public addRateLimit(path: string, rateLimitMiddleware: express.RequestHandler): AuthRoutes {
    this.router.use(path, rateLimitMiddleware);
    return this;
  }
}

// Create and export router instance
const authRoutes = new AuthRoutes();

// Export router for Express app
export default authRoutes.getRouter();

// Export class for potential extension
export { AuthRoutes };