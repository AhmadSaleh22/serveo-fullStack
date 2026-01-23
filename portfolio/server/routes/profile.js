import express from 'express';
import Profile from '../models/Profile.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/profile
router.get('/', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({
        name: 'Ahmad Saleh',
        title: 'Software Developer',
        email: 'ahmad@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        bio: 'A passionate developer with expertise in building modern, scalable applications',
        typingTexts: ['Software Developer', 'React Enthusiast', 'Python & Django Expert', 'AI Solutions Architect'],
        socialLinks: {
          github: 'https://github.com',
          linkedin: 'https://linkedin.com',
          twitter: 'https://twitter.com'
        },
        aboutText: [
          "I'm a Senior Software Developer with over 7 years of experience in crafting digital solutions that drive business growth.",
          "I specialize in full-stack development using modern frameworks like React and Django, with a growing focus on AI/ML integration.",
          "When I'm not coding, you'll find me exploring new technologies, contributing to open-source projects, or sharing my knowledge."
        ]
      });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create(req.body);
    } else {
      Object.assign(profile, req.body);
      await profile.save();
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/profile/avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    const profile = await Profile.findOne();
    if (profile) {
      profile.avatar = `/uploads/${req.file.filename}`;
      await profile.save();
      res.json({ avatar: profile.avatar });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
