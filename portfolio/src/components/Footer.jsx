import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin, FiTwitter, FiHeart, FiArrowUp } from 'react-icons/fi';
import MonogramLogo from '../assets/monogram.svg';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <a href="#home" className="footer-logo">
              <img src={MonogramLogo} alt="Ahmad Saleh" className="logo-img" />
            </a>
            <p className="footer-tagline">
              Building digital experiences that make a difference.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-nav">
              <h4>Quick Links</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#projects">Projects</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="footer-nav">
              <h4>Connect</h4>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
              <a href="mailto:ahmad@example.com">Email</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            <span>&copy; {currentYear} Ahmad Saleh.</span>
            <span className="made-with">
              Made with <FiHeart className="heart-icon" /> and lots of coffee
            </span>
          </p>

          <div className="footer-socials">
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              aria-label="GitHub"
            >
              <FiGithub />
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              aria-label="LinkedIn"
            >
              <FiLinkedin />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3 }}
              aria-label="Twitter"
            >
              <FiTwitter />
            </motion.a>
          </div>
        </div>
      </div>

      <motion.button
        className="scroll-to-top"
        onClick={scrollToTop}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-label="Scroll to top"
      >
        <FiArrowUp />
      </motion.button>
    </footer>
  );
};

export default Footer;
