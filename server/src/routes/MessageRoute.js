const MessageRouter = require("express").Router();
const MessageController = require("../controllers/MessageController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

MessageRouter.post(
  "/:chatId/messages",
  verifyAccessToken,
  MessageController.createMessage,
)
  .put("/:messageId", verifyAccessToken, MessageController.editMessage)
  .get(
    "/:chatId/messages",
    verifyAccessToken,
    MessageController.findAllMessagesByChatId,
  )
  .get("/search", verifyAccessToken, MessageController.findMessageByText)
  .delete("/:messageId", verifyAccessToken, MessageController.deleteMessage);

module.exports = MessageRouter;
