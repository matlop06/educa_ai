import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssistantById, submitEvaluation } from '../services/api';
import Spinner from '../components/Spinner';
import EvaluationQuestion from '../components/EvaluationQuestion';
import styles from './EvaluationPage.module.css';

const EvaluationPage = () => {
    const { assistantId, evaluationId } = useParams();
    const navigate = useNavigate();
    const [evaluation, setEvaluation] = useState(null);
    const [assistantName, setAssistantName] = useState('');
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        const fetchEvaluation = async () => {
            try {
                const response = await getAssistantById(assistantId);
                const assistant = response.data;
                setAssistantName(assistant.name);
                const evalData = assistant.evaluations.find(e => e._id === evaluationId);
                setEvaluation(evalData);
            } catch (error) {
                console.error('Error fetching evaluation:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluation();
    }, [assistantId, evaluationId]);

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async () => {
        try {
            const response = await submitEvaluation(evaluationId, { answers });
            navigate(`/evaluations/results/${response.data.resultId}`);
        } catch (error) {
            console.error('Error submitting evaluation:', error);
        }
    };

    if (loading) return <Spinner />;
    if (!evaluation) return <div>Evaluación no encontrada.</div>;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <header className={styles.pageHeader}>
                    <h1>{evaluation.title}</h1>
                    <p>Asistente: {assistantName}</p>
                </header>
                <main className={styles.content}>
                    {evaluation.questions.map(question => (
                        <EvaluationQuestion
                            key={question._id}
                            question={question}
                            onAnswerChange={handleAnswerChange}
                        />
                    ))}
                    <button onClick={handleSubmit} className={styles.submitButton}>
                        Finalizar Evaluación
                    </button>
                </main>
            </div>
        </div>
    );
};

export default EvaluationPage;
