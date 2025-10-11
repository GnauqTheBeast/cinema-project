import express from 'express';
import AuthController from '../controllers/authController.js';
class AuthRoutes {
    router;
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/register', this.handleAsync(AuthController.register));
        this.router.post('/login', this.handleAsync(AuthController.login));
        this.router.post('/admin/login', this.handleAsync(AuthController.loginAdmin));
        this.router.post('/verify-otp', this.handleAsync(AuthController.verifyOtp));
        this.router.post('/resend-otp', this.handleAsync(AuthController.resendOtp));
        this.router.post('/staff', this.handleAsync(AuthController.createStaff));
        this.router.get('/permissions', this.handleAsync(AuthController.getPermissions));
    }
    handleAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    getRouter() {
        return this.router;
    }
    addMiddleware(middleware) {
        this.router.use(middleware);
        return this;
    }
    addRoute(method, path, handler) {
        const routeMethod = method.toLowerCase();
        if (typeof this.router[routeMethod] === 'function') {
            this.router[routeMethod](path, this.handleAsync(handler));
        }
        return this;
    }
    getRegisteredRoutes() {
        return this.router.stack.map(layer => ({
            method: Object.keys(layer.route?.methods || {})[0]?.toUpperCase() || 'UNKNOWN',
            path: layer.route?.path || 'UNKNOWN'
        }));
    }
    addValidation(path, validationMiddleware) {
        this.router.use(path, validationMiddleware);
        return this;
    }
    addRateLimit(path, rateLimitMiddleware) {
        this.router.use(path, rateLimitMiddleware);
        return this;
    }
}
const authRoutes = new AuthRoutes();
export default authRoutes.getRouter();
export { AuthRoutes };
//# sourceMappingURL=auth.js.map