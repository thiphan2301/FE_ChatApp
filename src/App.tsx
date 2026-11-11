import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { wsService, type ServerResponse } from './services/websocketService';

import Login from './pages/Login.tsx';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import Search from './pages/Search.tsx';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

/** Bảo vệ các route cần đăng nhập */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!wsService.hasSession()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Nếu đã đăng nhập rồi → không cho vào login/register nữa */
function GuestRoute({ children }: { children: React.ReactNode }) {
  if (wsService.hasSession()) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Kết nối WebSocket ngay khi khởi động
    wsService.connect();

    wsService.onOpen(() => {
      const username = localStorage.getItem('username');
      const reLoginCode = localStorage.getItem('re_login_code');
      if (username && reLoginCode) {
        wsService.sendMessage('RE_LOGIN', { user: username, code: reLoginCode });
      }
    });

    // Lắng nghe kết quả RE_LOGIN
    const removeListener = wsService.addListener((response: ServerResponse) => {
      if (response.event === 'RE_LOGIN') {
        if (response.status === 'error') {
          localStorage.removeItem('re_login_code');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
      }
    });

    return () => removeListener();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - chỉ khi chưa đăng nhập */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Các trang cần đăng nhập */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/group-chat" element={<GroupChat />} />
          <Route path="/search" element={<Search />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Mặc định */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
