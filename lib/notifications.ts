import * as Device
from "expo-device";

import * as Notifications
from "expo-notifications";

import Constants
from "expo-constants";

import {
  savePushToken,
} from "../services/api";

// =========================
// NOTIFICATION HANDLER
// =========================

Notifications.setNotificationHandler({

  handleNotification:
    async () => ({

      shouldShowBanner: true,

      shouldShowList: true,

      shouldPlaySound: true,

      shouldSetBadge: false,
    }),
});

// =========================
// REGISTER PUSH TOKEN
// =========================

export async function
registerForPushNotificationsAsync() {

  try {

    if (!Device.isDevice) {

      console.log(
        "Must use physical device"
      );

      return null;
    }

    const {
      status: existingStatus,
    } = await Notifications
      .getPermissionsAsync();

    let finalStatus =
      existingStatus;

    if (
      existingStatus !== "granted"
    ) {

      const {
        status,
      } = await Notifications
        .requestPermissionsAsync();

      finalStatus = status;
    }

    if (
      finalStatus !== "granted"
    ) {

      console.log(
        "Push permission denied"
      );

      return null;
    }

    const token =
      (
        await Notifications
          .getExpoPushTokenAsync({

            projectId:
              Constants
                ?.expoConfig
                ?.extra
                ?.eas
                ?.projectId,
          })
      ).data;

    console.log(
      "Expo Push Token:",
      token
    );

    // =========================
    // SAVE TOKEN TO BACKEND
    // =========================

    await savePushToken(token);

    return token;

  } catch (e) {

    console.log(
      "Push notification error",
      e
    );

    return null;
  }
}