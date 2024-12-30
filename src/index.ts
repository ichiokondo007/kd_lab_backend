import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// 環境変数からURLとポートを取得
const URL = process.env.URL || 'http://localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.get('/', (req, res) => {
  res.send('KD Lab Backend API');
});

app.listen(PORT, () => {
  console.log(`Server is running at ${URL}:${PORT}`);
});
