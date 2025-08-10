const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { randomUUID } = require('crypto');

let SQL; // module

async function loadSqlModule() {
  if (!SQL) {
    SQL = await initSqlJs({});
  }
  return SQL;
}

async function initDb(dbPath) {
  await loadSqlModule();
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS tabs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    date_added TEXT NOT NULL,
    image_files TEXT NOT NULL
  );`);
  // migration: ensure new columns
  const info = db.exec(`PRAGMA table_info(tabs);`);
  const existingCols = info.length ? info[0].values.map(v => v[1]) : [];
  const addCol = (name, def) => { if (!existingCols.includes(name)) db.run(`ALTER TABLE tabs ADD COLUMN ${name} ${def};`); };
  addCol('style', 'TEXT');
  addCol('difficulty', 'TEXT');
  addCol('tags', 'TEXT'); // JSON array
  addCol('notes', 'TEXT');
  return { db, dbPath };
}

function persist(wrapper) {
  const data = Buffer.from(wrapper.db.export());
  fs.writeFileSync(wrapper.dbPath, data);
}

function insertTab(wrapper, libRoot, { title, artist, images, style = '', difficulty = '', tags = [], notes = '' }) {
  const id = randomUUID();
  const tabDir = path.join(libRoot, id);
  fs.mkdirSync(tabDir, { recursive: true });
  const copiedNames = [];
  images.forEach((srcPath, idx) => {
    const ext = path.extname(srcPath) || '.jpg';
    const filename = `${idx + 1}${ext}`;
    const dest = path.join(tabDir, filename);
    fs.copyFileSync(srcPath, dest);
    copiedNames.push(filename);
  });
  const dateStr = new Date().toISOString();
  const stmt = wrapper.db.prepare(`INSERT INTO tabs (id,title,artist,date_added,image_files,style,difficulty,tags,notes) VALUES (?,?,?,?,?,?,?,?,?)`);
  stmt.run([id, title.trim(), artist.trim(), dateStr, JSON.stringify(copiedNames), style, difficulty, JSON.stringify(tags||[]), notes]);
  stmt.free();
  persist(wrapper);
  return { id, title, artist, date_added: dateStr, image_files: copiedNames, style, difficulty, tags, notes };
}

function updateTab(wrapper, libRoot, { id, title, artist, images, style = '', difficulty = '', tags = [], notes = '' }) {
  // We will reconstruct directory but reuse existing file contents where possible
  const tabDir = path.join(libRoot, id);
  const tempDir = path.join(libRoot, id + '_tmp');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  const copiedNames = [];
  images.forEach((item, idx) => {
    const filename = `${idx + 1}.jpg`; // normalized sequential naming
    const dest = path.join(tempDir, filename);
    if (item.existing && item.filename) {
      // copy from old dir
      const srcOld = path.join(tabDir, item.filename);
      if (fs.existsSync(srcOld)) fs.copyFileSync(srcOld, dest);
    } else if (item.path) {
      const ext = path.extname(item.path) || '.jpg';
      const finalName = `${idx + 1}${ext}`;
      const finalDest = path.join(tempDir, finalName);
      fs.copyFileSync(item.path, finalDest);
      copiedNames.push(finalName);
      return; // skip push below
    }
    copiedNames.push(filename);
  });
  // swap dirs
  if (fs.existsSync(tabDir)) fs.rmSync(tabDir, { recursive: true, force: true });
  fs.renameSync(tempDir, tabDir);
  const stmt = wrapper.db.prepare(`UPDATE tabs SET title=?, artist=?, image_files=?, style=?, difficulty=?, tags=?, notes=? WHERE id=?`);
  stmt.run([title.trim(), artist.trim(), JSON.stringify(copiedNames), style, difficulty, JSON.stringify(tags||[]), notes, id]);
  stmt.free();
  persist(wrapper);
  return { id, title, artist, image_files: copiedNames, style, difficulty, tags, notes };
}

function getAllTabs(wrapper) {
  const res = wrapper.db.exec('SELECT * FROM tabs ORDER BY date_added DESC');
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    obj.image_files = JSON.parse(obj.image_files);
    if (obj.tags) { try { obj.tags = JSON.parse(obj.tags); } catch { obj.tags = []; } }
    else obj.tags = [];
    return obj;
  });
}

function deleteTabById(wrapper, libRoot, id) {
  const stmt = wrapper.db.prepare('DELETE FROM tabs WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  persist(wrapper);
  const dir = path.join(libRoot, id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

module.exports = { initDb, insertTab, updateTab, getAllTabs, deleteTabById };
