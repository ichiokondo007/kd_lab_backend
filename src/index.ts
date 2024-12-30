import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const URL = process.env.URL || 'http://localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// users.json読み込み
const usersFilePath = path.join(__dirname, 'users.json');
const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

// セッション設定
app.use(session({
  secret: 'kdlab', // セッション暗号化キー
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS環境ではtrueにする
}));

app.use(express.json());

/**
  * 認証エンドポイント
  * POST /login
  */
app.post('/login', (req, res) => {
  const { id, password } = req.body;

  const user = users.find(user => user.id === id && user.password === password);
  if (user) {
    // 認証成功
    req.session.userId = user.id;
    res.status(200).json({ message: 'Login successful', redirectTo: '/top' });
  } else {
    // 認証失敗
    res.status(401).json({ message: 'ID or password is incorrect' });
  }
});

// セッション確認用のミドルウェア
/**
 *  認証チェックミドルウェア
 *  @param {Object} req - リクエストオブジェクト
 *  @param {Object} res - レスポンスオブジェクト
 *  @param {Function} next - 次のミドルウェアを実行する関数
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
};

/**
  * トップページ
  * GET /top
  * @returns {Object} - トップページのレスポンス
  * @throws {Error} - 認証エラー
  */
app.get('/top', isAuthenticated, (req, res) => {
  res.json({ message: 'Welcome to the top page!', userId: req.session.userId });
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`KDLab Server is running at ${URL}:${PORT}`);
});

