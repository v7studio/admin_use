import React from 'react';
import '../styles/Header.css'; // Assuming you will add some custom CSS

const Header = () => {
  return (
    <header className="dashboard-header">
      <div className="header-title">V7Studio Admin Dashboard</div>
      <div className="header-user">
        {/* User profile icon or logout button */}
        <button className="logout-button">Logout</button>
      </div>
    </header>
  );
};

export default Header;
