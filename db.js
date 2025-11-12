// db.js
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.DB_PATH || './invitation.db';

const db = new sqlite3.Database(DB_PATH);

function runMigrations() {
  const fs = require('fs');
  const sql = fs.readFileSync('./migrations.sql', 'utf8');
  db.exec(sql, (err) => {
    if (err) console.error('Error running migrations:', err);
    else console.log('Migrations executed.');
  });
}

function getInviteByToken(token) {
  return new Promise((res, rej) => {
    db.get('SELECT * FROM invites WHERE token = ?', [token], (err, row) => {
      if (err) return rej(err);
      res(row);
    });
  });
}

function createInviteIfNotExists({event_id, guest_name, token, contact_phone}) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO invites (event_id, guest_name, token, contact_phone) VALUES (?, ?, ?, ?)`,
      [event_id, guest_name, token, contact_phone],
      function(err) {
        if (err) return reject(err);
        // fetch the row
        db.get('SELECT * FROM invites WHERE token = ?', [token], (err2, row) => {
          if (err2) return reject(err2);
          resolve(row);
        });
      }
    );
  });
}

function upsertConfirmation({event_id, token, guest_name, attendees, status, source, from_phone}) {
  return new Promise((resolve, reject) => {
    // Usamos UNIQUE(token,event_id) definido en la tabla para idempotencia.
    // Si token existe, actualizamos el registro; si no, INSERT.
    db.get('SELECT * FROM confirmations WHERE token = ? AND event_id = ?', [token, event_id], (err, row) => {
      if (err) return reject(err);
      if (row) {
        // actualizar
        db.run(`UPDATE confirmations SET attendees = ?, status = ?, source = ?, from_phone = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [attendees, status, source, from_phone, row.id],
          function(uErr) {
            if (uErr) return reject(uErr);
            resolve({action:'updated', id: row.id});
          });
      } else {
        // insertar nuevo
        db.run(`INSERT INTO confirmations (invite_id, event_id, token, guest_name, attendees, status, source, from_phone)
                VALUES (NULL,?,?,?,?,?,?)`,
          [event_id, token, guest_name, attendees, status, source, from_phone],
          function(iErr) {
            if (iErr) return reject(iErr);
            resolve({action:'inserted', id: this.lastID});
          });
      }
    });
  });
}

function getWeeklyReport(event_id) {
  return new Promise((resolve, reject) => {
    // Total confirmados y total declinados
    db.get(`SELECT 
              SUM(CASE WHEN status='confirmed' THEN attendees ELSE 0 END) AS total_attendees,
              COUNT(CASE WHEN status='confirmed' THEN 1 END) AS confirmed_count,
              COUNT(CASE WHEN status='declined' THEN 1 END) AS declined_count
            FROM confirmations WHERE event_id = ?`, [event_id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = { db, runMigrations, createInviteIfNotExists, getInviteByToken, upsertConfirmation, getWeeklyReport };
