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
    // Clean text input
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
          {
            role: "system",
            content:
              "You are an AI assistant. The following message contains document content extracted from one or more email attachments. Analyze this content thoroughly. For each document, outline the pros, cons, and suggest professional improvements."
          },
          { role: "user", content: cleanText }
        ]
      })
    });

    const result = await gptRes.json();

    // Log full API response for debugging
    console.log("🧠 GPT API Response:", JSON.stringify(result, null, 2));

    // Extract GPT reply
    let reply = "No GPT response";
    if (result.choices && result.choices.length > 0) {
      reply = result.choices[0].message.content;
    }

    console.log("✅ GPT Response:", reply);

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Extract clean email address from "Name <email@domain.com>"
    const emailMatch = from.match(/<(.+)>/);
    const recipient = emailMatch ? emailMatch[1] : from;

    // Send GPT response back to sender
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

// ✅ Required for Render to detect your service
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});
