"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.increment = exports.arrayRemove = exports.arrayUnion = exports.serverTimestamp = exports.storage = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
// Firebase Admin SDK 초기화
if (!admin.apps.length) {
    admin.initializeApp();
}
// Firestore 데이터베이스 인스턴스
exports.db = admin.firestore();
// Firebase Auth 인스턴스
exports.auth = admin.auth();
// Firebase Storage 인스턴스
exports.storage = admin.storage();
// 서버 타임스탬프 유틸리티
exports.serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
// 배열 유니온 유틸리티
exports.arrayUnion = admin.firestore.FieldValue.arrayUnion;
// 배열 제거 유틸리티
exports.arrayRemove = admin.firestore.FieldValue.arrayRemove;
// 증가 유틸리티
exports.increment = admin.firestore.FieldValue.increment;
exports.default = admin;
//# sourceMappingURL=firebaseAdmin.js.map