import { createClient } from '@supabase/supabase-js';

// 從環境變數讀取設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// 建立 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 匯出設定
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};

// 測試連線函數
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('movies').select('count').single();
    if (error) throw error;
    console.log('✅ Supabase 連線成功');
    return true;
  } catch (error) {
    console.error('❌ Supabase 連線失敗:', error.message);
    return false;
  }
};