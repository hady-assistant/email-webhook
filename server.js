import express from "express";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const { from, subject, body } = req.body;
  console.log("Received Email:", { from, subject, body });

  try {
    const cleanText = body.replace(/\\r\\n/g, "\n").trim();

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: cleanText }
        ]
      })
    });

    const result = await gptRes.json();

    let reply = "No GPT response";
    if (result.choices && result.choices[0] && result.choices[0].message) {
      reply = result.choices[0].message.content;
    }

    console.log("GPT Response:", reply);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"GPT Bot" <${process.env.GMAIL_USER}>`,
      to: process.env.SEND_TO_EMAIL,
      subject: `GPT Response to: ${subject}`,
      text: reply
    });

    console.log("Email sent to:", process.env.SEND_TO_EMAIL);
  } catch (error) {
    console.error("Error during processing:", error.message);
  }

  res.status(200).send("Processed");
});

app.get("/", (req, res) => {
  res.send("Email Webhook with GPT + Email Response is live");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
