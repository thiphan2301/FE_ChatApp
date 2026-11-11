import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

import Login from './pages/Login.tsx';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import Search from './pages/Search.tsx';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { useEffect } from "react";
import { wsService, type ServerResponse } from "./services/websocketService";


function App() {
    useEffect(() => {
        // connect websocket ngay khi chạy ứng dụng
        wsService.connect();

        wsService.onOpen(() => {
            const username = localStorage.getItem('username');
            const reLoginCode = localStorage.getItem('re_login_code');

            if (username && reLoginCode) {
                // Nếu có code thì thử RE_LOGIN
                wsService.sendMessage('RE_LOGIN', {
                    user: username,
                    code: reLoginCode,
                });
            }
        });

        // Lắng nghe kết quả RE_LOGIN để xử lý session
        const removeListener = wsService.addListener((response: ServerResponse) => {
            if (response.event === 'RE_LOGIN') {
                if (response.status === 'error') {
                    // Nếu session hết hạn hoặc lỗi, xóa storage và về login
                    console.error('Session expired, please login again');
                    localStorage.removeItem('re_login_code');
                    localStorage.removeItem('username');
                    window.location.href = '/login';
                } else {
                    console.log('Re-login successful');
                }
            }
        });

        return () => removeListener();
    }, []);

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Các trang dùng chung MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/group-chat" element={<GroupChat />} />
            <Route path="/search" element={<Search />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Mặc định sẽ chuyển về /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;