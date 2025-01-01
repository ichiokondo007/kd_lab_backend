// src/types/session.d.ts
import 'express-session';
import { Request } from 'express';
import { Session } from 'express-session';

// セッションデータの型定義
export interface SessionData {
  userId: string;
  userName: string;
  isAuthenticated: boolean;
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
    userName: string;
    isAuthenticated: boolean;
  }
}

declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}
