import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import './Testimonials.css';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'CEO, TechStart Inc.',
    avatar: 'SJ',
    content: 'Ahmad is an exceptional developer who consistently delivers beyond expectations. His technical expertise and problem-solving skills transformed our product vision into reality. Working with him was an absolute pleasure.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'CTO, InnovateTech',
    avatar: 'MC',
    content: 'One of the most talented developers I\'ve had the pleasure of working with. Ahmad\'s ability to understand complex requirements and deliver elegant solutions is remarkable. He\'s a true asset to any team.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Product Manager, DataFlow',
    avatar: 'ER',
    content: 'Ahmad\'s work on our AI-powered analytics platform exceeded all expectations. His deep understanding of both frontend and backend technologies, combined with his AI expertise, made him invaluable to our project.',
    rating: 5,
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Founder, CloudSync Solutions',
    avatar: 'DK',
    content: 'We hired Ahmad for a critical infrastructure project, and he delivered flawlessly. His attention to detail, clean code practices, and excellent communication made the entire process smooth and successful.',
    rating: 5,
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'Director of Engineering, HealthTech',
    avatar: 'LT',
    content: 'Ahmad\'s expertise in building HIPAA-compliant healthcare solutions was impressive. He not only met our technical requirements but also brought innovative ideas that improved our overall product.',
    rating: 5,
  },
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="testimonials section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Client Testimonials</h2>
          <p className="section-subtitle">
            What my clients and colleagues say about working with me
          </p>
        </motion.div>

        <motion.div
          className="testimonials-carousel"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button className="carousel-btn prev" onClick={handlePrev}>
            <FiChevronLeft />
          </button>

          <div className="carousel-container">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                className="testimonial-card glass"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="testimonial-content">
                  <div className="testimonial-stars">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <FiStar key={i} className="star-icon" />
                    ))}
                  </div>
                  <p className="testimonial-text">
                    "{testimonials[currentIndex].content}"
                  </p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonials[currentIndex].name}</h4>
                    <p className="author-role">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button className="carousel-btn next" onClick={handleNext}>
            <FiChevronRight />
          </button>
        </motion.div>

        <div className="carousel-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
