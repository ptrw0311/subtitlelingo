import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: '.env' });

const db = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function checkMovies() {
  try {
    console.log('🔍 檢查 movies 資料表結構...\n');

    const schemaResult = await db.execute("PRAGMA table_info(movies)");
    console.log('📋 movies 資料表欄位:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.type})`);
    });
    console.log();

    const inceptionResult = await db.execute(
      "SELECT * FROM movies WHERE title LIKE '%Inception%'"
    );

    if (inceptionResult.rows.length > 0) {
      console.log('🎬 Inception 的完整資料:');
      console.log(JSON.stringify(inceptionResult.rows[0], null, 2));
    } else {
      console.log('⚠️ 找不到 Inception');
    }

    console.log();

    // 檢查所有影片的 id
    const allMovies = await db.execute('SELECT id, imdb_id, title FROM movies');
    console.log('📚 所有影片的 ID:');
    allMovies.rows.forEach(movie => {
      console.log(`  - ${movie.title}`);
      console.log(`    id: ${movie.id}`);
      console.log(`    imdb_id: ${movie.imdb_id}`);
    });

  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  }
}

checkMovies().then(() => {
  console.log('\n✨ 檢查完成');
  process.exit(0);
});
