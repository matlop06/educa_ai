import React from 'react';
import styles from './EvaluationContinuation.module.css';

const EvaluationContinuation = ({ onContinue, onStop, isRetry }) => {
  return (
    <div className={styles.continuationContainer}>
      <p>¿Qué deseas hacer a continuación?</p>
      <div className={styles.buttonGroup}>
        <button onClick={onContinue} className={`${styles.btn} ${styles.btnContinue}`}>
          {isRetry ? 'Sigamos avanzando para lograr entender la pregunta' : 'Siguiente pregunta'}
        </button>
        <button onClick={onStop} className={`${styles.btn} ${styles.btnStop}`}>
          Salir de la evaluación
        </button>
      </div>
    </div>
  );
};

export default EvaluationContinuation;
