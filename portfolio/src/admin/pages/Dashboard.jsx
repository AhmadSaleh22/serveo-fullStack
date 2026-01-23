import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiBriefcase, FiMessageSquare, FiMail, FiEye, FiTrendingUp } from 'react-icons/fi';
import { getAllProjects, getAllExperience, getAllTestimonials, getMessages } from '../../api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    projects: 0,
    experience: 0,
    testimonials: 0,
    messages: 0,
  });
  const [recentMessages, setRecentMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, expRes, testiRes, messagesRes] = await Promise.all([
        getAllProjects(),
        getAllExperience(),
        getAllTestimonials(),
        getMessages(),
      ]);

      setStats({
        projects: projectsRes.data.length,
        experience: expRes.data.length,
        testimonials: testiRes.data.length,
        messages: messagesRes.data.length,
      });

      setRecentMessages(messagesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: <FiFolder />, color: '#6366f1' },
    { label: 'Experience', value: stats.experience, icon: <FiBriefcase />, color: '#8b5cf6' },
    { label: 'Testimonials', value: stats.testimonials, icon: <FiMessageSquare />, color: '#ec4899' },
    { label: 'Messages', value: stats.messages, icon: <FiMail />, color: '#10b981' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Welcome back! Here's an overview of your portfolio.</p>
      </div>

      <div className="dashboard-stats">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card admin-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-grid">
        <motion.div
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Messages</h3>
            <a href="/admin/messages" className="view-all-link">
              View All
            </a>
          </div>

          {recentMessages.length > 0 ? (
            <div className="messages-list">
              {recentMessages.map((message) => (
                <div key={message._id} className={`message-item ${!message.isRead ? 'unread' : ''}`}>
                  <div className="message-avatar">
                    {message.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-name">{message.name}</span>
                      <span className="message-date">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="message-subject">{message.subject}</p>
                    <p className="message-preview">{message.message.substring(0, 80)}...</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FiMail className="empty-state-icon" />
              <p>No messages yet</p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="admin-card quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="admin-card-title">Quick Actions</h3>
          <div className="actions-grid">
            <a href="/admin/projects" className="action-item">
              <FiFolder />
              <span>Add Project</span>
            </a>
            <a href="/admin/experience" className="action-item">
              <FiBriefcase />
              <span>Add Experience</span>
            </a>
            <a href="/admin/testimonials" className="action-item">
              <FiMessageSquare />
              <span>Add Testimonial</span>
            </a>
            <a href="/" target="_blank" className="action-item">
              <FiEye />
              <span>View Portfolio</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
