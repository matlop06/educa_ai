import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import styles from './Topbar.module.css';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(UserContext);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  if (!user) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      
      <h2 className={styles.topbarTitle}>Dashboard</h2>

      <div className={styles.topbarRight}>
        <div className={styles.userMenu}>
          <button 
            className={styles.userMenuButton} 
            onClick={() => setDropdownOpen(!isDropdownOpen)}
          >
            <div className={styles.userAvatar}>
              {getInitials(user.name)}
            </div>
            <span className={styles.userName}>{user.name}</span>
            <i className="fas fa-chevron-down" style={{ marginLeft: '8px', fontSize: '0.8em' }}></i>
          </button>

          <div className={`${styles.dropdown} ${isDropdownOpen ? styles.isOpen : ''}`}>
            <a href="/account-settings" className={styles.dropdownItem}>
              Configuración de la Cuenta
            </a>
            <button onClick={logout} className={styles.dropdownItem}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
