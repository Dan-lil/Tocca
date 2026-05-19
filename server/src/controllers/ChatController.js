const ChatService = require("../services/ChatService");
const formatResponse = require("../utils/formatResponse");

class ChatController {
  static async createChat(req, res) {
    const chatData = req.body;

    try {
      const newChat = await ChatService.create(chatData);
      return res.status(201).json(formatResponse(201, "Chat created", newChat));
    } catch (error) {
      console.log("======== ChatController.createChat =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to create chat"));
    }
  }

  static async findMyChats(req, res) {
    const { user } = res.locals;

    try {
      const chats = await ChatService.findAllByUserId(user.id);
      return res.status(200).json(formatResponse(200, "Chats loaded", chats));
    } catch (error) {
      console.log("======== ChatController.findMyChats =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load chats"));
    }
  }

  static async findChatMessages(req, res) {
    const { id } = req.params;
    const { user } = res.locals;

    try {
      const chat = await ChatService.ensureParticipant(Number(id), user.id);

      if (!chat) {
        return res.status(404).json(formatResponse(404, "Chat not found"));
      }

      const messages = await ChatService.findMessages(id);
      return res
        .status(200)
        .json(formatResponse(200, "Messages loaded", messages));
    } catch (error) {
      console.log("======== ChatController.findChatMessages =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to load messages"));
    }
  }

  static async createMessage(req, res) {
    const { id } = req.params;
    const { user } = res.locals;
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text || text.length > 1000) {
      return res.status(400).json(formatResponse(400, "Invalid message text"));
    }

    try {
      const chat = await ChatService.ensureParticipant(Number(id), user.id);

      if (!chat) {
        return res.status(404).json(formatResponse(404, "Chat not found"));
      }

      const message = await ChatService.createMessage(Number(id), user.id, text);
      return res.status(201).json(formatResponse(201, "Message created", message));
    } catch (error) {
      console.log("======== ChatController.createMessage =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to create message"));
    }
  }

  static async findChatByBookingId(req, res) {
    const { bookingId } = req.params;

    try {
      const chat = await ChatService.findByBookingId(bookingId);
      if (!chat) {
        return res.status(404).json(formatResponse(404, "Chat not found"));
      }
      return res.status(200).json(formatResponse(200, "Chat loaded", chat));
    } catch (error) {
      console.log("======== ChatController.findChatByBookingId =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load chat"));
    }
  }

  static async findAllChatsByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const chats = await ChatService.findAllByMasterId(masterId);
      return res.status(200).json(formatResponse(200, "Chats loaded", chats));
    } catch (error) {
      console.log("======== ChatController.findAllChatsByMasterId =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load chats"));
    }
  }

  static async findAllChatsByClientId(req, res) {
    const { clientId } = req.params;

    try {
      const chats = await ChatService.findAllByClientId(clientId);
      return res.status(200).json(formatResponse(200, "Chats loaded", chats));
    } catch (error) {
      console.log("======== ChatController.findAllChatsByClientId =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load chats"));
    }
  }

  static async deleteChat(req, res) {
    const { id } = req.params;

    try {
      await ChatService.delete(id);
      return res.status(200).json(formatResponse(200, "Chat deleted"));
    } catch (error) {
      console.log("======== ChatController.deleteChat =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to delete chat"));
    }
  }
  static async deleteChatsByBookingId(req, res) {
    const { bookingId } = req.params;

    try {
      await ChatService.deleteByBookingId(bookingId);
      return res.status(200).json(formatResponse(200, "Chats deleted"));
    } catch (error) {
      console.log("======== ChatController.deleteChatsByBookingId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to delete chats"));
    }
  }

  static async deleteChatsByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      await ChatService.deleteByMasterId(masterId);
      return res.status(200).json(formatResponse(200, "Chats deleted"));
    } catch (error) {
      console.log("======== ChatController.deleteChatsByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to delete chats"));
    }
  }

  static async deleteChatsByClientId(req, res) {
    const { clientId } = req.params;

    try {
      await ChatService.deleteByClientId(clientId);
      return res.status(200).json(formatResponse(200, "Chats deleted"));
    } catch (error) {
      console.log("======== ChatController.deleteChatsByClientId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to delete chats"));
    }
  }
}

module.exports = ChatController;
