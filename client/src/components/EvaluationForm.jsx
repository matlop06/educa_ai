import React, { useState, useEffect } from 'react';
import { generateEvaluationDraft, generateAnswers } from '../services/api';
import formStyles from './Form.module.css';
import Spinner from './Spinner';

const EvaluationForm = ({ assistants, onSubmit, selectedEvaluation, onCancel }) => {
  const [formData, setFormData] = useState({
    assistantId: '',
    title: '',
    date: '',
  });
  const [questions, setQuestions] = useState([]);
  const [generationMode, setGenerationMode] = useState('manual');
  const [rawQuestions, setRawQuestions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedEvaluation) {
      setFormData({
        assistantId: selectedEvaluation.assistantId,
        title: selectedEvaluation.title,
        date: new Date(selectedEvaluation.date).toISOString().split('T')[0],
      });
      setQuestions(selectedEvaluation.questions || []);
    } else {
      setFormData({ assistantId: '', title: '', date: '' });
      setQuestions([]);
    }
  }, [selectedEvaluation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', correctAnswer: '' }]);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleGenerateAnswers = async () => {
    if (!formData.assistantId || rawQuestions.trim() === '') {
      alert('Por favor, selecciona un asistente y escribe las preguntas.');
      return;
    }
    setIsLoading(true);
    try {
      const questionList = rawQuestions.split('\n').filter(q => q.trim() !== '');
      const response = await generateAnswers(formData.assistantId, { questions: questionList });
      const newQuestions = questionList.map((q, i) => ({
        text: q,
        correctAnswer: response.data.answers[i] || ''
      }));
      setQuestions(newQuestions);
    } catch (error) {
      console.error('Error generating answers:', error);
      alert('No se pudieron generar las respuestas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!formData.assistantId || formData.title.trim() === '') {
      alert('Por favor, selecciona un asistente y escribe un título para la evaluación.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await generateEvaluationDraft(formData.assistantId, { title: formData.title });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error generating draft:', error);
      alert('No se pudo generar el borrador de la evaluación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, questions });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Assistant, Title, Date fields... */}
      <div className={formStyles.formGroup}>
        <label htmlFor="assistantId" className={formStyles.formLabel}>Asistente</label>
        <select id="assistantId" name="assistantId" className={formStyles.formSelect} value={formData.assistantId} onChange={handleChange} required>
          <option value="">Selecciona un asistente...</option>
          {assistants.map(assistant => (
            <option key={assistant.id} value={assistant.id}>{assistant.name}</option>
          ))}
        </select>
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="title" className={formStyles.formLabel}>Título</label>
        <input type="text" id="title" name="title" className={formStyles.formInput} value={formData.title} onChange={handleChange} required />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="date" className={formStyles.formLabel}>Fecha</label>
        <input type="date" id="date" name="date" className={formStyles.formInput} value={formData.date} onChange={handleChange} required />
      </div>

      <div className={formStyles.tabs}>
        <button type="button" onClick={() => setGenerationMode('manual')} className={`${formStyles.tabButton} ${generationMode === 'manual' ? formStyles.active : ''}`}>Manual</button>
        <button type="button" onClick={() => setGenerationMode('gen_answers')} className={`${formStyles.tabButton} ${generationMode === 'gen_answers' ? formStyles.active : ''}`}>Generar Respuestas</button>
        <button type="button" onClick={() => setGenerationMode('gen_draft')} className={`${formStyles.tabButton} ${generationMode === 'gen_draft' ? formStyles.active : ''}`}>Generar Borrador</button>
      </div>

      {isLoading && <Spinner />}

      <div className={formStyles.tabContent}>
        {generationMode === 'manual' && (
          <div>
            {questions.map((q, index) => (
              <div key={index} className={formStyles.questionCard}>
                <div className={formStyles.questionHeader}>
                  <strong>Pregunta {index + 1}</strong>
                  <button type="button" className={formStyles.deleteButton} onClick={() => handleRemoveQuestion(index)}>&times;</button>
                </div>
                <div className={formStyles.formGroup}>
                  <label className={formStyles.formLabel}>Texto de la Pregunta</label>
                  <input type="text" placeholder="Escribe la pregunta aquí..." className={formStyles.formInput} value={q.text} onChange={(e) => handleQuestionChange(index, 'text', e.target.value)} />
                </div>
                <div className={formStyles.formGroup}>
                  <label className={formStyles.formLabel}>Respuesta Correcta</label>
                  <input type="text" placeholder="Escribe la respuesta correcta aquí..." className={formStyles.formInput} value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" className={`${formStyles.button} ${formStyles.buttonSecondary} ${formStyles.buttonWithIcon}`} onClick={handleAddQuestion}>
              <i className="fas fa-plus"></i>
              Añadir Pregunta
            </button>
          </div>
        )}

        {generationMode === 'gen_answers' && (
          <div>
            <textarea placeholder="Escribe una pregunta por línea..." rows="10" className={formStyles.formTextarea} value={rawQuestions} onChange={(e) => setRawQuestions(e.target.value)} disabled={isLoading} />
            <button type="button" className={`${formStyles.button} ${formStyles.buttonWithIcon}`} onClick={handleGenerateAnswers} disabled={isLoading}>
              {isLoading ? <Spinner /> : <i className="fas fa-magic"></i>}
              Generar Respuestas
            </button>
          </div>
        )}

        {generationMode === 'gen_draft' && (
          <div>
            <p>Se generará un borrador de 5 preguntas basado en el título y el asistente seleccionado.</p>
            <button type="button" className={`${formStyles.button} ${formStyles.buttonWithIcon}`} onClick={handleGenerateDraft} disabled={isLoading}>
              {isLoading ? <Spinner /> : <i className="fas fa-file-alt"></i>}
              Generar Borrador
            </button>
          </div>
        )}
      </div>

      <div className={formStyles.formActions}>
        <button type="button" className={`${formStyles.button} ${formStyles.buttonSecondary}`} onClick={onCancel} disabled={isLoading}>Cancelar</button>
        <button type="submit" className={`${formStyles.button} ${formStyles.buttonWithIcon}`} disabled={isLoading}>
          {isLoading ? <Spinner /> : <i className="fas fa-save"></i>}
          {selectedEvaluation ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default EvaluationForm;
