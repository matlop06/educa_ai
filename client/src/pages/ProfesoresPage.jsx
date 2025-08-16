import React, { useState } from 'react';
import AssistantsPage from './AssistantsPage';
import EvaluationsPage from './EvaluationsPage';
import pageStyles from '../layouts/Page.module.css';
import styles from './ProfesoresPage.module.css';

const ProfesoresPage = () => {
  const [activeTab, setActiveTab] = useState('assistants');

  return (
    <>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Gestión de Profesores</h1>
      </header>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'assistants' ? styles.active : ''}`}
          onClick={() => setActiveTab('assistants')}
        >
          Asistentes de IA
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'evaluations' ? styles.active : ''}`}
          onClick={() => setActiveTab('evaluations')}
        >
          Evaluaciones
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'assistants' && <AssistantsPage />}
        {activeTab === 'evaluations' && <EvaluationsPage />}
      </div>
    </>
  );
};

export default ProfesoresPage;
