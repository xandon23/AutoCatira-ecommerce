import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export function getImageUrl(imagePath?: string): string | undefined {
  if (!imagePath || !API_URL) {
    return undefined;
  }

  const cleanBaseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${cleanBaseUrl}${cleanPath}`;
}

export default api;
