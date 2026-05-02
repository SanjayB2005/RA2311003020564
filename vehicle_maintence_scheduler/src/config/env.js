require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  evalServer: {
    baseUrl: process.env.EVAL_SERVER_BASE_URL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

module.exports = config;
