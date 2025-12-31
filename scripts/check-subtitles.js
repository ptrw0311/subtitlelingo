import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// 載入環境變數
config({ path: '.env' });

const tursoUrl = process.env.VITE_TURSO_URL;
const tursoAuthToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('❌ 找不到 Turso 環境變數');
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function checkSubtitles() {
  try {
    console.log('🔍 檢查資料庫中的字幕資料...\n');

    // 檢查所有影片
    const moviesResult = await db.execute('SELECT imdb_id, title FROM movies ORDER BY title');
    console.log('📚 資料庫中的影片:');
    moviesResult.rows.forEach(movie => {
      console.log(`  - ${movie.title} (${movie.imdb_id})`);
    });
    console.log();

    // 檢查所有字幕
    const subtitlesResult = await db.execute('SELECT movie_id, COUNT(*) as count FROM subtitles GROUP BY movie_id');
    console.log('📝 各影片的字幕數量:');
    if (subtitlesResult.rows.length === 0) {
      console.log('  ⚠️ 資料庫中沒有任何字幕資料！');
    } else {
      subtitlesResult.rows.forEach(row => {
        const movie = moviesResult.rows.find(m => m.imdb_id === row.movie_id);
        const movieTitle = movie ? movie.title : row.movie_id;
        console.log(`  - ${movieTitle}: ${row.count} 條字幕`);
      });
    }
    console.log();

    // 檢查 Inception 的字幕
    const inceptionResult = await db.execute(
      "SELECT * FROM movies WHERE title LIKE '%Inception%'"
    );

    if (inceptionResult.rows.length > 0) {
      const inception = inceptionResult.rows[0];
      console.log(`🎬 找到 Inception: ${inception.title} (${inception.imdb_id})`);

      const inceptionSubtitles = await db.execute(
        'SELECT * FROM subtitles WHERE movie_id = ? ORDER BY sequence_number LIMIT 5',
        [inception.imdb_id]
      );

      if (inceptionSubtitles.rows.length > 0) {
        console.log(`✅ Inception 有 ${inceptionSubtitles.rows.length}+ 條字幕，前 5 條:`);
        inceptionSubtitles.rows.forEach((sub, index) => {
          console.log(`  ${index + 1}. [${sub.start_time} --> ${sub.end_time}]`);
          console.log(`     ${sub.text.substring(0, 80)}${sub.text.length > 80 ? '...' : ''}`);
        });
      } else {
        console.log('⚠️ Inception 沒有字幕資料！');
      }
    } else {
      console.log('⚠️ 資料庫中找不到 Inception！');
    }
    console.log();

    // 顯示總計
    const totalResult = await db.execute('SELECT COUNT(*) as total FROM subtitles');
    console.log(`📊 資料庫總計: ${totalResult.rows[0].total} 條字幕`);

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkSubtitles().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
