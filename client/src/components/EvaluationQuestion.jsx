import React from 'react';
import styles from './EvaluationQuestion.module.css';

const EvaluationQuestion = ({ question, onAnswer }) => {
  return (
    <div className={styles.questionContainer}>
      <p className={styles.questionText}>{question.text}</p>
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
        <p className={styles.openQuestionHint}>Escribe tu respuesta a continuación.</p>
      )}
    </div>
  );
};

export default EvaluationQuestion;
