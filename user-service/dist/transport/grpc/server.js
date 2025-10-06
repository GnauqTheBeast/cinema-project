import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const PROTO_PATH = path.resolve(process.cwd(), 'proto', 'user.proto');
export async function startGrpcServer(models) {
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
        }
    });
    const address = process.env.USER_GRPC_ADDRESS || '0.0.0.0:50051';
    await new Promise((resolve, reject) => {
        server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err)
                return reject(err);
            server.start();
            console.log(`user-service gRPC listening on ${address}`);
            resolve();
        });
    });
}
