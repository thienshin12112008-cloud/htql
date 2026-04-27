// ===== DATABASE (localStorage) =====
const STORAGE_KEY = 'duyhoangtoan_db';

function loadDB() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      DB.students = parsed.students || [];
      DB.classes  = parsed.classes  || [];
      DB.receipts  = parsed.receipts  || [];
      DB.discounts = parsed.discounts || [];
    }
  } catch(e) { console.error('Load DB error:', e); }
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch(e) { console.error('Save DB error:', e); }
}

const DB = {
  students: [],
  classes: [],
  receipts: [],
  discounts: []
};

// ===== HELPERS =====
function getClassById(id) { return DB.classes.find(c => c.id === id); }
function getStudentsByClass(classId) { return DB.students.filter(s => s.centerClass === classId); }
function formatCurrency(n) { return Number(n).toLocaleString('vi-VN') + ' VNĐ'; }
function formatDate(d) { if (!d) return ''; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }

function genStudentId(name, classId) {
  const parts = name.trim().split(/\s+/);
  const lastName = parts[parts.length - 1];
  const noAccent = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\u0111/gi,'d').toUpperCase();
  const base = `${noAccent}-${classId}`;
  const usedNums = new Set(DB.students.map(s => {
    const p = s.id.split('-');
    return parseInt(p[p.length - 1]);
  }).filter(n => !isNaN(n)));
  let digits = 3;
  let num;
  while (true) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const available = (max - min + 1) - [...usedNums].filter(n => n >= min && n <= max).length;
    if (available > 0) {
      do { num = Math.floor(Math.random() * (max - min + 1)) + min; } while (usedNums.has(num));
      break;
    }
    digits++;
  }
  return `${base}-${num}`;
}

function genClassId(name) {
  const noAccent = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/\s+/g,'').toUpperCase();
  const existing = new Set(DB.classes.map(c => c.id));
  let num;
  do { num = Math.floor(Math.random() * 900) + 100; } while (existing.has(`${noAccent}-${num}`));
  return `${noAccent}-${num}`;
}

// Load dữ liệu khi khởi động
loadDB();

function genId(prefix, arr) {
  const nums = arr.map(x => parseInt(x.id.replace(prefix,''))).filter(n=>!isNaN(n));
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return prefix + String(next).padStart(3,'0');
}
