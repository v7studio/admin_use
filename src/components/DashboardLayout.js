import React from 'react';
import '../styles/DashboardLayout.css';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom'; // This will be used to render the nested routes

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-main">
        <Sidebar />
        <div className="dashboard-content">
          <Outlet /> {/* This is where the nested components will be rendered */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
