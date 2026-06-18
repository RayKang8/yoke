import { writeFileSync } from 'fs';

if (process.env.GOOGLE_SERVICES_JSON_BASE64) {
  writeFileSync('./google-services.json', Buffer.from(process.env.GOOGLE_SERVICES_JSON_BASE64, 'base64'));
}

export default {
  expo: {
    name: 'Yoke',
    slug: 'yoke',
    scheme: 'yoke',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/Yoke-Icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/Yoke.png',
      resizeMode: 'contain',
      backgroundColor: '#FDD72D',
    },
    ios: {
      buildNumber: '9',
      supportsTablet: false,
      requireFullScreen: true,
      bundleIdentifier: 'com.yokefaith.app',
      infoPlist: {
        NSUserNotificationsUsageDescription:
          'Yoke sends a daily reminder for your devotional and notifies you when friends react to or comment on your posts.',
        NSPhotoLibraryUsageDescription:
          'Yoke uses your photo library so you can set a profile picture.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      googleServicesFile: './google-services.json',
      permissions: [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.SCHEDULE_EXACT_ALARM',
      ],
      adaptiveIcon: {
        foregroundImage: './assets/Yoke.png',
        backgroundColor: '#F5C842',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.yokefaith.app',
    },
    web: {
      favicon: './assets/Yoke-Icon.png',
    },
    updates: {
      url: 'https://u.expo.dev/5b309bb9-d078-4507-bbd6-abb2dc61333c',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          icon: './assets/Yoke-Icon.png',
          color: '#F5C842',
        },
      ],
      'expo-font',
      '@react-native-community/datetimepicker',
      'expo-localization',
    ],
    extra: {
      router: {},
      eas: {
        projectId: '5b309bb9-d078-4507-bbd6-abb2dc61333c',
      },
    },
  },
};
