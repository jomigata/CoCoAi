import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestore 데이터베이스 인스턴스
export const db = admin.firestore();

// Firebase Auth 인스턴스
export const auth = admin.auth();

// Firebase Storage 인스턴스
export const storage = admin.storage();

// 서버 타임스탬프 유틸리티
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

// 배열 유니온 유틸리티
export const arrayUnion = admin.firestore.FieldValue.arrayUnion;

// 배열 제거 유틸리티
export const arrayRemove = admin.firestore.FieldValue.arrayRemove;

// 증가 유틸리티
export const increment = admin.firestore.FieldValue.increment;

export default admin;
