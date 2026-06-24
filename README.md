# DoppApp - Cross-Platform E-Commerce & Courier Tracking Simulation

DoppApp is a multi-category (Shop, Food, Market) e-commerce and courier tracking simulation platform. It features full cross-platform compatibility with identical feature sets, architectures, and UI/UX flows across both its Web (Next.js) and Mobile (React Native + Expo) applications. 

This project is built using a **Feature-Sliced Design (FSD)** architecture to maintain highly decoupled and scalable codebases.

## 🚀 Features

- **Cross-Platform Parity:** 
  - **Web:** Built with Next.js 15 (App Router), React, and Tailwind CSS.
  - **Mobile:** Built with Expo Router, React Native, and NativeWind v4 (located in the `/mobile` directory).
- **Three Core Verticals:** Separate flows and categories for **Shop**, **Food**, and **Market**.
- **Real-Time Courier Tracking Simulation:** Integrated mapping (Leaflet for Web, `react-native-maps` for Mobile) demonstrating simulated delivery progress and animated courier routing using OSRM.
- **Internationalization (i18n):** Native multi-language support (English / Turkish).
- **Cart & Global State:** Centralized Cart and Catalog Context without external state managers (no Redux/Zustand), utilizing `localStorage` and `AsyncStorage` for persistence.
- **Supabase Backend:** Uses Supabase (PostgreSQL + Storage) for product catalogs, store definitions, and dynamic category hierarchies.
- **Secure Admin Panel:** Built-in multi-lingual admin dashboard leveraging Next.js Server Actions and Supabase Service Role Keys to bypass strict RLS securely.
- **Dynamic Receipt Generation:** On-the-fly receipt image generation (via `next/og`) that can be shared instantly across both platforms.

## 🏗️ Architecture & Stack

### Web (`/src`)
- **Framework:** Next.js 15
- **Styling:** Tailwind CSS
- **Map:** Leaflet & React-Leaflet
- **Icons:** `lucide-react`

### Mobile (`/mobile`)
- **Framework:** React Native + Expo (SDK 51+)
- **Navigation:** Expo Router (`expo-router/drawer` & Stack)
- **Styling:** NativeWind v4
- **Map:** `react-native-maps`
- **Icons:** `lucide-react-native`

### Backend (`Supabase`)
- PostgreSQL (Stores, Products, Orders, Categories, Config, Reviews, Receipts)
- Supabase Storage (`menu-images` bucket)
- Row Level Security (RLS) configured for secure Read-Only public access.

## ⚙️ Project Structure (Feature-Sliced Design)

Both Web and Mobile follow strict FSD principles:
- `app/` / `mobile/app/`: Application routing and layout layers. Business logic is strictly prohibited here.
- `features/` / `mobile/src/features/`: Domain-driven feature modules (e.g., `catalog`, `admin`, `order`, `tracking`).
- `shared/` / `mobile/src/shared/`: Universally shared utilities, types (`types.ts`), translations (`dictionaries.ts`), API clients, and UI components.

## 🔑 Setup & Installation

### 1. Environment Variables
Create a `.env.local` file in the root directory (and `.env` in `/mobile` if needed) and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" # Required for Admin Panel operations
```

### 2. Running the Web Application
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Web App. The default route redirects to `/shop`.

### 3. Running the Mobile Application
```bash
cd mobile
npm install
npx expo start
```
Use the Expo Go app or an emulator (iOS/Android) to view the Mobile App.

## 🛡️ Security & Administration

The application utilizes Supabase Row Level Security (RLS) to ensure that the public catalog is strictly **Read-Only**. 

To manage stores and products, navigate to `/admin` on the web application. The Admin Panel is secured via a backend configuration table and uses **Next.js Server Actions** with the `SUPABASE_SERVICE_ROLE_KEY` to securely execute database mutations without exposing write privileges to the client.

## 📝 License
This project is intended as a sandbox and portfolio demonstration.
