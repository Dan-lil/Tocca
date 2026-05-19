const jwt = require('jsonwebtoken');
const formatResponse = require('../utils/formatResponse');
const { User } = require('../db/models');


async function verifyRefreshToken(req, res, next) {
  try {
    const { refreshToken } = req.cookies;

    const { user } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!user?.id) {
      return res
        .status(401)
        .json(formatResponse(401, 'Невалидный refreshToken'));
    }

    const existingUser = await User.findByPk(user.id);

    if (!existingUser) {
      return res
        .status(401)
        .json(formatResponse(401, 'Пользователь из refreshToken не найден в базе'));
    }

    const plainUser = existingUser.get();
    delete plainUser.password;

    res.locals.user = plainUser;

    next();
  } catch (error) {
    console.log('======== verifyRefreshToken =========');
    console.log(error);
    return res.status(401).json(formatResponse(401, 'Невалидный refreshToken'));
  }
}

module.exports = verifyRefreshToken;
