import { error } from "console";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

let socket: Socket | null = null;
let notificationSound: HTMLAudioElement | null = null;
let isInitializing = false;
let hasUserInteracted = false;

// Initialize notification sound
const initNotificationSound = () => {
  if (typeof window !== 'undefined') {
    notificationSound = new Audio('/scan-success.mp3');
    notificationSound.volume = 0.5;
    
    // Add user interaction listener
    const handleUserInteraction = () => {
      hasUserInteracted = true;
      // Try to play and pause immediately to unlock audio
      if (notificationSound) {
        notificationSound.play().then(() => {
          notificationSound?.pause();
          notificationSound!.currentTime = 0;
        }).catch(() => {
          // Silent fail
        });
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // Add listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
  }
};

// Play notification sound
const playNotificationSound = () => {
  if (!hasUserInteracted) {
    return; // Don't try to play if user hasn't interacted
  }

  try {
    if (!notificationSound) {
      initNotificationSound();
    }
    if (notificationSound) {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {
        // Silent fail
      });
    }
  } catch (error) {
    // Silent fail
  }
};

const setupSocketListeners = (socket: Socket) => {
  socket.on("connect", () => {
    toast.success("Connected to server");
  });

  socket.on("disconnect", () => {
    toast.error("Disconnected from server");
  });

  socket.on("kitchenOrder", (data) => {
    if (data.type === 'update') {
      toast.success("New order update received");
    }
  });

  socket.on("orderStatusUpdate", (data) => {
    toast.success("Order status updated");
  });
};

export const initializeSocket = () => {
  if (isInitializing) {
    return socket;
  }

  if (!socket) {
    isInitializing = true;

    try {
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      const port = window.location.port || (protocol === 'https:' ? '443' : '80');
      const socketUrl = `${protocol}//${host}:${port}`;
      
      socket = io(socketUrl, {
        path: "/api/socket/io",
        transports: ["websocket", "polling"],
        upgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        multiplex: false,
        withCredentials: true
      });

      setupSocketListeners(socket);
    } catch (error) {
      socket = null;
    } finally {
      isInitializing = false;
    }
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 