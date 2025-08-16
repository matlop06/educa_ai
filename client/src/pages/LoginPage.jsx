import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import styles from './LoginPage.module.css'; // Import the new CSS module

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      navigate('/profesores');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Email o contraseña incorrectos.';
      setError(errorMessage);
      console.error('Login failed', err);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.brandSection}>
        <h1 className={styles.brandTitle}>Educa AI</h1>
        <p className={styles.brandSlogan}>Potenciando la educación del futuro.</p>
      </div>
      <div className={styles.formSection}>
        <div className={styles.loginCard}>
          <h2 className={styles.title}>Iniciar Sesión</h2>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>Correo Electrónico</label>
              <input
                type="email"
                id="email"
                className={styles.formInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>Contraseña</label>
              <input
                type="password"
                id="password"
                className={styles.formInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className={styles.submitButton}>
              Entrar
            </button>
          </form>
          <div className={styles.footerText}>
            <p>Si no tienes una cuenta, contacta a tu administrador.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
