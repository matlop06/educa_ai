import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { getAssistants, deleteAssistant } from '../services/api';
import { Link, Navigate } from 'react-router-dom';
import pageStyles from '../layouts/Page.module.css';
import cardStyles from '../components/Card.module.css';
import buttonStyles from '../components/Button.module.css';
import Spinner from '../components/Spinner';

const AssistantsPage = () => {
  const { user } = useContext(UserContext);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssistants = async () => {
      setLoading(true);
      try {
        const response = await getAssistants();
        setAssistants(response.data);
      } catch (err) {
        setError('No se pudieron cargar los asistentes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssistants();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este asistente?')) {
      try {
        await deleteAssistant(id);
        setAssistants(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error('Error deleting assistant', err);
        alert('No se pudo eliminar el asistente.');
      }
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className={pageStyles.errorMessage}>{error}</div>;

  // Ensure only authorized roles can see this page
  if (!user || !['super-admin', 'admin-institucion', 'profesor'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Mis Asistentes</h1>
        <Link to="/create-assistant" className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>
          Crear Nuevo Asistente
        </Link>
      </header>

      {assistants.length > 0 ? (
        <div className={cardStyles.cardGrid}>
          {assistants.map(assistant => (
            <div key={assistant.id} className={cardStyles.card}>
              <div className={cardStyles.cardBody}>
                <h3 className={cardStyles.cardTitle}>{assistant.name}</h3>
                {assistant.course && (
                  <p className={cardStyles.cardSubtitle}>
                    Curso: {assistant.course.name}
                  </p>
                )}
                <p className={cardStyles.cardText}>
                  Aquí podría ir una breve descripción del asistente.
                </p>
              </div>
              <div className={cardStyles.cardFooter}>
                <button
                  onClick={() => {
                    const shareLink = `${window.location.origin}/student/${assistant.id}`;
                    navigator.clipboard.writeText(shareLink);
                    alert(`Enlace copiado: ${shareLink}`);
                  }}
                  className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
                  title="Compartir Asistente"
                >
                  Compartir
                </button>
                <Link to={`/edit-assistant/${assistant.id}`} className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`} title="Editar Asistente">
                  Editar
                </Link>
                <button onClick={() => handleDelete(assistant.id)} className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`} title="Eliminar Asistente">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>Aún no has creado ningún asistente.</p>
          <Link to="/create-assistant" className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>
            Crear mi primer Asistente
          </Link>
        </div>
      )}
    </>
  );
};

export default AssistantsPage;
