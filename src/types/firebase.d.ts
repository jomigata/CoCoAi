import { User } from 'firebase/auth';

// Firebase User 타입 확장
declare module 'firebase/auth' {
  interface User {
    role?: 'client' | 'counselor' | 'admin';
  }
}

export {};
