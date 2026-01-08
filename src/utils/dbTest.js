import { testConnection, movieDB } from '../config/turso-api.js';

// 測試資料庫連線和基本操作
export const runDBTest = async () => {
  console.log('🔍 測試 Vercel API + Turso 資料庫連線...');

  // 測試基本連線
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ 資料庫連線失敗');
    return false;
  }

  // 測試基本查詢
  try {
    const { data: movies, error } = await movieDB.getAll(5);
    if (error) {
      console.error('❌ 查詢影片失敗:', error);
      return false;
    }

    console.log('✅ API 與資料庫連線成功！');
    console.log('📊 目前影片數量:', movies?.length || 0);

    return true;
  } catch (error) {
    console.error('❌ 資料庫測試失敗:', error);
    return false;
  }
};

// 在開發模式下自動執行測試
if (import.meta.env.DEV) {
  runDBTest();
}