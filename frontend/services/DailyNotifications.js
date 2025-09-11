import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { navigationRef } from './NavigationRef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const handleNotificationResponse = (response) => {
  const data = response.notification.request.content.data;

  if (data?.screen === 'MentalCheckIn' && navigationRef.isReady()) {
    navigationRef.navigate('MentalCheckIn');
  }
};

export const requestNotificationPermissions = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied');
      return false;
    }

    return true;
  } else {
    console.log('Running on simulator - notifications will be simulated');
    return 'simulator';
  }
};

//Schedule daily notification at 1:00 PM
export const scheduleDailyReminder = async () => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (hasPermission === 'simulator') {
    console.log('✅ Daily reminder scheduled for 1:00 PM (simulator mode)');
    return;
  }

  const trigger = {
    hour: 13,
    minute: 0,
    repeats: true,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Check-in 💙',
      body: 'How are you feeling today? Take a moment to check in.',
      sound: true,
      data: { screen: 'MentalCheckIn' },
    },
    trigger,
  });

  console.log('✅ Daily reminder scheduled for 1:00 PM');
};

//Cancel all notifications
export const cancelDailyReminder = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('Daily reminders cancelled');
};
