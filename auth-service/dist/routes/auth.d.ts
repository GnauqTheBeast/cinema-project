import express, { Router } from 'express';
import { IController } from '../types/index.js';
interface IRoute {
    method: string;
    path: string;
}
declare class AuthRoutes {
    private router;
    constructor();
    private initializeRoutes;
    private handleAsync;
    getRouter(): Router;
    addMiddleware(middleware: express.RequestHandler): AuthRoutes;
    addRoute(method: string, path: string, handler: IController): AuthRoutes;
    getRegisteredRoutes(): IRoute[];
    addValidation(path: string, validationMiddleware: express.RequestHandler): AuthRoutes;
    addRateLimit(path: string, rateLimitMiddleware: express.RequestHandler): AuthRoutes;
}
declare const _default: express.Router;
export default _default;
export { AuthRoutes };
//# sourceMappingURL=auth.d.ts.map