const ChatRouter = require("express").Router();
const ChatController = require("../controllers/ChatController");

const verifyAccessToken = require("../middleware/verifyAccessToken");

ChatRouter.post("/chats", verifyAccessToken, ChatController.createChat)
  .get(
    "/chats/:bookingId",
    verifyAccessToken,
    ChatController.findChatByBookingId,
  )
  .get(
    "/chats/masters/:masterId",
    verifyAccessToken,
    ChatController.findAllChatsByMasterId,
  )
  .get(
    "/chats/clients/:clientId",
    verifyAccessToken,
    ChatController.findAllChatsByClientId,
  )
  .delete("/chats/:id", verifyAccessToken, ChatController.deleteChat)
  .delete(
    "/chats/booking/:bookingId",
    verifyAccessToken,
    ChatController.deleteChatsByBookingId,
  )
  .delete(
    "/chats/master/:masterId",
    verifyAccessToken,
    ChatController.deleteChatsByMasterId,
  )
  .delete(
    "/chats/client/:clientId",
    verifyAccessToken,
    ChatController.deleteChatsByClientId,
  );

module.exports = ChatRouter;
