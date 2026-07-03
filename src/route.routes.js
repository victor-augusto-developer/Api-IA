import express from "express"

const route = express.Router();

import askAI from "./service/ia.service.js";
route.post("/v1/chat/completions", async (req, res) => {
  console.log("IA -> USANDO...c")
  try {
    const { messages } = req.body;

    // 🔥 headers obrigatórios do SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const response = await askAI(messages, true);

    for await (const chunk of response) {
      const content = chunk.choices?.[0]?.delta?.content;

      if (content) {
        res.write(
          `data: ${JSON.stringify({
            choices: [
              {
                delta: { content }
              }
            ]
          })}\n\n`
        );
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

export default route;