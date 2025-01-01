import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import session from 'express-session';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { User } from './types/user';
import { SessionData } from './types/session';

// 環境変数の読み込み
dotenv.config();

const app = express();
const port = process.env.PORT || '3000';
const url = process.env.URL || 'http://localhost';
const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-key';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// 型定義
interface ErrorResponse {
  message: string;
  error?: string;
}

interface SuccessResponse {
  message: string;
  redirectTo?: string;
  userId?: string;
  userName?: string;
  csrfToken?: string;
}

app.use(express.json());
// CORS設定
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  })
);

// JSONファイルからユーザー情報を読み込む
const loadUsers = (): User[] => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8')
    );
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

const users = loadUsers();

// セッション設定
// 24時間
// lax：同一ドメイン内のみ
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24時間
      sameSite: 'lax',
    },
  })
);


/**
 * ログインエンドポイント
 */
const loginHandler = async (
  req: Request,
  res: Response<SuccessResponse | ErrorResponse>
): Promise<void> => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      res.status(400).json({ message: 'ID and password are required' });
      return;
    }

    const user = users.find((u) => u.id === id && u.password === password);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (req.session) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.isAuthenticated = true;
    }

    res.status(200).json({
      message: 'Login successful',
      redirectTo: '/top',
      userId: user.id,
      userName: user.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * 認証チェック用ミドルウェア
 */
const isAuthenticated = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  if (req.session?.isAuthenticated && req.session?.userId) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
};

/**
 * トップページエンドポイント
 */
const topPageHandler = (
  req: Request,
  res: Response<SuccessResponse | ErrorResponse>
): void => {
  if (!req.session?.userId || !req.session?.userName) {
    res.status(403).json({ message: 'Session data not found' });
    return;
  }

  res.json({
    message: 'Welcome to the top page!',
    userId: req.session.userId,
    userName: req.session.userName,
  });
};

// ログアウトハンドラ
const logoutHandler = (
  req: Request,
  res: Response<SuccessResponse | ErrorResponse>
): void => {
  if (!req.session) {
    res.status(400).json({ message: 'No session exists' });
    return;
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({
        message: 'Logout failed',
        error: err.message
      });
      return;
    }

    res.clearCookie('connect.sid', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    res.json({ message: 'Logged out successfully' });
  });
};

// ルートの設定
app.post('/login', loginHandler);
app.get('/top', isAuthenticated, topPageHandler);
app.post('/logout', isAuthenticated, logoutHandler);

// カスタムエラー型の定義
interface CSRFError extends Error {
  code?: string;
}

const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
  });
};

app.use(errorHandler);

// サーバー起動
app.listen(parseInt(port), () => {
  console.log(`Server is running on ${url}:${port}`);
});
