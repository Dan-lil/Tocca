function removeXPoweredHeader(req, res, next) {
  res.removeHeader('x-powered-by');

  next();
}

module.exports = removeXPoweredHeader;
