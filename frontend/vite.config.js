import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL,
  server: {
    port: parseInt(process.env.VITE_PORT || "5173", 10), // Use the port from .env or default to 5173
  },
});
