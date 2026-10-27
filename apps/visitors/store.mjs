import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export const validVisitor = id => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
export function visitorStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS visitors (hash TEXT PRIMARY KEY) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS totals (id INTEGER PRIMARY KEY CHECK(id=1), total INTEGER NOT NULL, since TEXT NOT NULL);
    INSERT OR IGNORE INTO totals VALUES (1,0,strftime('%Y-%m-%dT%H:%M:%fZ','now'));`);
  const read = db.prepare('SELECT total,since FROM totals WHERE id=1');
  const insert = db.prepare('INSERT OR IGNORE INTO visitors VALUES (?)');
  const increment = db.prepare('UPDATE totals SET total=total+1 WHERE id=1');
  return {
    read: () => ({ ...read.get() }),
    visit(id) {
      if (!validVisitor(id)) throw Error('Invalid visitor identifier');
      db.exec('BEGIN IMMEDIATE');
      try {
        if (insert.run(createHash('sha256').update(id).digest('hex')).changes) increment.run();
        const result = { ...read.get() };
        db.exec('COMMIT');
        return result;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close: () => db.close(),
  };
}
