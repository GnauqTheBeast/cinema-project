import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { QueryTypes } from 'sequelize';
import DatabaseManager from '../../config/database.js';
const PROTO_PATH = path.resolve(process.cwd(), 'proto', 'user.proto');
export async function startGrpcServer() {
    const models = DatabaseManager.getInstance().getModels();
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
    const proto = grpc.loadPackageDefinition(packageDefinition);
    const svc = proto.user;
    const server = new grpc.Server();
    server.addService(svc.UserService.service, {
        ensurePending: async (call, callback) => {
            try {
                const { email, name, password, role_id, address } = call.request;
                const existing = await models.User.findOne({ where: { email } });
                let id = existing?.get('id');
                if (!existing) {
                    id = uuidv4();
                    await models.User.create({
                        id,
                        email,
                        name,
                        password,
                        role_id: role_id || null,
                        address: address || null,
                        status: 'pending'
                    });
                    await models.CustomerProfile.create({
                        id: uuidv4(),
                        user_id: id,
                        total_payment_amount: 0,
                        point: 0,
                        onchain_wallet_address: ''
                    });
                }
                callback(null, { id, created: !existing });
            }
            catch (e) {
                callback({ code: grpc.status.INTERNAL, message: e.message });
            }
        },
        getUserByEmail: async (call, callback) => {
            try {
                const { email } = call.request;
                const user = await models.User.findOne({ where: { email } });
                if (!user)
                    return callback(null, { found: false });
                const data = user.toJSON();
                callback(null, { found: true, user: data });
            }
            catch (e) {
                callback({ code: grpc.status.INTERNAL, message: e.message });
            }
        },
        activateUser: async (call, callback) => {
            try {
                const { email } = call.request;
                const user = await models.User.findOne({ where: { email } });
                if (!user)
                    return callback({ code: grpc.status.NOT_FOUND, message: 'user not found' });
                await user.update({ status: 'active' });
                callback(null, { success: true });
            }
            catch (e) {
                callback({ code: grpc.status.INTERNAL, message: e.message });
            }
        },
        createStaff: async (call, callback) => {
            try {
                const { email, name, password, role_id, address } = call.request;
                // Check if user already exists
                const existing = await models.User.findOne({ where: { email } });
                let id = existing?.get('id');
                let created = false;
                if (!existing) {
                    // Create new staff user with active status
                    id = uuidv4();
                    await models.User.create({
                        id,
                        email,
                        name,
                        password,
                        role_id: role_id || null,
                        address: address || null,
                        status: 'active' // Staff accounts are active immediately
                    });
                    // Create customer profile for staff (they can also be customers)
                    await models.CustomerProfile.create({
                        id: uuidv4(),
                        user_id: id,
                        total_payment_amount: 0,
                        point: 0,
                        onchain_wallet_address: ''
                    });
                    created = true;
                }
                else {
                    // Update existing user to active and staff role
                    await existing.update({
                        status: 'active',
                        role_id: role_id || existing.get('role_id'),
                        name: name || existing.get('name'),
                        address: address || existing.get('address')
                    });
                    id = existing.get('id');
                }
                const message = created
                    ? 'Tạo tài khoản nhân viên thành công'
                    : 'Tài khoản đã tồn tại, đã cập nhật trạng thái active';
                callback(null, { id, created, message });
            }
            catch (e) {
                callback({ code: grpc.status.INTERNAL, message: e.message });
            }
        },
        getPermissionsByRoleId: async (call, callback) => {
            try {
                const { role_id } = call.request;
                if (!role_id) {
                    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'role_id is required' });
                }
                // Query permissions for the role using raw SQL
                const permissions = await models.sequelize.query(`SELECT p.id, p.name, p.code, p.description
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = :role_id`, {
                    replacements: { role_id },
                    type: QueryTypes.SELECT
                });
                callback(null, {
                    permissions: permissions.map(p => ({
                        id: p.id,
                        name: p.name,
                        code: p.code,
                        description: p.description
                    })),
                    success: true,
                    message: 'Permissions retrieved successfully'
                });
            }
            catch (e) {
                callback({ code: grpc.status.INTERNAL, message: e.message });
            }
        }
    });
    const address = process.env.USER_GRPC_ADDRESS || '0.0.0.0:50051';
    await new Promise((resolve, reject) => {
        server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err)
                return reject(err);
            console.log(`user-service gRPC listening on ${address}`);
            resolve();
        });
    });
}
