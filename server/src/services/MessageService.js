const { Message } = require("../db/models");

class MessageService {
  static async create(userId, messageData) {
    console.log("=== MessageService.create ===");
    console.log("userId argument:", userId);
    console.log("messageData argument:", messageData);

    // Проверяем аргументы
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!messageData) {
      throw new Error("messageData is required");
    }

    if (!messageData.chatId) {
      throw new Error("chatId is required in messageData");
    }
    if (!messageData.text) {
      throw new Error("text is required in messageData");
    }

    // Формируем объект для создания
    const fullMessageData = {
      userId: userId,
      chatId: messageData.chatId,
      text: messageData.text,
      status: messageData.status || "sent",
    };

    console.log("Creating message with:", fullMessageData);

    const newMessage = await Message.create(fullMessageData);
    const plainMessage = newMessage.get();

    console.log("Message created successfully:", plainMessage);

    return plainMessage;
  }

  static async edit(id, messageData) {
    const message = await Message.findByPk(id);

    if (!message) {
      return null;
    }

    await message.update(messageData);
    return message.get();
  }

  static async findByText(text) {
    const message = await Message.findOne({ where: { text } });
    return message ? message.get() : null;
  }

  static async findAllByChatId(chatId) {
    const messages = await Message.findAll({ where: { chatId } });
    return messages.map((message) => message.get());
  }

  static async delete(id) {
    const deletedRows = await Message.destroy({ where: { id } });
    return deletedRows > 0;
  }
}

module.exports = MessageService;
