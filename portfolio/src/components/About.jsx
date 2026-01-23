import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCode, FiServer, FiDatabase, FiCpu, FiLayout, FiGitBranch } from 'react-icons/fi';
import './About.css';

const skills = [
  {
    category: 'Frontend',
    icon: <FiLayout />,
    items: [
      { name: 'React', level: 95 },
      { name: 'TypeScript', level: 90 },
      { name: 'Next.js', level: 85 },
      { name: 'Tailwind CSS', level: 92 },
    ],
  },
  {
    category: 'Backend',
    icon: <FiServer />,
    items: [
      { name: 'Node.js', level: 90 },
      { name: 'Python', level: 92 },
      { name: 'Django', level: 88 },
      { name: 'Express.js', level: 85 },
    ],
  },
  {
    category: 'Database',
    icon: <FiDatabase />,
    items: [
      { name: 'PostgreSQL', level: 88 },
      { name: 'MongoDB', level: 85 },
      { name: 'Redis', level: 80 },
      { name: 'MySQL', level: 85 },
    ],
  },
  {
    category: 'AI & ML',
    icon: <FiCpu />,
    items: [
      { name: 'TensorFlow', level: 82 },
      { name: 'OpenAI API', level: 90 },
      { name: 'LangChain', level: 85 },
      { name: 'Scikit-learn', level: 80 },
    ],
  },
];

const stats = [
  { number: '7+', label: 'Years Experience' },
  { number: '50+', label: 'Projects Completed' },
  { number: '30+', label: 'Happy Clients' },
  { number: '15+', label: 'Technologies' },
];

const About = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section id="about" className="about section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.h2 className="section-title" variants={itemVariants}>
            About Me
          </motion.h2>
          <motion.p className="section-subtitle" variants={itemVariants}>
            A passionate developer with expertise in building modern, scalable applications
          </motion.p>
        </motion.div>

        <div className="about-content">
          <motion.div
            className="about-text"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <motion.p variants={itemVariants}>
              I'm a <strong>Senior Software Developer</strong> with over 7 years of experience
              in crafting digital solutions that drive business growth. My journey in tech
              started with a curiosity for how things work, and it has evolved into a
              passion for building innovative applications.
            </motion.p>
            <motion.p variants={itemVariants}>
              I specialize in <strong>full-stack development</strong> using modern frameworks
              like React and Django, with a growing focus on <strong>AI/ML integration</strong>.
              I believe in writing clean, maintainable code and creating user experiences
              that are both beautiful and functional.
            </motion.p>
            <motion.p variants={itemVariants}>
              When I'm not coding, you'll find me exploring new technologies, contributing
              to open-source projects, or sharing my knowledge through technical blogs and
              mentoring fellow developers.
            </motion.p>

            <motion.div className="about-stats" variants={itemVariants}>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="stat-item"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="about-skills"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {skills.map((skillGroup, groupIndex) => (
              <motion.div
                key={skillGroup.category}
                className="skill-group glass"
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="skill-header">
                  <span className="skill-icon">{skillGroup.icon}</span>
                  <h3 className="skill-category">{skillGroup.category}</h3>
                </div>
                <div className="skill-items">
                  {skillGroup.items.map((skill, index) => (
                    <div key={skill.name} className="skill-item">
                      <div className="skill-info">
                        <span className="skill-name">{skill.name}</span>
                        <span className="skill-level">{skill.level}%</span>
                      </div>
                      <div className="skill-bar">
                        <motion.div
                          className="skill-progress"
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${skill.level}%` } : {}}
                          transition={{ duration: 1, delay: 0.5 + groupIndex * 0.1 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
