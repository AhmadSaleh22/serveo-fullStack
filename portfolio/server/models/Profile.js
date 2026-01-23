import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Ahmad Saleh'
  },
  title: {
    type: String,
    required: true,
    default: 'Software Developer'
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  location: String,
  bio: String,
  avatar: String,
  resumeUrl: String,
  typingTexts: [{
    type: String
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String
  },
  stats: {
    yearsExperience: { type: String, default: '7+' },
    projectsCompleted: { type: String, default: '50+' },
    happyClients: { type: String, default: '30+' },
    technologies: { type: String, default: '15+' }
  },
  aboutText: [String],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
