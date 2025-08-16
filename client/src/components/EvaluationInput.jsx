import React from 'react';
import styles from './EvaluationInput.module.css';

const EvaluationInput = ({ question, onAnswer }) => {
  return (
    <div className={styles.inputContainer}>
      {question.options && question.options.length > 0 ? (
        <div className={styles.optionsGrid}>
          {question.options.map((option, index) => (
            <button 
              key={index} 
              onClick={() => onAnswer(option)} 
              className={styles.optionButton}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.openQuestionHint}>Escribe tu respuesta en el campo de texto y presiona "Enviar".</p>
      )}
    </div>
  );
};

export default EvaluationInput;
