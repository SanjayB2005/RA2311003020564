require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  evalServer: {
    baseUrl: process.env.EVAL_SERVER_BASE_URL || "http://20.207.122.201",
    token: process.env.EVAL_SERVER_TOKEN || process.env.ACCESS_TOKEN,
    accessCode: process.env.ACCESS_CODE,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    email: process.env.EVAL_EMAIL || process.env.EMAIL,
    name: process.env.EVAL_NAME || process.env.NAME,
    rollNo: process.env.EVAL_ROLL_NO || process.env.ROLL_NO,
  },
};

module.exports = config;
