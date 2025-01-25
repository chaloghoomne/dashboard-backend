const { google } = require("googleapis");
const axios = require("axios");
const config = require("../config.json");

const SCOPES = "https://www.googleapis.com/auth/firebase.messaging";

const admin = require("firebase-admin");
const { response } = require("express");

admin.initializeApp({
  credential: admin.credential.cert(config),
});

const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    const key = config;
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );

    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
};

const notificationRequest = async (token, notification) => {
  try {
    let configs = {
      method: "post",
      url: `https://fcm.googleapis.com/v1/projects/${config.project_id}/messages:send`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: notification,
    };

    const result = await fetch(configs.url, {
      method: configs.method, // or 'PUT'
      headers: configs.headers,
      body: JSON.stringify(configs.data),
    });
    const response = await result.json();
    console.log("Response:", response);

    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

async function sendNotification(title, body, image, deviceToken) {
  const access_token = await getAccessToken();
  // console.log("Access Token:", access_token);

  const notification = {
    message: {
      token: deviceToken,
      notification: {
        body: body,
        title: title,
        image: image,
      },
    },
  };

  try {
    const response = await notificationRequest(access_token, notification);
    console.log("Notification Response:", response);
    return response;
    // console.log("Notification Response:", JSON.stringify(response.data));
  } catch (error) {
    console.log("Error:", JSON.stringify(error));
  }
}

module.exports = sendNotification;
