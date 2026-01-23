import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../../api';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    icon: 'FiCode',
    items: [{ name: '', level: 80 }],
  });

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await getSkills();
      setSkills(response.data);
    } catch (error) {
      toast.error('Failed to load skills');
    }
  };

  const openModal = (skill = null) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        category: skill.category,
        icon: skill.icon || 'FiCode',
        items: skill.items,
      });
    } else {
      setEditingSkill(null);
      setFormData({
        category: '',
        icon: 'FiCode',
        items: [{ name: '', level: 80 }],
      });
    }
    setIsModalOpen(true);
  };

  const addSkillItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', level: 80 }],
    });
  };

  const removeSkillItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateSkillItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSkill) {
        await updateSkill(editingSkill._id, formData);
        toast.success('Skill category updated!');
      } else {
        await createSkill(formData);
        toast.success('Skill category added!');
      }
      setIsModalOpen(false);
      fetchSkills();
    } catch (error) {
      toast.error('Failed to save skill');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this skill category?')) return;

    try {
      await deleteSkill(id);
      toast.success('Skill category deleted!');
      fetchSkills();
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const iconOptions = ['FiLayout', 'FiServer', 'FiDatabase', 'FiCpu', 'FiCode', 'FiGitBranch'];

  return (
    <div className="admin-page">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Skills</h1>
          <p className="admin-page-subtitle">Manage your skill categories and proficiency levels</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => openModal()}>
          <FiPlus /> Add Category
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {skills.map((skill) => (
          <div key={skill._id} className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>{skill.category}</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="admin-btn admin-btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(skill)}>
                  <FiEdit2 />
                </button>
                <button className="admin-btn admin-btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(skill._id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {skill.items.map((item, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.level}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${item.level}%`, height: '100%', background: 'var(--gradient-1)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="admin-card">
          <div className="empty-state">
            <FiPlus className="empty-state-icon" />
            <p>No skill categories yet. Add your first skill category!</p>
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
              style={{ maxWidth: 700 }}
            >
              <div className="modal-header">
                <h3 className="modal-title">{editingSkill ? 'Edit Skill Category' : 'Add Skill Category'}</h3>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Frontend, Backend, Database"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Icon</label>
                      <select
                        className="form-select"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <label className="form-label" style={{ margin: 0 }}>Skills</label>
                      <button type="button" className="admin-btn admin-btn-secondary" onClick={addSkillItem} style={{ padding: '0.5rem 1rem' }}>
                        <FiPlus /> Add Skill
                      </button>
                    </div>

                    {formData.items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Skill name"
                          value={item.name}
                          onChange={(e) => updateSkillItem(index, 'name', e.target.value)}
                          style={{ flex: 2 }}
                          required
                        />
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max="100"
                          value={item.level}
                          onChange={(e) => updateSkillItem(index, 'level', parseInt(e.target.value))}
                          style={{ flex: 1 }}
                          required
                        />
                        <span style={{ color: 'var(--text-muted)' }}>%</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => removeSkillItem(index)}
                            style={{ padding: '0.5rem' }}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingSkill ? 'Update' : 'Create'}
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

export default Skills;
