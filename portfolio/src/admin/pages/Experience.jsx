import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getAllExperience, createExperience, updateExperience, deleteExperience } from '../../api';

const Experience = () => {
  const [experiences, setExperiences] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    company: '',
    location: '',
    period: '',
    description: '',
    achievements: '',
    technologies: '',
    isVisible: true,
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const response = await getAllExperience();
      setExperiences(response.data);
    } catch (error) {
      toast.error('Failed to load experience');
    }
  };

  const openModal = (exp = null) => {
    if (exp) {
      setEditingExp(exp);
      setFormData({
        role: exp.role,
        company: exp.company,
        location: exp.location || '',
        period: exp.period,
        description: exp.description || '',
        achievements: exp.achievements.join('\n'),
        technologies: exp.technologies.join(', '),
        isVisible: exp.isVisible,
      });
    } else {
      setEditingExp(null);
      setFormData({
        role: '',
        company: '',
        location: '',
        period: '',
        description: '',
        achievements: '',
        technologies: '',
        isVisible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingExp) {
        await updateExperience(editingExp._id, formData);
        toast.success('Experience updated!');
      } else {
        await createExperience(formData);
        toast.success('Experience added!');
      }
      setIsModalOpen(false);
      fetchExperiences();
    } catch (error) {
      toast.error('Failed to save experience');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    try {
      await deleteExperience(id);
      toast.success('Experience deleted!');
      fetchExperiences();
    } catch (error) {
      toast.error('Failed to delete experience');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Experience</h1>
          <p className="admin-page-subtitle">Manage your work history</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
          <FiPlus /> Add Experience
        </button>
      </div>

      <div className="admin-card">
        {experiences.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {experiences.map((exp) => (
              <div key={exp._id} style={{
                padding: '1.5rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{exp.role}</h4>
                  <p style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{exp.company}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{exp.period} • {exp.location}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {exp.technologies.slice(0, 5).map((tech) => (
                      <span key={tech} style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        background: 'var(--card-bg)',
                        borderRadius: 20,
                        color: 'var(--text-secondary)'
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(exp)}>
                    <FiEdit2 />
                  </button>
                  <button className="admin-btn admin-btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(exp._id)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiPlus className="empty-state-icon" />
            <p>No experience entries yet. Add your work history!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">{editingExp ? 'Edit Experience' : 'Add Experience'}</h3>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Role/Position</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Period</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        placeholder="2020 - Present"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Achievements (one per line)</label>
                    <textarea
                      className="form-textarea"
                      value={formData.achievements}
                      onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                      placeholder="Led a team of 5 developers&#10;Improved performance by 40%"
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Technologies (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.technologies}
                      onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                      placeholder="React, Node.js, AWS"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingExp ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Experience;
