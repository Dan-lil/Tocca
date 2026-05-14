const apiRouter = require('express').Router();
const authRouter = require('./authRoute');
const aiRouter = require('./aiRoute');
const formatResponse = require('../utils/formatResponse');

apiRouter.use('/auth', authRouter);
apiRouter.use('/ai', aiRouter);

apiRouter.use((req, res) => {
  res.status(404).json(formatResponse(404, 'Ресурс не найден'));
});

module.exports = apiRouter;
