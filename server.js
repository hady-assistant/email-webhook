import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const { from, subject, body } = req.body;

  console.log("Received Email:", { from, subject, body });

  try {
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
          { role: "user", content: body }
        ]
      })
    });

    const result = await gptRes.json();
    const answer = result.choices?.[0]?.message?.content || "No response from GPT";

    console.log("GPT Response:", answer);
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
  }

  res.status(200).send("Processed");
});

app.get("/", (req, res) => {
  res.send("Email Webhook with GPT is live");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
