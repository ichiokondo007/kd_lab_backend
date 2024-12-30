
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { User } from './types/user';

dotenv.config();

const app = express();
const URL = process.env.URL || 'http://localhost';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// users.json読み込み
const usersFilePath = path.join(__dirname, 'users.json');
const users: User[] = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

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
app.post('/login', (req: Request, res: Response) => {
  const { id, password } = req.body;

  const user = users.find(user => user.id === id && user.password === password);
  if (user) {
    // 認証成功
    req.session.userId = user.id;
    req.session.userName = user.name; // nameをセッションに保存
    res.status(200).json({ message: 'Login successful', redirectTo: '/top' });
  } else {
    // 認証失敗
    res.status(401).json({ message: 'ID or password is incorrect' });
  }
});

// セッション確認用のミドルウェア
/**
 *  認証チェックミドルウェア
 *  @param {Request} req - リクエストオブジェクト
 *  @param {Response} res - レスポンスオブジェクト
 *  @param {NextFunction} next - 次のミドルウェアを実行する関数
 */
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId && req.session.userName) {
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
app.get('/top', isAuthenticated, (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the top page!',
    userId: req.session.userId,
    userName: req.session.userName // セッションからユーザー名を取得してレスポンス
  });
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`KDLab Server is running at ${URL}:${PORT}`);
});
