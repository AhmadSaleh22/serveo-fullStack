import express from 'express';
import Experience from '../models/Experience.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/experience
router.get('/', async (req, res) => {
  try {
    const experiences = await Experience.find({ isVisible: true }).sort({ order: 1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/experience/all (admin)
router.get('/all', protect, async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ order: 1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/experience
router.post('/', protect, async (req, res) => {
  try {
    const expData = { ...req.body };
    if (expData.achievements && typeof expData.achievements === 'string') {
      expData.achievements = expData.achievements.split('\n').filter(a => a.trim());
    }
    if (expData.technologies && typeof expData.technologies === 'string') {
      expData.technologies = expData.technologies.split(',').map(t => t.trim());
    }
    const experience = await Experience.create(expData);
    res.status(201).json(experience);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/experience/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const expData = { ...req.body };
    if (expData.achievements && typeof expData.achievements === 'string') {
      expData.achievements = expData.achievements.split('\n').filter(a => a.trim());
    }
    if (expData.technologies && typeof expData.technologies === 'string') {
      expData.technologies = expData.technologies.split(',').map(t => t.trim());
    }
    const experience = await Experience.findByIdAndUpdate(req.params.id, expData, { new: true });
    res.json(experience);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/experience/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.json({ message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
