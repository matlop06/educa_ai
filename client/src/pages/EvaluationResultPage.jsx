import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEvaluationResult } from '../services/api';
import Spinner from '../components/Spinner';
import styles from './EvaluationResultPage.module.css';

const EvaluationResultPage = () => {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const response = await getEvaluationResult(resultId);
                setResult(response.data);
            } catch (error) {
                console.error('Error fetching evaluation results:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId]);

    if (loading) return <Spinner />;
    if (!result) return <div>Resultados no encontrados.</div>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <header className={styles.pageHeader}>
                    <h1>Resultados de la Evaluación</h1>
                    <p><strong>Evaluación:</strong> {result.evaluation.title}</p>
                    <p><strong>Puntuación:</strong> {result.score} / {result.totalQuestions}</p>
                </header>
                <main className={styles.content}>
                    {result.evaluation.questions.map((question, index) => {
                        const studentAnswer = result.answers.find(a => a.question === question._id);
                        return (
                            <div key={question._id} className={styles.questionResult}>
                                <p><strong>{index + 1}. {question.text}</strong></p>
                                <p className={studentAnswer.isCorrect ? styles.correct : styles.incorrect}>
                                    Tu respuesta: {studentAnswer.answer}
                                </p>
                                {!studentAnswer.isCorrect && (
                                    <p className={styles.correctAnswer}>
                                        Respuesta correcta: {question.correctAnswer}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </main>
            </div>
        </div>
    );
};

export default EvaluationResultPage;
