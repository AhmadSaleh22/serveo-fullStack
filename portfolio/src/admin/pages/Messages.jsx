import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiTrash2, FiArchive, FiX, FiInbox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getMessages, markAsRead, archiveMessage, deleteMessage } from '../../api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [showArchived]);

  const fetchMessages = async () => {
    try {
      const response = await getMessages(showArchived);
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const openMessage = async (message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        await markAsRead(message._id);
        fetchMessages();
      } catch (error) {
        console.error('Failed to mark as read');
      }
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveMessage(id);
      toast.success('Message archived');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to archive message');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(id);
      toast.success('Message deleted');
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Messages</h1>
          <p className="admin-page-subtitle">View and manage contact form submissions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`admin-btn ${!showArchived ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setShowArchived(false)}
          >
            <FiInbox /> Inbox
          </button>
          <button
            className={`admin-btn ${showArchived ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setShowArchived(true)}
          >
            <FiArchive /> Archived
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map((message) => (
              <div
                key={message._id}
                onClick={() => openMessage(message)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--card-border)',
                  cursor: 'pointer',
                  background: !message.isRead ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.background = !message.isRead ? 'rgba(99, 102, 241, 0.05)' : 'transparent'}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  background: 'var(--gradient-1)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {message.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: !message.isRead ? 600 : 500, color: 'var(--text-primary)' }}>
                      {message.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                    {message.subject || 'No subject'}
                  </p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {message.message}
                  </p>
                </div>
                {!message.isRead && (
                  <div style={{
                    width: 10,
                    height: 10,
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <FiMail className="empty-state-icon" />
            <p>{showArchived ? 'No archived messages' : 'No messages yet'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 650 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">{selectedMessage.subject || 'No subject'}</h3>
                <button className="modal-close" onClick={() => setSelectedMessage(null)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    background: 'var(--gradient-1)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                  }}>
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMessage.name}</p>
                    <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--accent-primary)' }}>
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(selectedMessage.createdAt).toLocaleDateString([], {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div className="modal-footer">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Your message'}`}
                  className="admin-btn admin-btn-primary"
                >
                  Reply
                </a>
                {!showArchived && (
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => handleArchive(selectedMessage._id)}
                  >
                    <FiArchive /> Archive
                  </button>
                )}
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDelete(selectedMessage._id)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
