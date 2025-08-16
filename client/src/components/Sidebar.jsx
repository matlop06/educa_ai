import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useContext(UserContext);

  if (!user) {
    return null;
  }

  const sidebarClasses = `${styles.sidebar} ${isOpen ? styles.isOpen : ''}`;

  return (
    <aside className={sidebarClasses}>
      <div className={styles.sidebarHeader}>
        <a href="/dashboard" className={styles.sidebarBrand}>Educa AI</a>
      </div>
      <nav className={styles.sidebarNav}>
        <ul>
          {user.role === 'super-admin' && (
            <>
              <li>
                <NavLink to="/institutions"><i className="fas fa-school fa-fw"></i>Instituciones</NavLink>
              </li>
            </>
          )}
          {['super-admin', 'admin-institucion'].includes(user.role) && (
             <li>
                <NavLink to="/courses"><i className="fas fa-book fa-fw"></i>Cursos</NavLink>
              </li>
          )}
          {['super-admin', 'admin-institucion', 'profesor'].includes(user.role) && (
            <li>
              <NavLink to="/profesores"><i className="fas fa-chalkboard-teacher fa-fw"></i>Profesores</NavLink>
            </li>
          )}
          {user.role === 'super-admin' && (
            <li>
              <NavLink to="/users"><i className="fas fa-users fa-fw"></i>Usuarios</NavLink>
            </li>
          )}
          {user.role === 'estudiante' && (
            <>
              <li>
                <NavLink to="/courses"><i className="fas fa-book fa-fw"></i>Mis Cursos</NavLink>
              </li>
              <li>
                <NavLink to="/join-course"><i className="fas fa-plus-circle fa-fw"></i>Inscribirse a Curso</NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
