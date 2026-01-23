import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, uploadAvatar } from '../../api';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    typingTexts: [],
    socialLinks: { github: '', linkedin: '', twitter: '' },
    stats: { yearsExperience: '', projectsCompleted: '', happyClients: '', technologies: '' },
    aboutText: [],
    isAvailable: true,
  });
  const [typingInput, setTypingInput] = useState('');
  const [aboutInput, setAboutInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setProfile(response.data);
      setTypingInput(response.data.typingTexts?.join('\n') || '');
      setAboutInput(response.data.aboutText?.join('\n\n') || '');
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...profile,
        typingTexts: typingInput.split('\n').filter(t => t.trim()),
        aboutText: aboutInput.split('\n\n').filter(t => t.trim()),
      };
      await updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await uploadAvatar(formData);
      setProfile({ ...profile, avatar: response.data.avatar });
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Profile</h1>
        <p className="admin-page-subtitle">Manage your personal information and settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-card">
          <h3 className="admin-card-title">Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Professional Title</label>
              <input
                type="text"
                className="form-input"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Bio</label>
            <textarea
              className="form-textarea"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Typing Animation Texts (one per line)</label>
            <textarea
              className="form-textarea"
              value={typingInput}
              onChange={(e) => setTypingInput(e.target.value)}
              placeholder="Software Developer&#10;React Enthusiast&#10;AI Solutions Architect"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Available for Work</span>
              <label className="toggle-switch" style={{ marginLeft: '1rem' }}>
                <input
                  type="checkbox"
                  checked={profile.isAvailable}
                  onChange={(e) => setProfile({ ...profile, isAvailable: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </label>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">About Section</h3>

          <div className="form-group">
            <label className="form-label">About Text (separate paragraphs with blank lines)</label>
            <textarea
              className="form-textarea"
              value={aboutInput}
              onChange={(e) => setAboutInput(e.target.value)}
              rows="8"
            />
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Statistics</h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Years Experience</label>
              <input
                type="text"
                className="form-input"
                value={profile.stats?.yearsExperience || ''}
                onChange={(e) => setProfile({ ...profile, stats: { ...profile.stats, yearsExperience: e.target.value } })}
                placeholder="7+"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Projects Completed</label>
              <input
                type="text"
                className="form-input"
                value={profile.stats?.projectsCompleted || ''}
                onChange={(e) => setProfile({ ...profile, stats: { ...profile.stats, projectsCompleted: e.target.value } })}
                placeholder="50+"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Happy Clients</label>
              <input
                type="text"
                className="form-input"
                value={profile.stats?.happyClients || ''}
                onChange={(e) => setProfile({ ...profile, stats: { ...profile.stats, happyClients: e.target.value } })}
                placeholder="30+"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Technologies</label>
              <input
                type="text"
                className="form-input"
                value={profile.stats?.technologies || ''}
                onChange={(e) => setProfile({ ...profile, stats: { ...profile.stats, technologies: e.target.value } })}
                placeholder="15+"
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Social Links</h3>

          <div className="form-group">
            <label className="form-label">GitHub URL</label>
            <input
              type="url"
              className="form-input"
              value={profile.socialLinks?.github || ''}
              onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, github: e.target.value } })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input
              type="url"
              className="form-input"
              value={profile.socialLinks?.linkedin || ''}
              onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, linkedin: e.target.value } })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Twitter URL</label>
            <input
              type="url"
              className="form-input"
              value={profile.socialLinks?.twitter || ''}
              onChange={(e) => setProfile({ ...profile, socialLinks: { ...profile.socialLinks, twitter: e.target.value } })}
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiSave />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </form>
    </div>
  );
};

export default Profile;
