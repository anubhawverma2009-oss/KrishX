# KrishX – AI Professional Network & Intelligent Farming Platform

<div align="center">

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.16-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**KrishX** is an AI-powered professional network and intelligent farming platform designed to connect Indian farmers, agricultural experts, students, and resource providers. It combines professional social networking with cutting-edge agronomist AI assistance for crop disease detection, soil analysis, and expert knowledge sharing.

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Complete Folder Structure](#-complete-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Overview](#-api-overview)
- [Database Collections](#-database-collections)
- [Authentication Flow](#-authentication-flow)
- [AI Integration](#-ai-integration)
- [Firebase Integration](#-firebase-integration)
- [License](#-license)
- [Author](#-author)

---

## 🌾 Project Overview

KrishX bridges the gap between traditional agricultural knowledge and modern digital intelligence. Designed with a multilingual interface (English, Hindi, and Hinglish), KrishX enables farmers to:
- Build professional agricultural identities and showcase their farms.
- Diagnose crop pests and diseases instantly via AI image analysis.
- Connect with verified agricultural experts, agronomists, and peer farmers.
- Share knowledge, farm updates, and participate in community discussions.
- Access agricultural opportunities, schemes, and expert guidance.

---

## ✨ Key Features

1. **🌾 KrishX AI Agronomist Assistant**:
   - Powered by Google Gemini (`gemini-2.5-flash`).
   - Supports multimodal image uploads for crop disease diagnosis, leaf pest identification, and soil health analysis.
   - Provides organic and chemical management recommendations with confidence levels.
   - Multilingual responses (Hindi, Hinglish, English) tailored to the farmer's context and location.

2. **👥 Professional Network & Directory**:
   - Discover peer farmers, agronomists, and researchers.
   - Send/accept connection requests and build trusted agricultural networks.
   - Filter professionals by specialization, location, and crops.

3. **💬 Communities**:
   - Join specialized farming groups and communities (e.g., Organic Farming, Horticulture, Crop Science).
   - Participate in real-time group discussions and knowledge sharing.

4. **📰 Feed & Social Posts**:
   - Share farm updates, photos, and agricultural tips.
   - Like, comment, bookmark (save posts), and share.
   - Built-in post content translation toggle between English and Hindi.

5. **🧑‍🌾 Farmer Profile & Identity**:
   - Detailed profile views including `ProfileHero`, `FarmSnapshot`, `AboutFarmer`, `MyAgriculture`, experience history, and achievements.
   - **Krish Score & KrishX QR**: Gamified farming reputation score and digital identity QR card.
   - Edit profile modal for updating crops, location, and farming expertise.

6. **📢 Opportunities & Resources**:
   - Curated agricultural grants, government schemes, subsidies, and training programs.

7. **🔔 Notification Center**:
   - Real-time notification tracking for connections, likes, comments, and community updates with read/unread toggle.

8. **🌐 Multilingual Support**:
   - Seamless switching between English, Hindi (हिंदी), and Hinglish across the entire platform.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`)
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide React (`lucide-react`)

### Backend
- **Runtime & Server**: Node.js, Express 4
- **Language**: TypeScript (`tsx`, `esbuild`)

### AI & Cloud
- **AI Model**: Google GenAI SDK (`@google/genai` - `gemini-2.5-flash`)
- **Database & Auth**: Firebase Firestore & Firebase Authentication (`firebase`)

---

## 📐 Project Architecture

KrishX is built as a full-stack application featuring an Express backend server that proxies AI requests to the Google Gemini API (protecting API keys from exposure in the browser) and serves the React single-page application via Vite middleware in development and static asset delivery in production.

```
[Client (React + Tailwind)] --(HTTP /api/*)--> [Express Backend Server] --(Secure API)--> [Google Gemini API]
                                                      |
                                                      v
                                            [Firebase Firestore / Auth]
```

---

## 📂 Complete Folder Structure

```
krishx/
├── .env.example
├── .gitignore
├── firebase-applet-config.json
├── firestore.rules
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types.ts
    ├── assets/
    ├── components/
    │   ├── AIAssistant.tsx
    │   ├── Communities.tsx
    │   ├── Discover.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── Home.tsx
    │   ├── Layout.tsx
    │   ├── Login.tsx
    │   ├── NetworkHub.tsx
    │   ├── NotificationCenter.tsx
    │   ├── Opportunities.tsx
    │   ├── PostCard.tsx
    │   ├── ProfessionalDirectory.tsx
    │   ├── Profile.tsx
    │   └── profile/
    │       ├── AboutFarmer.tsx
    │       ├── AchievementsSection.tsx
    │       ├── EditProfileModal.tsx
    │       ├── ExperienceSection.tsx
    │       ├── FarmSnapshot.tsx
    │       ├── KrishScoreModal.tsx
    │       ├── KrishXQRModal.tsx
    │       ├── MyAgriculture.tsx
    │       ├── ProfileHero.tsx
    │       ├── ProfilePosts.tsx
    │       └── ProfileTabs.tsx
    ├── context/
    │   └── AuthContext.tsx
    └── lib/
        ├── firebase.ts
        ├── i18n.ts
        ├── seeder.ts
        └── utils.ts
```

---

## 📦 Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd krishx
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# AI API Credentials
GEMINI_API_KEY="your-google-gemini-api-key"

# App URL
APP_URL="http://localhost:3000"
```

---

## 🚀 Running the Project

### Development Mode
Boots the Express backend and Vite development middleware on port `3000`:
```bash
npm run dev
```

### Production Build
Bundles the server and compiles frontend assets into `dist/`:
```bash
npm run build
```

### Production Start
Launches the compiled production server:
```bash
npm start
```

### Type Checking & Linting
```bash
npm run lint
```

---

## 🔌 API Overview

The Express backend (`server.ts`) exposes the following core endpoints:

- **`GET /api/health`**: Health check endpoint returning server status.
- **`POST /api/ai/chat`**: Handles agricultural AI queries and image analysis via Google Gemini `gemini-2.5-flash`.
  - *Request Body*: `{ messages, currentProfile, customImageBase64, language, imageType }`

---

## 🗄️ Database Collections (Firebase Firestore)

The application interacts with the following Firestore collections:
- `users`: User profiles, farm details, location, and credentials.
- `posts`: Social feed posts, media URLs, likes, and comments.
- `connections`: User network relationships and pending requests.
- `communities`: Agricultural discussion groups and memberships.
- `opportunities`: Grants, schemes, and resource listings.
- `notifications`: User activity and alert notifications.

---

## 🔐 Authentication Flow

- **Firebase Authentication**: Supports Google Sign-In via Firebase Auth.
- **Demo Mode**: Allows instant login as a pre-configured demo farmer profile for testing and evaluation.
- **Protected Routes**: Main application views (`Home`, `NetworkHub`, `Communities`, `Opportunities`, `AIAssistant`, `Profile`) require an authenticated session managed through `AuthContext`.

---

## 🤖 AI Integration

- **SDK**: `@google/genai`
- **Model**: `gemini-2.5-flash`
- **Architecture**: Server-side proxying in `server.ts` ensures `GEMINI_API_KEY` remains secure and hidden from the browser.
- **Capabilities**: Multimodal plant pathology diagnosis, fertilizer dosage calculation, soil health card analysis, and multilingual agronomy advising.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Developed by Anubhav Verma for the Indian agricultural community and digital empowerment of farmers.
