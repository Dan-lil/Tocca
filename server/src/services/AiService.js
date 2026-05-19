const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");
const http = require("http");

class AiService {
  static async generateText(prompt) {
    const { title, text } = prompt;

    const httpsAgent = new Agent({
      rejectUnauthorized: false,
    });

    const client = new GigaChat({
      model: "GigaChat",
      credentials: process.env.GIGACHAT_API_KEY,
      httpsAgent: httpsAgent,
    });

    const response = await client.chat({
      messages: [
        {
          role: "system",
          content: `Ты - полезный помощник, помоги пользователю создать план выполнения задачи по пунктам. Описание задачи будет в сообщении пользователя. В ответе следуй формату markdown.`,
        },
        {
          role: "user",
          content: `Создай план выполнения задачи "${title}". Описание задачи: ${text}`,
        },
      ],
    });

    return response.choices[0]?.message.content;
  }

  static async getMasterRecommendations(payload) {
    const pythonServiceUrl =
      process.env.PYTHON_RECOMMENDATION_URL || "http://localhost:8001";

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);

      const options = {
        hostname: new URL(pythonServiceUrl).hostname,
        port: new URL(pythonServiceUrl).port || 8001,
        path: "/recommendations",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode === 200 && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.message || `HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error("Invalid JSON response from Python service"));
          }
        });
      });

      req.on("error", (error) => {
        reject(
          new Error(`Failed to connect to Python service: ${error.message}`),
        );
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = AiService;
