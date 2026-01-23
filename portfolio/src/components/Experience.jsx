import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiBriefcase, FiCalendar, FiMapPin } from 'react-icons/fi';
import './Experience.css';

const experiences = [
  {
    id: 1,
    role: 'Senior Software Developer',
    company: 'Tech Innovators Inc.',
    location: 'San Francisco, CA',
    period: '2022 - Present',
    description: 'Leading development of AI-powered enterprise solutions. Architecting scalable microservices and mentoring junior developers.',
    achievements: [
      'Led a team of 5 developers to deliver 3 major product releases',
      'Reduced system latency by 40% through architecture optimization',
      'Implemented CI/CD pipelines reducing deployment time by 60%',
    ],
    technologies: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
  },
  {
    id: 2,
    role: 'Full Stack Developer',
    company: 'Digital Solutions Co.',
    location: 'New York, NY',
    period: '2020 - 2022',
    description: 'Built and maintained multiple client-facing web applications using modern JavaScript frameworks and Python backends.',
    achievements: [
      'Developed 10+ responsive web applications for enterprise clients',
      'Integrated third-party APIs and payment gateways',
      'Improved application performance by 50% through code optimization',
    ],
    technologies: ['React', 'Django', 'PostgreSQL', 'Redis', 'GraphQL'],
  },
  {
    id: 3,
    role: 'Software Developer',
    company: 'StartUp Ventures',
    location: 'Austin, TX',
    period: '2018 - 2020',
    description: 'Worked in a fast-paced startup environment, building MVPs and iterating based on user feedback.',
    achievements: [
      'Built MVP that secured $2M in seed funding',
      'Implemented real-time features using WebSocket technology',
      'Collaborated with design team to improve UX/UI',
    ],
    technologies: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Socket.io'],
  },
  {
    id: 4,
    role: 'Junior Developer',
    company: 'WebDev Agency',
    location: 'Chicago, IL',
    period: '2017 - 2018',
    description: 'Started my professional journey building websites and web applications for small to medium businesses.',
    achievements: [
      'Developed 20+ responsive websites for various clients',
      'Learned and applied best practices in web development',
      'Received "Rising Star" award for exceptional performance',
    ],
    technologies: ['HTML', 'CSS', 'JavaScript', 'PHP', 'WordPress'],
  },
];

const Experience = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section id="experience" className="experience section" ref={ref}>
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Work Experience</h2>
          <p className="section-subtitle">
            My professional journey and the companies I've had the pleasure to work with
          </p>
        </motion.div>

        <div className="experience-timeline">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              className="timeline-item"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="timeline-marker">
                <div className="marker-dot" />
                <div className="marker-line" />
              </div>

              <motion.div
                className="timeline-content glass"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="experience-header">
                  <div className="experience-role-info">
                    <h3 className="experience-role">{exp.role}</h3>
                    <div className="experience-company">
                      <FiBriefcase />
                      {exp.company}
                    </div>
                  </div>
                  <div className="experience-meta">
                    <span className="experience-period">
                      <FiCalendar />
                      {exp.period}
                    </span>
                    <span className="experience-location">
                      <FiMapPin />
                      {exp.location}
                    </span>
                  </div>
                </div>

                <p className="experience-description">{exp.description}</p>

                <ul className="experience-achievements">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>

                <div className="experience-tech">
                  {exp.technologies.map((tech) => (
                    <span key={tech} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="experience-download"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <a href="#" className="btn btn-primary">
            Download Full Resume
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;
