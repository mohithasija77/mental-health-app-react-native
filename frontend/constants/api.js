// constants/api.js
export const API_CONFIG = {
  BASE_URL: 'http://172.16.6.22:5003',
  ENDPOINTS: {
    WEEKLY_SUMMARY: '/api/mental-health/summary/weekly-summary',
    ANALYZE: '/api/mental-health/analyze',
    MOOD_CHECK: '/api/mental-health/summary/mood-check',
  },
};

// Helper function
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
};

// Usage in your component:
// import { getApiUrl } from './constants/api';
//
// const response = await fetch(getApiUrl('WEEKLY_SUMMARY'), {
//   method: 'POST',
//   // ...
// });
