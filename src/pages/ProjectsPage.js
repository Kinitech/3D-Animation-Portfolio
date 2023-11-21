import './ProjectsPage.css';

function ProjectsPage({projects, title, header, color}) {

  return (
      <div className='projects-page'>
          <h1 className='page-header'>{header}</h1>
          <div className='page-title'>{title}</div>
          <div className='project-grid'>
              {projects.map((project, index) => (
                  <div className='project-item' key={index}>
                      <img alt={project.title} src={project.img} className='project-image'/>
                      <div className='project-content'>
                          <h3 className='project-title'>{project.title}</h3>
                          <p className='project-description'>{project.description}</p>
                          <div className='project-button-container'>
                              <a style={{backgroundColor:`rgb${color})`}} href={project.link} target="_blank" rel="noopener noreferrer">Project Site</a>
                              <a style={{backgroundColor:`rgb${color})`}} href={project.github} target="_blank" rel="noopener noreferrer">Github</a>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}

export default ProjectsPage;
