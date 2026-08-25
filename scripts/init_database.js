import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL nie jest ustawiona w pliku .env');
  process.exit(1);
}

async function initDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔌 Łączenie z bazą danych Neon...');
    await client.connect();
    console.log('✅ Połączono z bazą danych');
    
    console.log('📋 Ładowanie schematu z sql/schema_neon.sql...');
    const schemaSQL = readFileSync(join(__dirname, '..', 'sql', 'schema_neon.sql'), 'utf-8');
    
    console.log('🔧 Tworzenie tabel...');
    await client.query(schemaSQL);
    console.log('✅ Tabele utworzone pomyślnie');
    
    // Sprawdź czy są jakieś produkty
    const result = await client.query('SELECT COUNT(*) as count FROM products');
    const count = parseInt(result.rows[0].count);
    console.log(`📦 Liczba produktów w bazie: ${count}`);
    
  } catch (error) {
    console.error('❌ Błąd podczas inicjalizacji bazy:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Rozłączono z bazą danych');
  }
}

initDatabase();
