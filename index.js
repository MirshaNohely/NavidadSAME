// index.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import twilio from "twilio";
import cron from "node-cron";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Ruta de confirmación
app.post("/api/confirm", (req, res) => {
  const { guest, token, attendees, source } = req.body;

  if (!guest) return res.status(400).json({ error: "Falta el nombre del invitado" });

  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existing = data.find((x) => x.token === token);

  if (existing) {
    existing.attendees = attendees;
    existing.source = source;
    existing.updatedAt = new Date().toISOString();
  } else {
    data.push({
      guest,
      token,
      attendees,
      source,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Enviar WhatsApp a la anfitriona (si está configurado)
  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: `✅ ${guest} confirmó asistencia (${attendees} personas)`,
  });

  res.json({ mensaje: "Confirmación guardada y enviada a anfitriona." });
});

// Ruta de declinación
app.post("/api/decline", (req, res) => {
  const { guest, token, source } = req.body;

  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existing = data.find((x) => x.token === token);

  if (existing) {
    existing.status = "declined";
    existing.updatedAt = new Date().toISOString();
  } else {
    data.push({
      guest,
      token,
      status: "declined",
      source,
      createdAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Notificar por WhatsApp
  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: `❌ ${guest} no podrá asistir.`,
  });

  res.json({ mensaje: "Declinación guardada y enviada a anfitriona." });
});

// Ruta para probar conexión
app.get("/api/ping", (_, res) => {
  res.send("Servidor activo 🎉");
});

// Cron para reporte semanal (lunes 9am)
cron.schedule("0 9 * * 1", () => {
  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const total = data.filter((x) => x.status === "confirmed").length;
  const detalles = data
    .filter((x) => x.status === "confirmed")
    .map((x) => `${x.guest} (${x.attendees})`)
    .join(", ");

  const mensaje = `📊 Reporte semanal:\nConfirmados: ${total}\n${detalles || "Nadie confirmado aún."}`;

  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: mensaje,
  });

  console.log("Reporte semanal enviado.");
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));



    /*
// index.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import twilio from "twilio";
import cron from "node-cron";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Ruta de confirmación
app.post("/api/confirm", (req, res) => {
  const { guest, token, attendees, source } = req.body;

  if (!guest) return res.status(400).json({ error: "Falta el nombre del invitado" });

  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existing = data.find((x) => x.token === token);

  if (existing) {
    existing.attendees = attendees;
    existing.source = source;
    existing.updatedAt = new Date().toISOString();
  } else {
    data.push({
      guest,
      token,
      attendees,
      source,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Enviar WhatsApp a la anfitriona (si está configurado)
  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: `✅ ${guest} confirmó asistencia (${attendees} personas)`,
  });

  res.json({ mensaje: "Confirmación guardada y enviada a anfitriona." });
});

// Ruta de declinación
app.post("/api/decline", (req, res) => {
  const { guest, token, source } = req.body;

  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existing = data.find((x) => x.token === token);

  if (existing) {
    existing.status = "declined";
    existing.updatedAt = new Date().toISOString();
  } else {
    data.push({
      guest,
      token,
      status: "declined",
      source,
      createdAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Notificar por WhatsApp
  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: `❌ ${guest} no podrá asistir.`,
  });

  res.json({ mensaje: "Declinación guardada y enviada a anfitriona." });
});

// Ruta para probar conexión
app.get("/api/ping", (_, res) => {
  res.send("Servidor activo 🎉");
});

// Cron para reporte semanal (lunes 9am)
cron.schedule("0 9 * * 1", () => {
  const filePath = path.join(__dirname, "data", "confirmaciones.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const total = data.filter((x) => x.status === "confirmed").length;
  const detalles = data
    .filter((x) => x.status === "confirmed")
    .map((x) => `${x.guest} (${x.attendees})`)
    .join(", ");

  const mensaje = `📊 Reporte semanal:\nConfirmados: ${total}\n${detalles || "Nadie confirmado aún."}`;

  client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: process.env.HOST_PHONE_NUMBER,
    body: mensaje,
  });

  console.log("Reporte semanal enviado.");
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));






import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cron from "node-cron";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(express.json());

// Servir archivos estáticos desde la carpeta "public"

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));


//prueba
// 👇 Primero inicializa Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
console.log("✅ Twilio conectado como:", process.env.TWILIO_ACCOUNT_SID);

// 👇 Luego ejecuta la prueba
async function enviarPrueba() {
  try {
    const mensaje = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: "whatsapp:+525533410708", // ← tu número personal con clave de país
      body: "👋 Hola, este es un mensaje de prueba desde tu bot de invitación 🎉",
    });
    console.log("✅ Mensaje enviado correctamente:", mensaje.sid);
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error.message);
  }
}

enviarPrueba();

// Servidor Express
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor activo en puerto ${process.env.PORT || 3000}`);
});

//termina porueba


// Verificar configuración de Twilio
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER || !process.env.HOST_PHONE) {
  console.error("❌ Faltan variables de entorno de Twilio. Revisa el archivo .env");
  process.exit(1);
}
console.log("✅ Twilio conectado como:", process.env.TWILIO_ACCOUNT_SID);


// Twilio client


// Ruta absoluta al archivo de datos
const dataPath = path.resolve("data", "confirmaciones.json");

// Cargar registros existentes o inicializar arreglo vacío
function cargarConfirmaciones() {
  try {
    const data = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Guardar registros
function guardarConfirmaciones(confirmaciones) {
  fs.writeFileSync(dataPath, JSON.stringify(confirmaciones, null, 2));
}

// ✅ Endpoint para confirmar asistencia
app.post("/api/confirmar", async (req, res) => {
  const { nombre, telefono } = req.body;
  if (!nombre || !telefono) return res.status(400).send("Faltan datos");

  let confirmaciones = cargarConfirmaciones();

  // Verificar duplicados
  const existe = confirmaciones.find((p) => p.telefono === telefono);
  if (existe) {
    return res.status(200).send("Ya está registrado.");
  }

  const nuevo = {
    nombre,
    telefono,
    fecha: new Date().toISOString(),
  };
  confirmaciones.push(nuevo);
  guardarConfirmaciones(confirmaciones);

  try {
    // Enviar mensaje al invitado
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${telefono}`,
      body: `🎉 ¡Gracias ${nombre}! Tu asistencia ha sido confirmada. Nos encantará verte en el evento. 🌟`,
    });

    // Avisar a la anfitriona
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.HOST_PHONE,
      body: `✅ ${nombre} (${telefono}) ha confirmado su asistencia.`,
    });

    res.status(200).send("Confirmación registrada y mensajes enviados.");
  } catch (error) {
    console.error("Error enviando mensajes:", error);
    res.status(500).send("Error al enviar mensajes de confirmación.");
  }
});

// ❌ Endpoint para rechazar asistencia
app.post("/api/no-asistire", async (req, res) => {
  const { nombre, telefono } = req.body;
  if (!nombre || !telefono) return res.status(400).send("Faltan datos");

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${telefono}`,
      body: `Gracias ${nombre}, lamentamos que no puedas acompañarnos 😢. ¡Esperamos verte en el próximo evento!`,
    });

    // Avisar a la anfitriona
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.HOST_PHONE,
      body: `❌ ${nombre} (${telefono}) indicó que no podrá asistir.`,
    });

    res.status(200).send("Mensaje de no asistencia enviado.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("No se pudo enviar el mensaje.");
  }
});

// 📆 Reporte semanal (lunes 9:00 a.m.)
cron.schedule("0 9 * * 1", async () => {
  const confirmaciones = cargarConfirmaciones();
  const total = confirmaciones.length;
  const lista = confirmaciones.map((p) => `• ${p.nombre}`).join("\n") || "Nadie confirmado aún.";

  const mensaje = `📊 *Reporte semanal de confirmaciones*\n\nTotal confirmados: ${total}\n\n${lista}`;
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.HOST_PHONE,
      body: mensaje,
    });
    console.log("✅ Reporte semanal enviado a la anfitriona");
  } catch (error) {
    console.error("❌ Error enviando reporte:", error);
  }
});

// Servidor activo
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
*/