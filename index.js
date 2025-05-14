const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/webhook", async (req, res) => {
  const events = req.body.events;
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userText = event.message.text;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一個翻譯助手，請將使用者的訊息翻譯成繁體中文。",
          },
          { role: "user", content: userText },
        ],
      });

      const translated = completion.choices[0].message.content;

      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: translated }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.send("LINE 翻譯機器人運作中！");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器啟動中，監聽 port ${PORT}`);
});
