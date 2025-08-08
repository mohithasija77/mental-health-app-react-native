import 'dotenv/config';

export default {
  expo: {
    name: 'mental-health-app',
    slug: 'mental-health-slug',
    version: '1.0.0',
    extra: {
      API_BASE_URL: process.env.API_BASE_URL,
      GOOGLE_IOS_CLIENT_ID: process.env.GOOGLE_IOS_CLIENT_ID,
      GOOGLE_ANDROID_CLIENT_ID: process.env.GOOGLE_ANDROID_CLIENT_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    },
  },
};
