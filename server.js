const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
  const { from, subject, body } = req.body;
  console.log("Received Email:", { from, subject, body });

  res.status(200).send("Received");
});

app.get("/", (req, res) => {
  res.send("Email Webhook is live");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Listening on port", PORT));
