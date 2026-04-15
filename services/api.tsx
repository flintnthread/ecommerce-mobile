import axios from "axios";

const api = axios.create({
  baseURL:"http://192.168.0.15:8080",

  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ crucial for session/cookies
});

export default api;