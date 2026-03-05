import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import cors from 'cors';
import express from 'express';
import { sequelize, connectToDatabase } from './db';
import apiRoutes from './routes';
import themeRoutes from './routes/theme';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin:
      process.env.CLIENT_ORIGIN ||
      `http://localhost:${process.env.CLIENT_PORT || 3000}`,
    credentials: true,
  })
);
app.use('/api', optionalAuthMiddleware, themeRoutes);
app.use('/api', authMiddleware, apiRoutes);

const PORT = Number(process.env.SERVER_PORT) || 3001;

(async () => {
  try {
    await connectToDatabase();
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false, alter: true });
    } else {
      await sequelize.sync({ force: false, alter: false });
    }
    app.listen(PORT, () => {
      console.log(`  ➜ 🎸 Server запущен на порту: ${PORT}`);
    });
  } catch (err) {
    console.error('Не удалось запустить сервер из-за проблем с БД: ', err);
    process.exit(1);
  }
})();
