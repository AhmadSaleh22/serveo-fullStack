import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: String,
  period: {
    type: String,
    required: true
  },
  description: String,
  achievements: [String],
  technologies: [String],
  order: {
    type: Number,
    default: 0
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Experience', experienceSchema);
