import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiExternalLink, FiGithub, FiFolder } from 'react-icons/fi';
import './Projects.css';

const projects = [
  {
    id: 1,
    title: 'AI-Powered Analytics Dashboard',
    description: 'A comprehensive analytics platform with machine learning insights, real-time data visualization, and predictive analytics for business intelligence.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    tags: ['React', 'Python', 'TensorFlow', 'D3.js'],
    category: 'AI/ML',
    github: '#',
    live: '#',
    featured: true,
  },
  {
    id: 2,
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration, inventory management, and a modern shopping experience built for scalability.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    tags: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe'],
    category: 'Full Stack',
    github: '#',
    live: '#',
    featured: true,
  },
  {
    id: 3,
    title: 'Real-Time Collaboration Tool',
    description: 'A Notion-like workspace with real-time editing, team collaboration features, and seamless document management.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    tags: ['React', 'Socket.io', 'MongoDB', 'Redis'],
    category: 'Full Stack',
    github: '#',
    live: '#',
    featured: true,
  },
  {
    id: 4,
    title: 'Smart Home IoT Dashboard',
    description: 'IoT dashboard for monitoring and controlling smart home devices with real-time updates and automation rules.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop',
    tags: ['React', 'Python', 'MQTT', 'InfluxDB'],
    category: 'IoT',
    github: '#',
    live: '#',
    featured: false,
  },
  {
    id: 5,
    title: 'Healthcare Management System',
    description: 'HIPAA-compliant healthcare platform with appointment scheduling, patient records, and telemedicine capabilities.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
    tags: ['Django', 'React', 'PostgreSQL', 'WebRTC'],
    category: 'Healthcare',
    github: '#',
    live: '#',
    featured: false,
  },
  {
    id: 6,
    title: 'AI Content Generator',
    description: 'GPT-powered content generation platform for marketing teams with templates, brand voice customization, and analytics.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    tags: ['Next.js', 'OpenAI', 'LangChain', 'Prisma'],
    category: 'AI/ML',
    github: '#',
    live: '#',
    featured: false,
  },
];

const categories = ['All', 'Full Stack', 'AI/ML', 'IoT', 'Healthcare'];

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter((project) => project.category === activeCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="projects" className="projects section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-subtitle">
            A selection of my recent work that showcases my skills and passion for building great products
          </p>
        </motion.div>

        <motion.div
          className="projects-filter"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </motion.div>

        <motion.div
          className="projects-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <AnimatePresence mode="wait">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                className={`project-card glass ${project.featured ? 'featured' : ''}`}
                variants={itemVariants}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="project-image">
                  <img src={project.image} alt={project.title} />
                  <div className="project-overlay">
                    <div className="project-links">
                      <a href={project.github} className="project-link" aria-label="GitHub">
                        <FiGithub />
                      </a>
                      <a href={project.live} className="project-link" aria-label="Live Demo">
                        <FiExternalLink />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="project-content">
                  <div className="project-category">
                    <FiFolder />
                    {project.category}
                  </div>
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">{project.description}</p>
                  <div className="project-tags">
                    {project.tags.map((tag) => (
                      <span key={tag} className="project-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="projects-cta"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <FiGithub />
            View All Projects on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
