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

// Log the full API response
console.log("Raw GPT API Response:", JSON.stringify(result, null, 2));

// Extract reply safely
let reply = "No GPT response";
if (result.choices && result.choices.length > 0) {
  reply = result.choices[0].message.content;
}

console.log("GPT Response:", reply);
