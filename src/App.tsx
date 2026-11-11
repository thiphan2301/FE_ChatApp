import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { wsService, type ServerResponse } from './services/websocketService';

import Login from './pages/Login.tsx';
import Register from './pages/Register';
import Chat from './pages/Chat';
import GroupChat from './pages/GroupChat';
import Search from './pages/Search.tsx';
import Contacts from './pages/Contacts';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!wsService.hasSession()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  if (wsService.hasSession()) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    wsService.connect();

    wsService.onOpen(() => {
      const session = wsService.getSession();
      if (session) {
        wsService.sendMessage('RE_LOGIN', { user: session.username, code: session.code });
      }
    });

    const removeListener = wsService.addListener((response: ServerResponse) => {
      if (response.event === 'RE_LOGIN') {
        if (response.status === 'error') {
          wsService.logout();
          window.location.href = '/login';
        }
      }
    });

    return () => removeListener();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/group-chat" element={<GroupChat />} />
          <Route path="/search" element={<Search />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
