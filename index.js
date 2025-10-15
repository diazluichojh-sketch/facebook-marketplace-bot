import login from "@xaviabot/fb-chat-api";
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const email = process.env.FB_EMAIL;
const password = process.env.FB_PASSWORD;
const n8nWebhook = process.env.N8N_WEBHOOK;

login({ email, password }, (err, api) => {
  if (err) return console.error("Error al iniciar sesión:", err);

  console.log("✅ Conectado a Facebook");

  api.listenMqtt((err, message) => {
    if (err) return console.error(err);

    if (message && message.threadID && message.body) {
      console.log("💬 Nuevo mensaje:", message.body);

      fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    }
  });

  app.post("/send", async (req, res) => {
    const { threadID, body } = req.body;
    api.sendMessage(body, threadID);
    res.send("✅ Mensaje enviado a Facebook");
  });
});

app.listen(3000, () => console.log("🚀 Servidor activo en puerto 3000"));
