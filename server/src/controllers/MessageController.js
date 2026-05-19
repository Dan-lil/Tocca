const MessageService = require("../services/MessageService");
const formatResponse = require("../utils/formatResponse");

class MessageController {
  static async createMessage(req, res) {
    const { user } = res.locals;
    const { chatId } = req.params;
    const messageData = { ...req.body, chatId };

    console.log("=== MessageController.createMessage ===");
    console.log("user.id:", user.id);
    console.log("messageData:", messageData);

    try {
      const newMessage = await MessageService.create(user.id, messageData);

      return res
        .status(201)
        .json(formatResponse(201, "Message created", newMessage));
    } catch (error) {
      console.log("======== MessageController.createMessage =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to create message"));
    }
  }

  static async editMessage(req, res) {
    const { messageId } = req.params;
    const { text, status } = req.body;

    try {
      const updatedMessage = await MessageService.edit(messageId, {
        text,
        status,
      });
      if (!updatedMessage) {
        return res
          .status(404)
          .json(formatResponse(404, "Message not found or access denied"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Message updated", updatedMessage));
    } catch (error) {
      console.log("======== MessageController.editMessage =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to update message"));
    }
  }

  static async deleteMessage(req, res) {
    const { messageId } = req.params;

    try {
      await MessageService.delete(messageId);
      return res.status(200).json(formatResponse(200, "Message deleted"));
    } catch (error) {
      console.log("======== MessageController.deleteMessage =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to delete message"));
    }
  }

  static async findAllMessagesByChatId(req, res) {
    const { chatId } = req.params;

    try {
      const messages = await MessageService.findAllByChatId(chatId);
      return res
        .status(200)
        .json(formatResponse(200, "Messages loaded", messages));
    } catch (error) {
      console.log(
        "======== MessageController.findAllMessagesByChatId =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to load messages"));
    }
  }

  static async findMessageByText(req, res) {
    const { text } = req.query;

    try {
      const messages = await MessageService.findByText(text);
      return res
        .status(200)
        .json(formatResponse(200, "Messages loaded", messages));
    } catch (error) {
      console.log("======== MessageController.findMessageByText =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to load messages"));
    }
  }
}

module.exports = MessageController;
