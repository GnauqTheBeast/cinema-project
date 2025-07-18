import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})(); 