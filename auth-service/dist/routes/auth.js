import express from 'express';
import AuthController from '../controllers/authController.js';
class AuthRoutes {
    router;
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Authentication routes
        this.router.post('/register', this.handleAsync(AuthController.register));
        this.router.post('/login', this.handleAsync(AuthController.login));
        this.router.post('/verify-otp', this.handleAsync(AuthController.verifyOtp));
        this.router.post('/resend-otp', this.handleAsync(AuthController.resendOtp));
    }
    // Async error handler wrapper
    handleAsync(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    getRouter() {
        return this.router;
    }
    // Method to add custom middleware
    addMiddleware(middleware) {
        this.router.use(middleware);
        return this;
    }
    // Method to add custom route
    addRoute(method, path, handler) {
        const routeMethod = method.toLowerCase();
        if (typeof this.router[routeMethod] === 'function') {
            this.router[routeMethod](path, this.handleAsync(handler));
        }
        return this;
    }
    // Get all registered routes for debugging
    getRegisteredRoutes() {
        return this.router.stack.map(layer => ({
            method: Object.keys(layer.route?.methods || {})[0]?.toUpperCase() || 'UNKNOWN',
            path: layer.route?.path || 'UNKNOWN'
        }));
    }
    // Method to add validation middleware for specific routes
    addValidation(path, validationMiddleware) {
        this.router.use(path, validationMiddleware);
        return this;
    }
    // Method to add rate limiting for specific routes
    addRateLimit(path, rateLimitMiddleware) {
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
//# sourceMappingURL=auth.js.map