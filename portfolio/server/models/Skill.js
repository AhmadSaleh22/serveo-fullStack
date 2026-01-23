import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'FiCode'
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    }
  }],
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Skill', skillSchema);
