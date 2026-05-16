module.exports = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};