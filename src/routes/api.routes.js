import express from "express";

import askAI from "../service/ia.service.js";
import { saveUsage } from "../service/usage.service.js";

const apiroute = express.Router();

apiroute.post("/chat/completions", async (req, res) => {
   

    const start = Date.now();

    try {

        const { messages } = req.body;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        const response = await askAI(messages, true);

        let usage = null;
        let model = process.env.OPENROUTER_MODEL || "openrouter/auto";

        for await (const chunk of response) {

            if (chunk.model) {
                model = chunk.model;
            }

            if (chunk.usage) {
                usage = chunk.usage;
            }

            const content = chunk.choices?.[0]?.delta?.content;

            if (content) {

                res.write(
                    `data: ${JSON.stringify({
                        choices: [
                            {
                                delta: {
                                    content
                                }
                            }
                        ]
                    })}\n\n`
                );

            }

        }

        const responseTime = Date.now() - start;

        if (usage) {    
            console.log(
        `IA -> ${usage.total_tokens} tokens (Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens})`
    );
            await saveUsage({

                model,

                prompt_tokens: usage.prompt_tokens || 0,

                completion_tokens: usage.completion_tokens || 0,

                total_tokens: usage.total_tokens || 0,

                response_time: responseTime

            });

        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (err) {

        console.error(err);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Erro interno."
            });
        } else {
            res.end();
        }

    }

});

export default apiroute;