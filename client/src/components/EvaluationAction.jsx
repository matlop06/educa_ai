import React from 'react';
import styles from './EvaluationAction.module.css';

const EvaluationAction = ({ payload, onStart }) => {
    return (
        <div className={styles.actionContainer}>
            <p>{payload.text}</p>
            <button onClick={() => onStart(payload)} className={styles.actionButton}>
                {payload.buttonText}
            </button>
        </div>
    );
};

export default EvaluationAction;
