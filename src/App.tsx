import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

import Login from './pages/Login.tsx';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import Search from './pages/Search.tsx';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import {useEffect} from "react";
import {wsService} from "./services/websocketService.ts";

function App() {
    useEffect(() => {
        //connect websocket ngay khi chạy ứng dụng
        wsService.connect();

        // chưa xog login nên gọi API đăng nhập ngầm để test trc
        // chờ connect thành công mới login
        wsService.onOpen(() => {
            wsService.sendMessage('LOGIN', {
                user: 'thi2301',
                pass: 'thi230105',
            });
        });
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