import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://backend-chatty-production.up.railway.app/" : "/api",
  withCredentials: true,
});