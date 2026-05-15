
const { GigaChat } = require('gigachat');
const { Agent } = require('node:https');

class AiService {
  static async generateText(prompt) {
    const { title, text } = prompt;

    const httpsAgent = new Agent({
      rejectUnauthorized: false,
    });

    const client = new GigaChat({
      model: 'GigaChat',
      credentials: process.env.GIGACHAT_API_KEY,
      httpsAgent: httpsAgent,
    });

    const response = await client.chat({
      messages: [
        {
          role: 'system',
          content: `Ты - полезный помощник, помоги пользователю создать план выполнения задачи по пунктам. Описание задачи будет в сообщении пользователя. В ответе следуй формату markdown.`,
        },
        {
          role: 'user',
          content: `Создай план выполнения задачи "${title}". Описание задачи: ${text}`,
        },
      ],
    });

    return response.choices[0]?.message.content;
  }
}

module.exports = AiService;
