-- Tabla de invitados (invitaciones individuales)
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  guest_name TEXT,
  token TEXT UNIQUE,        -- token único enviado en la URL
  contact_phone TEXT,      -- opcional: teléfono del invitado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de confirmaciones (registro histórico/actual)
CREATE TABLE IF NOT EXISTS confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invite_id INTEGER,       -- FK a invites.id (si existe token)
  event_id TEXT NOT NULL,
  token TEXT,              -- token del invitado (para idempotencia)
  guest_name TEXT,
  attendees INTEGER DEFAULT 0,
  status TEXT,             -- 'confirmed' | 'declined'
  source TEXT,             -- 'whatsapp' | 'web'
  from_phone TEXT,         -- número que envía (si viene por WA)
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token, event_id)
);
