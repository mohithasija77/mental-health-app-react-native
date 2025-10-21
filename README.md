# 🧠 Mental Health Check-In App

A mobile application designed to help users reflect on their emotional well-being through daily check-ins, pattern recognition, and AI-powered insights. Users can track their mental health indicators, and the app provides thoughtful trend analysis powered by AI.

Note: The app currently focuses on identifying trends and patterns in your data. It does not provide clinical recommendations or medical advice.

## 🔧 Tech Stack

- **Frontend**: React Native (with Tailwind CSS & Lottie animations)
- **Backend**: Node.js, Express.js
- **AI Integration**: Gemini API
- **Database**: MongoDB
- **Authentication**: OAuth 2.0 (Google)

## ✨Features

- Daily Mental Check-In – Record indicators such as sleep quality, stress levels, mood/feeling scale, and recent events
- Weekly Summary – Aggregates seven days of data and presents AI-generated insights to highlight trends and recurring patterns
- Stress Detector – Log additional indicators like appetite, relationships, energy levels, and feelings of being overwhelmed to spot stress-related patterns
- Mental Health Facts – Access evidence-based wellbeing information for educational purposes
- Calming Interface – Light color palettes create a non-intrusive, supportive environment
- Reminders & Notifications – Encourages consistent usage and regular check-ins
- Data Export – Export your weekly data for personal records

## 📱 User Manual

A short, step-by-step guide for end users:

1. Run the app
2. Create an account or sign in with Google
3. Complete your daily check-in
4. Navigate to weekly summary for insights
5. Use the stress detector for focused assessment
6. Explore mental health facts for learning
7. Export weekly data if needed

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- MongoDB setup
- Expo CLI for React Native development

### Quick Setup

1. Clone the repo
2. Run `npm install` in both `frontend/` and `backend/`
3. Configure environment variables (see detailed instructions below)
4. Use `nodemon` for backend and Expo Go for frontend

## 📋 Installation Instructions

- **frontend/** - React Native mobile app
- **backend/** - Node.js server

### Frontend Setup

1. Navigate to the frontend folder
2. Install dependencies:
   ```
   npm install
   ```
3. **Configure environment variables:**
   - API keys for OAuth 2.0 (Google)
   - API_BASE_URL pointing to backend development IP
4. Start the development server:
   ```
   npm start
   ```
5. **Running on different platforms:**
   - For Expo development: `npx expo start`
   - For iOS simulator: `npx expo run:ios`
   - For Android emulator/device: `npx expo run:android`

### Backend Setup

1. Navigate to the backend folder
2. Install dependencies:
   ```
   npm install
   ```
3. **Configure environment variables:**
   - MongoDB connection string
   - API keys for Gemini
   - JWT_SECRET
   - EMAIL_FROM & EMAIL_PASSWORD
4. Start the backend server:
   ```
   npm start
   ```
   Or for development with auto-reload:
   ```
   nodemon
   ```

## 🔐 Environment Variables

### Frontend (.env)

```
GOOGLE_IOS_CLIENT_ID=your_google_ios_client_id
GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
GOOGLE_WEB_CLIENT_ID=your_google_web_id
API_BASE_URL=http://your_backend_ip:port
```

### Backend (.env)

```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
EMAIL_FROM=your_email_address
EMAIL_PASSWORD=your_email_password
```

## 🤝 Contributing

Feel free to suggest or contribute ideas via issues or pull requests. 🙂

## ⚠️ Disclaimer

This app is designed for self-reflection and awareness purposes only. It identifies patterns and trends in your data but does not provide clinical recommendations or replace professional mental health care. If you're experiencing mental health concerns, please consult with a qualified healthcare provider.

## Note: This application is for educational and personal wellness tracking purposes. Always seek professional help for mental health concerns.


## Screenshots
<img width="403" height="803" alt="Screenshot 2025-10-21 at 14 39 18" src="https://github.com/user-attachments/assets/12d0db80-bbbf-410b-8d6d-2180f3740bdf" />
<img width="749" height="741" alt="Screenshot 2025-10-21 at 14 40 14" src="https://github.com/user-attachments/assets/6f128601-4eef-4882-86d9-7c9813d9964c" />
<img width="822" height="834" alt="Screenshot 2025-10-21 at 14 40 30" src="https://github.com/user-attachments/assets/a0239fd5-b232-4836-8dfe-070295e7e9f2" />
<img width="816" height="836" alt="Screenshot 2025-10-21 at 14 40 49" src="https://github.com/user-attachments/assets/e355c536-032d-4db8-af02-91b6c0efbb14" />
<img width="821" height="835" alt="Screenshot 2025-10-21 at 14 41 04" src="https://github.com/user-attachments/assets/4e2d0ff5-1787-4171-8fef-a7e87fc7f1a4" />
<img width="400" height="836" alt="Screenshot 2025-10-21 at 14 41 24" src="https://github.com/user-attachments/assets/a6192b68-4923-4bcd-9491-49c62fcdec06" />


