import express from 'express';
import Testimonial from '../models/Testimonial.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isVisible: true }).sort({ order: 1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/testimonials/all (admin)
router.get('/all', protect, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/testimonials
router.post('/', protect, async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/testimonials/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/testimonials/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
