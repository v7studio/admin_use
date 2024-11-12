import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/LoginPage';
import Contacts from './components/Contacts';
import GalleryManager from './components/GalleryManager';
import PortfolioManager from './components/PortfolioManager';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard/contacts" element={<Contacts />} />
          <Route path="/dashboard/gallery" element={<GalleryManager />} />
          <Route path="/dashboard/portfolio" element={<PortfolioManager />} />
          {/* Add more routes as needed */}
        </Route>
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
