const moment = require("moment-timezone");

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().tz("Asia/Kolkata").format("h:mm a"),  //ist time
  };
}

module.exports = formatMessage;