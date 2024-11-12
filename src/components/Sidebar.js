import React from 'react';
import '../styles/Sidebar.css';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="dashboard-sidebar">
      <nav>
        <ul>
          <li>
            <NavLink to="/dashboard/contacts" activeClassName="active">Contacts</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/gallery" activeClassName="active">Gallery</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/portfolio" activeClassName="active">Portfolio</NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
