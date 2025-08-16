import React, { useState, useEffect } from 'react';
import { getAssistants, addEvaluation, updateEvaluation, deleteEvaluation } from '../services/api';
import EvaluationForm from '../components/EvaluationForm';
import pageStyles from '../layouts/Page.module.css';
import tableStyles from '../components/Table.module.css';
import buttonStyles from '../components/Button.module.css';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const EvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getAssistants();
      setAssistants(response.data);
      const allEvals = response.data.flatMap(a =>
        a.evaluations.map(e => ({ ...e, assistantName: a.name, assistantId: a.id }))
      );
      setEvaluations(allEvals);
    } catch (err) {
      setError('No se pudieron cargar los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedEvaluation) {
        await updateEvaluation(formData.assistantId, selectedEvaluation._id, formData);
      } else {
        await addEvaluation(formData.assistantId, formData);
      }
      setModalOpen(false);
      setSelectedEvaluation(null);
      fetchData();
    } catch (err) {
      console.error('Error saving evaluation', err);
      alert('No se pudo guardar la evaluación.');
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedEvaluation(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setModalOpen(true);
  };

  const handleDelete = async (assistantId, evalId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
      try {
        await deleteEvaluation(assistantId, evalId);
        fetchData();
      } catch (err) {
        console.error('Error deleting evaluation', err);
        alert('No se pudo eliminar la evaluación.');
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvaluation(null);
  }

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <header className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>Gestión de Evaluaciones</h1>
        <button onClick={handleOpenCreateModal} className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>
            <i className="fas fa-plus"></i>
            Crear Evaluación
        </button>
      </header>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={selectedEvaluation ? 'Editar Evaluación' : 'Crear Nueva Evaluación'}
      >
        <EvaluationForm
          assistants={assistants}
          onSubmit={handleFormSubmit}
          selectedEvaluation={selectedEvaluation}
          onCancel={handleCloseModal}
        />
      </Modal>

      <div className={pageStyles.contentWrapper}>
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Asistente</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length > 0 ? (
                evaluations.map(ev => (
                  <tr key={ev._id}>
                    <td>{ev.title}</td>
                    <td>{ev.assistantName}</td>
                    <td>{new Date(ev.date).toLocaleDateString('es-ES')}</td>
                    <td>
                      <button onClick={() => handleOpenEditModal(ev)} className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`} title="Editar">
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button onClick={() => handleDelete(ev.assistantId, ev._id)} className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`} title="Eliminar">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No hay evaluaciones creadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvaluationsPage;
