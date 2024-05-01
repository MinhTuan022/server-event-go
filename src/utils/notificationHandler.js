// notificationHandler.js
const axios = require("axios");
const { JWT } = require("google-auth-library");

const sendPushNotification = async (fcmTokens, body, title, data ) => {
  try {
    await Promise.all(
      fcmTokens.map(async (fcmToken) => {
        await handleSendNotification(fcmToken, body, title, data);
      })
    );
  } catch (error) {
    console.log(error)
  }
}
const handleSendNotification = async (fcmToken, body, title, notiData) => {
  // console.log(notiData)
  let data = JSON.stringify({
    message: {
      token: fcmToken,
      notification: {
        body: body,
        title: title,
      },
      data: {id: notiData},
    },
  });
console.log(data)
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://fcm.googleapis.com/v1/projects/eventhub-416509/messages:send",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    // console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    // console.error(error);
    throw error;
  }
};

const getAccessToken = () => {
  return new Promise(function (resolve, reject) {
    const key = require("../eventhub-firebase-mess.json");
    const jwtClient = new JWT(
      key.client_email,
      null,
      key.private_key,
      ["https://www.googleapis.com/auth/cloud-platform"],
      null
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
};

module.exports = { handleSendNotification, sendPushNotification };
