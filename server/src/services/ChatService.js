const { Op } = require("sequelize");
const {
  Booking,
  Chat,
  ChatMessage,
  ProfileMaster,
  Servizi,
  User,
} = require("../db/models");

const userPublicAttributes = ["id", "name", "avatar", "role"];

const chatInclude = [
  {
    model: User,
    as: "client",
    attributes: userPublicAttributes,
  },
  {
    model: User,
    as: "master",
    attributes: userPublicAttributes,
    include: [
      {
        model: ProfileMaster,
        attributes: ["title", "city", "category", "rating"],
      },
    ],
  },
  {
    model: Booking,
    attributes: ["id", "date", "startTime", "endTime", "status", "serviziId"],
    include: [
      {
        model: Servizi,
        attributes: ["id", "title", "price", "duration"],
      },
    ],
  },
  {
    model: ChatMessage,
    limit: 1,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "sender",
        attributes: userPublicAttributes,
      },
    ],
  },
];

const messageInclude = [
  {
    model: User,
    as: "sender",
    attributes: userPublicAttributes,
  },
];

const toPlain = (item) => (item ? item.get({ plain: true }) : null);

class ChatService {
  static async create(ChatData) {
    const [chat] = await Chat.findOrCreate({
      where: { bookingId: ChatData.bookingId },
      defaults: ChatData,
    });

    return this.findById(chat.id);
  }

  static async findById(id) {
    const chat = await Chat.findByPk(id, { include: chatInclude });

    return toPlain(chat);
  }

  static async ensureParticipant(chatId, userId) {
    const chat = await Chat.findByPk(chatId);

    if (!chat) {
      return null;
    }

    const plainChat = chat.get({ plain: true });

    if (plainChat.clientId !== userId && plainChat.masterId !== userId) {
      return null;
    }

    return plainChat;
  }

  static async findByBookingId(bookingId) {
    const chat = await Chat.findOne({
      where: { bookingId },
      include: chatInclude,
    });

    return toPlain(chat);
  }

  static async findAllByMasterId(masterId) {
    const chats = await Chat.findAll({
      where: { masterId },
      include: chatInclude,
      order: [["updatedAt", "DESC"]],
    });

    return chats.map(toPlain);
  }

  static async findAllByClientId(clientId) {
    const chats = await Chat.findAll({
      where: { clientId },
      include: chatInclude,
      order: [["updatedAt", "DESC"]],
    });

    return chats.map(toPlain);
  }

  static async findAllByUserId(userId) {
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [{ masterId: userId }, { clientId: userId }],
      },
      include: chatInclude,
      order: [["updatedAt", "DESC"]],
    });

    return chats.map(toPlain);
  }

  static async findMessages(chatId) {
    const messages = await ChatMessage.findAll({
      where: { chatId },
      include: messageInclude,
      order: [["createdAt", "ASC"]],
    });

    return messages.map(toPlain);
  }

  static async createMessage(chatId, senderId, text) {
    const message = await ChatMessage.create({ chatId, senderId, text });
    await Chat.update({ updatedAt: new Date() }, { where: { id: chatId } });

    const messageWithSender = await ChatMessage.findByPk(message.id, {
      include: messageInclude,
    });

    return toPlain(messageWithSender);
  }

  static async deleteByBookingId(bookingId) {
    await Chat.destroy({ where: { bookingId } });
  }

  static async deleteByMasterId(masterId) {
    await Chat.destroy({ where: { masterId } });
  }

  static async deleteByClientId(clientId) {
    await Chat.destroy({ where: { clientId } });
  }

  static async delete(id) {
    await Chat.destroy({ where: { id } });
  }
}

module.exports = ChatService;
