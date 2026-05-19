const { Chat } = require("../db/models");

class ChatService {
  static async create(ChatData) {
    const newChat = await Chat.create(ChatData);

    const plainChat = newChat.get();

    return plainChat;
  }

  static async findByBookingId(bookingId) {
    const chat = await Chat.findOne({ where: { bookingId } });
    return chat ? chat.get() : null;
  }

  static async findAllByMasterId(masterId) {
    const chats = await Chat.findAll({ where: { masterId } });
    return chats.map((chat) => chat.get());
  }

  static async findAllByClientId(clientId) {
    const chats = await Chat.findAll({ where: { clientId } });
    return chats.map((chat) => chat.get());
  }

  static async deleteByBookingId(bookingId) {
    await Chat.destroy({ where: { bookingId: bookingId } });
  }

  static async deleteByMasterId(masterId) {
    await Chat.destroy({ where: { masterId: masterId } });
  }

  static async deleteByClientId(clientId) {
    await Chat.destroy({ where: { clientId: clientId } });
  }
  static async delete(id) {
    await Chat.destroy({ where: { id: id } });
  }
}

module.exports = ChatService;
