import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "https://backend-chatty-production.up.railway.app/api";

// Token management helper functions
const tokenManager = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  removeToken: () => {
    localStorage.removeItem('authToken');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    // If no token exists, skip the check
    if (!tokenManager.isAuthenticated()) {
      set({ isCheckingAuth: false, authUser: null });
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      // If check auth fails, remove invalid token
      tokenManager.removeToken();
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      
      // Store token from response in localStorage
      if (res.data.token) {
        tokenManager.setToken(res.data.token);
      }
      
      // Remove token from user data before storing in state
      const { token, ...userData } = res.data;
      set({ authUser: userData });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      
      // Store token from response in localStorage
      if (res.data.token) {
        tokenManager.setToken(res.data.token);
      }
      
      // Remove token from user data before storing in state
      const { token, ...userData } = res.data;
      set({ authUser: userData });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      // Remove token from localStorage
      tokenManager.removeToken();
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.log("Logout error:", error);
      // Even if the request fails, clear local state
      tokenManager.removeToken();
      set({ authUser: null });
      get().disconnectSocket();
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      auth: {
        token: tokenManager.getToken() // Send token for socket authentication
      }
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error);
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null });
  },

  // Helper method to check if user is authenticated
  isAuthenticated: () => {
    return tokenManager.isAuthenticated() && get().authUser !== null;
  }
}));