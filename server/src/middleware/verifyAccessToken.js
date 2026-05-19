const jwt = require('jsonwebtoken');
const formatResponse = require('../utils/formatResponse');
const { User } = require('../db/models');

async function verifyAccessToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res
        .status(403)
        .json(formatResponse(403, 'Access token is required'));
    }

    const accessToken = authHeader.split(' ')[1];

    const { user } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    if (!user?.id) {
      return res
        .status(403)
        .json(formatResponse(403, 'Невалидный accessToken'));
    }

    const existingUser = await User.findByPk(user.id);

    if (!existingUser) {
      return res
        .status(403)
        .json(formatResponse(403, 'Пользователь из токена не найден в базе'));
    }

    const plainUser = existingUser.get();
    delete plainUser.password;

    res.locals.user = plainUser;

    next();
  } catch (error) {
    console.log('======== verifyAccessToken =========');
    console.log(error);
    return res.status(403).json(formatResponse(403, 'Невалидный accessToken'));
  }
}

module.exports = verifyAccessToken;
