# MedStore Offline

A single-user, offline-capable web application for inventory management.

## 📦 Download Project
Since I am an AI text model, I cannot generate a binary ZIP file directly.
**To create the project ZIP:**
1. Create a new folder named `medstore`.
2. Save the files generated above into that folder, preserving the directory structure (e.g., create a `components` folder, a `pages` folder, etc.).
3. Compress the `medstore` folder into a `.zip` file.

## 🛠 Build & Run Locally

### Prerequisites
- Node.js (v16+)
- npm

### Setup
1. Initialize the project:
   ```bash
   npm create vite@latest . -- --template react-ts
   npm install
   npm install react-router-dom
   ```
   *Note: The generated code assumes a standard Vite React TypeScript structure. You may need to overwrite the default `src` content with the files provided here. Ensure `index.html` is in the root.*

2. Start Development Server:
   ```bash
   npm run dev
   ```

## 🚀 Netlify Deployment (Static)

This app uses `HashRouter` and `IndexedDB`, making it perfect for static hosting without configuration.

1. **Build the App**:
   ```bash
   npm run build
   ```
   This creates a `dist/` folder.

2. **Deploy to Netlify**:
   - Log in to Netlify.
   - Drag and drop the `dist/` folder into the "Sites" area.
   - **OR** Connect your GitHub repository:
     - Build command: `npm run build`
     - Publish directory: `dist`

## 📱 Mobile Usage
- Open the deployed URL on Chrome (Android) or Safari (iOS).
- Tap "Add to Home Screen" to install it as an App.
- The app works offline once loaded.

## ⚠️ Important Notes
- **Data Persistence**: Data is stored in the browser's `IndexedDB`. If you clear browser cache/site data, you will lose your inventory.
- **Backup**: Use the **Settings > Export Database** feature regularly to save a JSON backup to your device.
