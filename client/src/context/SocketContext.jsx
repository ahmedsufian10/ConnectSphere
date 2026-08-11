import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      socketRef.current = io('http://localhost:5000', { transports: ['websocket'] });
      socketRef.current.emit('userOnline', user._id);

      socketRef.current.on('onlineUsers', (users) => setOnlineUsers(users));

      socketRef.current.on('newNotification', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, notifications, setNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
