import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 코드 스플리팅 및 번들 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Firebase 관련 라이브러리
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          // UI 라이브러리
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          // 페이지별 청크 분할
          'auth-pages': [
            './src/pages/Auth/LoginPage.tsx',
            './src/pages/Auth/RegisterPage.tsx'
          ],
          'profiling-pages': [
            './src/pages/Profiling/PersonalProfilingPage.tsx',
            './src/pages/Profiling/ProfilingResultsPage.tsx'
          ],
          'group-pages': [
            './src/pages/Groups/GroupsPage.tsx',
            './src/pages/Groups/CreateGroupPage.tsx',
            './src/pages/Groups/GroupDiagnosisPage.tsx',
            './src/pages/Groups/WeeklyReportPage.tsx'
          ],
          'communication-pages': [
            './src/pages/Communication/ConversationStarterPage.tsx',
            './src/pages/Communication/EmotionDiaryPage.tsx',
            './src/pages/Communication/MessageTemplatePage.tsx',
            './src/pages/Communication/ValueAnalysisPage.tsx'
          ],
          'gamification-pages': [
            './src/pages/Garden/RelationshipGardenPage.tsx',
            './src/pages/Achievements/AchievementsPage.tsx'
          ]
        },
        // 청크 파일명 최적화
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // 번들 크기 제한 설정
    chunkSizeWarningLimit: 500,
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  define: {
    'process.env': process.env,
  },
})
