// cron.js
const cron = require('node-cron');
const { getWeeklyReport } = require('./db');
const { sendWhatsApp } = require('./whatsapp');

const EVENT_ID = process.env.EVENT_ID || 'EVT1';
const HOST_PHONE = process.env.HOST_PHONE_FOR_REPORTS;

async function sendWeekly() {
  try {
    const report = await getWeeklyReport(EVENT_ID);
    const totalAttendees = report.total_attendees || 0;
    const confirmedCount = report.confirmed_count || 0;
    const declinedCount = report.declined_count || 0;

    const text = `Reporte semanal — Evento ${EVENT_ID}:\n\n` +
                 `Confirmaciones: ${confirmedCount}\n` +
                 `Personas confirmadas (sum): ${totalAttendees}\n` +
                 `Declinaciones: ${declinedCount}\n\n` +
                 `Fecha: ${new Date().toLocaleString()}`;

    if (HOST_PHONE) {
      await sendWhatsApp(HOST_PHONE, text);
      console.log('Reporte enviado a host.');
    } else {
      console.log('HOST_PHONE_FOR_REPORTS no configurado. Reporte:\n', text);
    }
  } catch (e) {
    console.error('Error generando reporte semanal:', e);
  }
}

// Programa: cada lunes a las 09:00 (ajusta según necesidad).
// Cron expression: '0 9 * * MON' -> a las 9:00 los lunes.
// Si prefieres cada 7 días a partir del deploy usa otra estrategia.
const job = cron.schedule('0 9 * * MON', sendWeekly, { scheduled: false });

module.exports = { start: () => job.start() , stop: () => job.stop() , job };
