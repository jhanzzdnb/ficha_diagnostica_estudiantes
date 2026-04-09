# 📋 Ficha Diagnóstica del Estudiante – IESTP Cabana

Sistema web para el registro y seguimiento de fichas diagnósticas estudiantiles.
**Backend:** Node.js + Express · **Base de datos:** PostgreSQL · **Hosting gratuito:** Railway

---

## 🚀 DESPLIEGUE GRATUITO EN RAILWAY (Paso a Paso)

### Paso 1 — Crear cuenta en Railway
1. Ve a **https://railway.app**
2. Haz clic en **"Start a New Project"**
3. Regístrate con tu cuenta de **GitHub** (necesitarás tener una)

### Paso 2 — Subir tu código a GitHub
1. Ve a **https://github.com** → New repository
2. Nómbralo: `ficha-diagnostica-iestp`
3. Sube todos los archivos de esta carpeta:
   ```
   ficha-diagnostica/
   ├── server.js
   ├── package.json
   ├── public/
   │   ├── index.html
   │   └── admin.html
   └── README.md
   ```
   Puedes usar GitHub Desktop o los comandos:
   ```bash
   git init
   git add .
   git commit -m "Ficha diagnóstica IESTP Cabana"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/ficha-diagnostica-iestp.git
   git push -u origin main
   ```

### Paso 3 — Crear proyecto en Railway
1. En Railway → **"New Project"** → **"Deploy from GitHub repo"**
2. Selecciona el repositorio `ficha-diagnostica-iestp`
3. Railway detecta Node.js automáticamente ✅

### Paso 4 — Agregar base de datos PostgreSQL
1. En tu proyecto Railway → **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway crea la base de datos y la conecta automáticamente
3. Ve a la variable `DATABASE_URL` — Railway la inyecta sola ✅

### Paso 5 — Obtener tu URL pública
1. En tu servicio → pestaña **"Settings"** → **"Domains"**
2. Haz clic en **"Generate Domain"**
3. Obtendrás algo como: `https://ficha-diagnostica-iestp.up.railway.app`

### Paso 6 — ¡Compartir con estudiantes!
- **Formulario:** `https://TU-APP.up.railway.app`
- **Panel Admin:** `https://TU-APP.up.railway.app/admin`

---

## 💡 PLAN GRATUITO DE RAILWAY
- **$5 USD de crédito gratuito por mes** (suficiente para uso académico)
- PostgreSQL incluido
- Sin tarjeta de crédito requerida
- URL pública permanente
- Se reinicia si no hay tráfico por 30 min (el primer request tarda ~10 seg)

---

## 🏃 PROBAR EN LOCAL (sin internet)

```bash
# 1. Instalar dependencias
npm install

# 2. Sin PostgreSQL (usa memoria RAM temporal)
node server.js

# 3. Con PostgreSQL local
DATABASE_URL=postgresql://usuario:password@localhost:5432/ficha_db node server.js

# Abre: http://localhost:3000
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
ficha-diagnostica/
├── server.js          ← Backend Node.js + API REST
├── package.json       ← Dependencias
├── public/
│   ├── index.html     ← Formulario para estudiantes
│   └── admin.html     ← Panel admin para el docente
└── README.md
```

## 🔗 ENDPOINTS API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/ficha | Guardar nueva ficha |
| GET | /api/fichas | Listar todas las fichas |
| GET | /api/export/excel | Descargar Excel con todas las fichas |
| GET | /api/stats | Estadísticas (total, hoy) |

---

## 🛡️ TABLA POSTGRESQL (se crea automáticamente)

```sql
CREATE TABLE fichas (
  id SERIAL PRIMARY KEY,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  nombres TEXT, dni VARCHAR(8), fecha_nacimiento DATE, edad VARCHAR(10),
  sexo VARCHAR(20), estado_civil VARCHAR(20), programa TEXT,
  condicion VARCHAR(30), ciclo VARCHAR(5), turno VARCHAR(10),
  celular VARCHAR(15), direccion TEXT, distrito VARCHAR(80),
  ingreso_familiar VARCHAR(40), trabaja VARCHAR(5), ocupacion TEXT,
  recibe_apoyo VARCHAR(5), tipo_apoyo TEXT, tipo_apoyo_otro TEXT,
  necesidades TEXT, seguro_salud VARCHAR(20), estado_emocional SMALLINT,
  consejeria VARCHAR(5), motivacion TEXT, meta_academica TEXT,
  meta_academica_otro TEXT, meta_laboral TEXT, meta_laboral_otro TEXT,
  declaracion VARCHAR(5)
);
```

---

Desarrollado para IESTP Cabana · Sistema SISEG · Bienestar Estudiantil
