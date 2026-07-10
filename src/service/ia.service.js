  import OpenAI from "openai";

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  /**
   * @param {Array} messages
   * @param {boolean} stream
   */
  async function askAI(messages, stream = false) {
    if (!Array.isArray(messages)) {
      throw new Error("Messages inválido");
    }

    const response = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      messages,
      stream: stream
    });

    return response;
  }

  export default askAI;