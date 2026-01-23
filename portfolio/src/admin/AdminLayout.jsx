import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHome, FiUser, FiCode, FiFolder, FiBriefcase,
  FiMessageSquare, FiMail, FiLogOut, FiMenu, FiX,
  FiSun, FiMoon
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api';
import MonogramLogo from '../assets/monogram.svg';
import DarkModeLogo from '../assets/darkmode.svg';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', icon: <FiHome />, label: 'Dashboard', end: true },
  { path: '/admin/profile', icon: <FiUser />, label: 'Profile' },
  { path: '/admin/skills', icon: <FiCode />, label: 'Skills' },
  { path: '/admin/projects', icon: <FiFolder />, label: 'Projects' },
  { path: '/admin/experience', icon: <FiBriefcase />, label: 'Experience' },
  { path: '/admin/testimonials', icon: <FiMessageSquare />, label: 'Testimonials' },
  { path: '/admin/messages', icon: <FiMail />, label: 'Messages' },
];

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('adminTheme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('adminTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <img
              src={theme === 'dark' ? DarkModeLogo : MonogramLogo}
              alt="Ahmad Saleh"
              className="logo-img"
            />
          </a>
          <span className="sidebar-title">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.label === 'Messages' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <div className="admin-info">
              <span className="admin-name">{admin?.name || 'Admin'}</span>
              <span className="admin-email">{admin?.email}</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
