import express from "express";
import axios from "axios";
import login from "facebook-chat-api"; // usa el paquete de GitHub o unofficial-fb-chat-api

const app = express();
app.use(express.json());

const FB_EMAIL = process.env.FB_EMAIL;
const FB_PASSWORD = process.env.FB_PASSWORD;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK;

login({ email: FB_EMAIL, password: FB_PASSWORD }, (err, api) => {
  if (err) {
    console.error("❌ Error al iniciar sesión en Facebook:", err);
    return;
  }

  console.log("✅ Conectado a Facebook Messenger (Marketplace)");

  api.listenMqtt(async (err, message) => {
    if (err) {
      console.error("Error al escuchar mensajes:", err);
      return;
    }

    // Filtramos mensajes SOLO del Marketplace
    if (
      message?.threadID &&
      message?.body &&
      message?.isGroup === false &&
      message?.type === "message" &&
      message?.tags?.includes("MARKETPLACE")
    ) {
      console.log("📩 Mensaje de Marketplace recibido:", message.body);

      try {
        // Enviar mensaje al webhook de n8n
        const response = await axios.post(N8N_WEBHOOK, {
          message: message.body,
          senderID: message.senderID,
          threadID: message.threadID,
        });

        // Si n8n devuelve una respuesta, enviarla al usuario
        if (response.data && response.data.reply) {
          api.sendMessage(response.data.reply, message.threadID);
        }
      } catch (error) {
        console.error("❌ Error al enviar a n8n:", error);
      }
    }
  });
});

// Endpoint básico para Render
app.get("/", (req, res) => {
  res.send("Bot de Facebook Marketplace activo ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
