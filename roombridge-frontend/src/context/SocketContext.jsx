import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../utils/constants";

const SocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  /*
    Dependency was [isAuthenticated, user] — every time the user
    object reference changed (e.g. after Redux updateUser dispatch), the
    socket disconnected and reconnected unnecessarily.
    Fix: use user?._id as the dependency. The socket only needs to reconnect
    if the actual user identity changes (different user logged in).
  */
  const userId = user?._id;

  useEffect(() => {
    /* Disconnect if logged out */
    if (!isAuthenticated || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    /* Avoid creating a duplicate socket if one already exists for this user */
    if (socketRef.current?.connected) return;

    /* Strip /api/v1 suffix to get the server root URL for Socket.io */
    const socketUrl = API_BASE_URL.replace(/\/api(\/v\d+)?$/, "");

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      /* Join personal room — backend registers userId as online and joins user's personal room */
      socket.emit("user_online", userId);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      /* If server closed the connection intentionally, don't auto-reconnect */
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
      setIsConnected(false);
    });

    socket.on("reconnect", () => {
      setIsConnected(true);
      /* Re-join personal room after reconnection */
      socket.emit("user_online", userId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, userId]); // Only runs when login state or user ID changes

  /*
    emit/on/off helpers now guard against null socketRef.current.
    Using useCallback so these functions have stable references and don't
    cause re-renders when passed as props to child components.
  */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`[Socket] Cannot emit "${event}" — socket not connected`);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const contextValue = {
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
