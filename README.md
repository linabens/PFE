# Brew Luna - PFE

Brew Luna is a comprehensive solution for coffee shops, featuring a mobile application for customers, an administrative dashboard, a robust backend, and an AI-powered chatbot.

## Project Structure

- `brew-luna-native/`: React Native (Expo) mobile application for customers.
- `backend/`: Node.js/Express backend service.
- `Dash admin/`: React/Vite administrative dashboard for managers.
- `dify-chatbot-backend/`: Specialized backend for AI chatbot integration.

## Features

- **Mobile App**: Menu browsing, ordering system, and loyalty features.
- **Admin Dashboard**: Real-time analytics, order management, and store configuration.
- **AI Chatbot**: Intelligent customer assistance and automated responses.
- **Loyalty Program**: Rewards and points system for returning customers.

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/linabens/PFE.git
   ```

2. Install dependencies for each service:
   ```bash
   # Root
   npm install

   # Backend
   cd backend
   npm install

   # Mobile App
   cd ../brew-luna-native
   npm install

   # Admin Dashboard
   cd "../Dash admin"
   npm install
   ```

3. Configure environment variables in each directory's `.env` file.

4. Run the services:
   ```bash
   # Backend
   npm run dev

   # Mobile App
   npx expo start
   ```

## License

This project was developed as a PFE (Projet de Fin d'Études).