import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

// --- Icon Components ---
// Using simple functional components for icons to keep the JSX clean.
const FeatureIcon = ({ children }) => <div className={styles.featureIcon}>{children}</div>;
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
  </svg>
);
const PersonGearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4zm9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.15c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382l.045-.148zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z" /></svg>
);
const ShieldLockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M8 0c-.087 0-.174.007-.252.021l.252-.021a6.5 6.5 0 0 1 6.5 6.5v2h-3v-.5a.5.5 0 0 0-1 0V10h-1v-1a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H6v-1a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v1H2v-2A6.5 6.5 0 0 1 8 0zM5 10.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5zm3 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5z" /><path d="M8 15A5 5 0 0 1 3 10V8.5a.5.5 0 0 1 1 0V10a4 4 0 0 0 8 0V8.5a.5.5 0 0 1 1 0V10a5 5 0 0 1-5 5z" /></svg>
);


const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={styles.landingPage}>
      {/* Navbar */}
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <Link className={styles.brand} to="/">Educa AI</Link>
          <Link to="/login" className={styles.navLink}>Iniciar Sesión</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.heroTitle}>Transforma tu Material de Estudio en Asistentes de IA Personalizados</h1>
          <p className={styles.heroSubtitle}>Ahorra tiempo, potencia el aprendizaje y ofrece apoyo 24/7 a tus alumnos con una IA que enseña con tu propio contenido.</p>
          <Link to="/login" className={`${styles.btn} ${styles.btnPrimary}`}>Comienza Ahora</Link>
        </div>
      </header>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Una Herramienta Diseñada para Educadores</h2>
            <p>Más allá de un chatbot genérico.</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <FeatureIcon><CheckIcon /></FeatureIcon>
              <h3>Contenido Controlado</h3>
              <p>La IA responde basándose exclusivamente en tu material de estudio, garantizando respuestas precisas y relevantes para tu currículo.</p>
            </div>
            <div className={styles.featureCard}>
              <FeatureIcon><PersonGearIcon /></FeatureIcon>
              <h3>Personalidad a Medida</h3>
              <p>Define el rol y el estilo de tu asistente. Desde un tutor paciente hasta un examinador exigente, la IA adopta la personalidad que necesitas.</p>
            </div>
            <div className={styles.featureCard}>
              <FeatureIcon><ShieldLockIcon /></FeatureIcon>
              <h3>Entorno Seguro y Enfocado</h3>
              <p>Ofrece a tus alumnos una herramienta de estudio sin las distracciones o la información no verificada de los chatbots de internet.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className={styles.comparison}>
        <div className={styles.container}>
            <div className={styles.sectionHeader}>
                <h2>¿Por qué Educa AI y no un Chatbot Genérico?</h2>
                <p>La diferencia está en el control y el enfoque pedagógico.</p>
            </div>
            <div className={styles.comparisonGrid}>
                <div className={styles.comparisonColumn}>
                    <h4>Chatbots Genéricos (ChatGPT, Gemini)</h4>
                    <ul>
                        <li>❌ Basado en conocimiento general de internet.</li>
                        <li>❌ Riesgo de respuestas incorrectas o fuera de contexto.</li>
                        <li>❌ No conoce tu plan de estudios específico.</li>
                        <li>❌ Entorno abierto con posibles distracciones.</li>
                    </ul>
                </div>
                <div className={`${styles.comparisonColumn} ${styles.educaAiColumn}`}>
                    <h4>Educa AI</h4>
                    <ul>
                        <li>✅ Basado <strong>exclusivamente</strong> en tu contenido.</li>
                        <li>✅ Respuestas precisas y 100% alineadas con tu currículo.</li>
                        <li>✅ "Aprende" de tus planes de estudio, guías y apuntes.</li>
                        <li>✅ Entorno seguro y controlado para el aprendizaje.</li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Empieza a Revolucionar tu Enseñanza Hoy</h2>
          <p>Únete a la nueva era de la educación personalizada.</p>
          <Link to="/login" className={`${styles.btn} ${styles.btnPrimary}`}>Crear mi Primer Asistente</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>Copyright &copy; Educa AI 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
