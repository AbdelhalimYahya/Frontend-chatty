import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://backend-chatty-production.up.railway.app",
  withCredentials: true,
});