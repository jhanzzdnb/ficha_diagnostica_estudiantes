const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');

// ── HELPER GLOBAL ─────────────────────────────
const formatValue = (value) => {
  if (value === true) return 'SI';
  if (value === false) return 'NO';
  return value ?? '';
};

const app = express();
const PORT = process.env.PORT || 3000;

// ── DATABASE ──────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Si no hay DATABASE_URL (desarrollo local sin PG), usamos memoria
let memStore = [];
const useMem = !process.env.DATABASE_URL;

async function initDB() {
  if (useMem) { console.log('⚠️  Sin DATABASE_URL — usando almacenamiento en memoria (solo desarrollo)'); return; }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fichas (
  id               SERIAL PRIMARY KEY,
  creado_en        TIMESTAMPTZ DEFAULT NOW(),

  -- Sección 1
  nombres          TEXT,
  dni              VARCHAR(8) UNIQUE, -- 🔥 evita duplicados
  fecha_nacimiento DATE,
  edad             VARCHAR(10),
  sexo             VARCHAR(20),
  estado_civil     VARCHAR(20),
  programa         TEXT,
  condicion        VARCHAR(30),
  ciclo            VARCHAR(5),
  turno            VARCHAR(10),

  -- Sección 2
  celular          VARCHAR(15),
  direccion        TEXT,
  distrito         VARCHAR(80),
  provincia        VARCHAR(80),       -- 🆕
  departamento     VARCHAR(80),       -- 🆕
  ingreso_familiar VARCHAR(40),
  trabaja          VARCHAR(5),
  ocupacion        TEXT,

  -- Sección 3
  recibe_apoyo     VARCHAR(5),
  tipo_apoyo       TEXT,
  tipo_apoyo_otro  TEXT,
  necesidades      TEXT,

  -- Sección 4
  seguro_salud        VARCHAR(20),
  estado_emocional    SMALLINT,
  consejeria          VARCHAR(5),

  discapacidad        VARCHAR(5),     -- 🆕
  tipo_discapacidad   TEXT,           -- 🆕
  tipo_discapacidad_otro TEXT,        -- 🆕

  enfermedad          VARCHAR(5),     -- 🆕
  detalle_enfermedad  TEXT,           -- 🆕
  tratamiento         VARCHAR(5),     -- 🆕

  -- Sección 5
  motivacion          TEXT,
  meta_academica      TEXT,
  meta_academica_otro TEXT,
  meta_laboral        TEXT,
  meta_laboral_otro   TEXT,

  -- Sección 6 (Capacitación)
  tema_capacitacion       TEXT,       -- 🆕
  tema_capacitacion_otro  TEXT,       -- 🆕
  participaria_capacitacion VARCHAR(10), -- 🆕
  pagaria_certificacion     VARCHAR(10), -- 🆕

  -- Sección 7
  declaracion      VARCHAR(5)
);
    `);
    console.log('✅ Tabla fichas lista.');
  } catch (err) {
    console.error('❌ Error al crear tabla:', err.message);
  }
}

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── ROUTES ────────────────────────────────────────────────────

// POST /api/ficha — guardar nueva ficha
app.post('/api/ficha', async (req, res) => {
  const d = req.body;
  const row = {
    // EXISTENTES
    nombres: d.nombres || null,
    dni: d.dni || null,
    fecha_nacimiento: d.fechaNacimiento || null,
    edad: d.edad || null,
    sexo: d.sexo || null,
    estado_civil: d.estadoCivil || null,
    programa: d.programa || null,
    condicion: d.condicion || null,
    ciclo: d.ciclo || null,
    turno: d.turno || null,
    celular: d.celular || null,
    direccion: d.direccion || null,
    distrito: d.distrito || null,
    ingreso_familiar: d.ingresoFamiliar || null,
    trabaja: d.trabaja || null,
    ocupacion: d.ocupacion || null,
    recibe_apoyo: d.recibeApoyo || null,
    tipo_apoyo: d.tipoApoyo || null,
    tipo_apoyo_otro: d.tipoApoyoOtro || null,
    necesidades: d.necesidades || null,
    seguro_salud: d.seguroSalud || null,
    estado_emocional: d.estadoEmocional ? parseInt(d.estadoEmocional) : null,
    consejeria: d.consejeria || null,
    motivacion: d.motivacion || null,
    meta_academica: d.metaAcademica || null,
    meta_academica_otro: d.metaAcademicaOtro || null,
    meta_laboral: d.metaLaboral || null,
    meta_laboral_otro: d.metaLaboralOtro || null,
    declaracion: d.declaracion || null,

    // 🔥 NUEVOS CAMPOS

    // Ubicación
    departamento: d.departamento || null,
    provincia: d.provincia || null,

    // Capacitación
    tema_capacitacion: d.tema_capacitacion || null,
    tema_capacitacion_otro: d.tema_capacitacion_otro || null,
    participaria_capacitacion: d.participaria_capacitacion || null,
    pagaria_certificacion: d.pagaria_certificacion || null,

    // Discapacidad (BOOLEAN)
    discapacidad: d.discapacidad === true || d.discapacidad === 'SI',
    tipo_discapacidad: d.tipoDiscapacidad || null,
    tipo_discapacidad_otro: d.tipoDiscapacidadOtro || null,

    // Enfermedad (BOOLEAN)
    enfermedad: d.enfermedad === true || d.enfermedad === 'SI',
    detalle_enfermedad: d.detalleEnfermedad || null,
    tratamiento: d.tratamiento === true || d.tratamiento === 'SI'
  };

  if (useMem) {
    row.id = memStore.length + 1;
    row.creado_en = new Date().toISOString();
    memStore.push(row);
    return res.json({ ok: true, id: row.id });
  }

  const cols = Object.keys(row);
  const vals = Object.values(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO fichas (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`;

  try {
    const result = await pool.query(sql, vals);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Error INSERT:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/fichas — listar todas (panel admin)
app.get('/api/fichas', async (req, res) => {
  try {
    let rows;
    if (useMem) {
      rows = memStore;
    } else {
      const result = await pool.query('SELECT * FROM fichas ORDER BY creado_en DESC');
      rows = result.rows;
    }
    const cleanRows = rows.map(r => ({
  ...r,

  trabaja: r.trabaja === true ? 'Sí' : r.trabaja === false ? 'No' : r.trabaja,
  consejeria: r.consejeria === true ? 'Sí' : r.consejeria === false ? 'No' : r.consejeria,
  discapacidad: r.discapacidad === true ? 'Sí' : r.discapacidad === false ? 'No' : r.discapacidad,
  enfermedad: r.enfermedad === true ? 'Sí' : r.enfermedad === false ? 'No' : r.enfermedad,
  tratamiento: r.tratamiento === true ? 'Sí' : r.tratamiento === false ? 'No' : r.tratamiento
}));

res.json({ ok: true, total: cleanRows.length, data: cleanRows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/export/excel — descargar Excel con todas las fichas
app.get('/api/export/excel', async (req, res) => {
  try {
    let rows;
    if (useMem) {
      rows = memStore;
    } else {
      const result = await pool.query('SELECT * FROM fichas ORDER BY creado_en DESC');
      rows = result.rows;
    }

    const HEADERS = {
      id: 'ID', creado_en: 'Fecha Registro', nombres: 'Apellidos y Nombres',
      dni: 'DNI', fecha_nacimiento: 'Fecha Nacimiento', edad: 'Edad',
      sexo: 'Sexo', estado_civil: 'Estado Civil', programa: 'Programa',
      condicion: 'Condición', ciclo: 'Ciclo', turno: 'Turno',
      celular: 'Celular/Teléfono',
      direccion: 'Dirección', distrito: 'Distrito',
      ingreso_familiar: 'Ingreso Familiar', trabaja: 'Trabaja', ocupacion: 'Ocupación',
      recibe_apoyo: 'Recibe Apoyo', tipo_apoyo: 'Tipo Apoyo', tipo_apoyo_otro: 'Tipo Apoyo (otro)',
      necesidades: 'Necesidades', seguro_salud: 'Seguro Salud',
      estado_emocional: 'Estado Emocional (1-5)', consejeria: 'Consejería Psicológica',
      motivacion: 'Motivación', meta_academica: 'Meta Académica',
      meta_academica_otro: 'Meta Académica (otro)', meta_laboral: 'Meta Laboral',
      meta_laboral_otro: 'Meta Laboral (otro)', declaracion: 'Declaración',
      departamento: 'Departamento',
      provincia: 'Provincia',
      tema_capacitacion: 'Tema Capacitación',
      tema_capacitacion_otro: 'Tema (otro)',
      participaria_capacitacion: 'Participaría',
      pagaria_certificacion: 'Pagaría Certificación',
      discapacidad: '¿Presenta discapacidad?',
      tipoDiscapacidad: 'Tipo de discapacidad',
      tipoDiscapacidadOtro: 'Tipo de discapacidad (otro)',
      enfermedad: '¿Padece enfermedad?',
      detalleEnfermedad: 'Detalle de enfermedad',
      tratamiento: '¿Está en tratamiento?'
    };

    const headerRow = Object.values(HEADERS);
    const dataRows = rows.map(r =>
      Object.keys(HEADERS).map(k => formatValue(r[k]))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    ws['!cols'] = headerRow.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Fichas');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Fichas_IESTP_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/stats — estadísticas básicas
app.get('/api/stats', async (req, res) => {
  try {
    if (useMem) {
      return res.json({ ok: true, total: memStore.length, hoy: 0 });
    }
    const total = await pool.query('SELECT COUNT(*) FROM fichas');
    const hoy = await pool.query("SELECT COUNT(*) FROM fichas WHERE creado_en::date = CURRENT_DATE");
    res.json({ ok: true, total: parseInt(total.rows[0].count), hoy: parseInt(hoy.rows[0].count) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AUTH ──────────────────────────────────────────────────────
// Credenciales (puedes cambiarlas aquí)
const ADMIN_USERS = [
  { usuario: 'admin', password: 'iestp2026', nombre: 'Administrador' },
  { usuario: 'cabana', password: 'bienestar1', nombre: 'Bienestar IESTP' },
];

app.post('/api/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = ADMIN_USERS.find(u => u.usuario === usuario && u.password === password);
  if (user) {
    res.json({ ok: true, nombre: user.nombre });
  } else {
    res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
  }
});

// Rutas de páginas
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/gracias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gracias.html'));
});

// GET /api/check-dni/:dni
app.get('/api/check-dni/:dni', async (req, res) => {
  const { dni } = req.params;
  if (useMem) {
    return res.json({ ok: true, existe: memStore.some(r => r.dni === dni) });
  }
  try {
    const result = await pool.query('SELECT id FROM fichas WHERE dni = $1 LIMIT 1', [dni]);
    res.json({ ok: true, existe: result.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Cualquier otra ruta → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ─────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
});

// NOTE: routes added below via append