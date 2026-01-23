import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../../api';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    rating: 5,
    isVisible: true,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await getAllTestimonials();
      setTestimonials(response.data);
    } catch (error) {
      toast.error('Failed to load testimonials');
    }
  };

  const openModal = (testimonial = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        content: testimonial.content,
        rating: testimonial.rating,
        isVisible: testimonial.isVisible,
      });
    } else {
      setEditingTestimonial(null);
      setFormData({
        name: '',
        role: '',
        content: '',
        rating: 5,
        isVisible: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial._id, formData);
        toast.success('Testimonial updated!');
      } else {
        await createTestimonial(formData);
        toast.success('Testimonial added!');
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to save testimonial');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      await deleteTestimonial(id);
      toast.success('Testimonial deleted!');
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Testimonials</h1>
          <p className="admin-page-subtitle">Manage client testimonials</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
          <FiPlus /> Add Testimonial
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {testimonials.map((testimonial) => (
          <div key={testimonial._id} className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FiStar key={i} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(testimonial)}>
                  <FiEdit2 />
                </button>
                <button className="admin-btn admin-btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(testimonial._id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.6 }}>
              "{testimonial.content}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40,
                height: 40,
                background: 'var(--gradient-1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600
              }}>
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{testimonial.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="admin-card">
          <div className="empty-state">
            <FiPlus className="empty-state-icon" />
            <p>No testimonials yet. Add your first testimonial!</p>
          </div>
        </div>
      )}

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
                <h3 className="modal-title">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Client Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role/Company</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="CEO, TechStart Inc."
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Testimonial Content</label>
                    <textarea
                      className="form-textarea"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFormData({ ...formData, rating: star })}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            color: star <= formData.rating ? '#fbbf24' : 'var(--text-muted)'
                          }}
                        >
                          <FiStar style={{ fill: star <= formData.rating ? '#fbbf24' : 'none' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingTestimonial ? 'Update' : 'Create'}
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

export default Testimonials;
