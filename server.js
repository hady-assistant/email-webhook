import express from "express";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const { from, subject, body } = req.body;

  console.log("📨 Received Email:", { from, subject, body });

  try {
    // Clean up line breaks
    const cleanText = body.replace(/\\r\\n/g, "\n").trim();

    // Call OpenAI API
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

    // Log full API response
    console.log("🧠 Raw GPT API Response:", JSON.stringify(result, null, 2));

    // Extract GPT reply
    let reply = "No GPT response";
    if (result.choices && result.choices.length > 0) {
      reply = result.choices[0].message.content;
    }

    console.log("✅ GPT Response:", reply);

    // Send response via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Extract only the email from "Hady Atallah <hadyatallah@gmail.com>"
    const emailMatch = from.match(/<(.*)>/);
    const recipient = emailMatch ? emailMatch[1] : process.env.SEND_TO_EMAIL;

    await transporter.sendMail({
      from: `"GPT Bot" <${process.env.GMAIL_USER}>`,
      to: recipient,
      subject: `GPT Response to: ${subject}`,
      text: reply
    });

    console.log("📬 Email sent to:", recipient);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  res.status(200).send("Processed");
});

// ✅ Port binding for Render detection
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});
