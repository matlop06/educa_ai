import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { getCourses, createCourse, deleteCourse, getInstitutions } from '../services/api';
import { Navigate } from 'react-router-dom';
import pageStyles from '../layouts/Page.module.css';
import tableStyles from '../components/Table.module.css';
import formStyles from '../components/Form.module.css';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const CoursesPage = () => {
  const { user } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the creation modal
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    courseName: '',
    professorName: '',
    professorEmail: ''
  });

  // State for the success/credentials modal
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [newProfessorCredentials, setNewProfessorCredentials] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const courseResponse = await getCourses();
      setCourses(courseResponse.data);
      if (user?.role === 'super-admin') {
        const instResponse = await getInstitutions();
        setInstitutions(instResponse.data);
      }
    } catch (err) {
      setError('No se pudieron cargar los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const dataToSend = { ...formData };
    if (user?.role === 'super-admin') {
      if (!dataToSend.institutionId) {
        alert('Por favor, selecciona una institución.');
        return;
      }
    }

    try {
      const response = await createCourse(dataToSend);
      setFormData({ courseName: '', professorName: '', professorEmail: '', institutionId: '' });
      setCreateModalOpen(false);
      setNewProfessorCredentials({
        email: response.data.professor.email,
        password: response.data.generatedPassword
      });
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al crear el curso.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro? Esto eliminará el curso y sus asistentes.')) {
      try {
        await deleteCourse(id);
        fetchData();
      } catch (err) {
        alert('Error al eliminar el curso.');
      }
    }
  };

  if (!user) return <Spinner />;

  const canViewPage = ['super-admin', 'admin-institucion', 'profesor', 'estudiante'].includes(user.role);
  if (!canViewPage) {
      return <Navigate to="/profesores" replace />;
  }

  const coursesToDisplay = user.role === 'estudiante' ? user.courses : courses;

  return (
    <>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Cursos</h1>
        {['super-admin', 'admin-institucion'].includes(user.role) && (
            <button onClick={() => setCreateModalOpen(true)} className={pageStyles.actionButton}>
                Crear Curso
            </button>
        )}
      </header>

      {/* Creation Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Nuevo Curso y Asignar Profesor">
        <form onSubmit={handleCreate} className={formStyles.form}>
          {user.role === 'super-admin' && (
            <div className={formStyles.formGroup}>
              <label htmlFor="institutionId" className={formStyles.formLabel}>Institución</label>
              <select id="institutionId" name="institutionId" className={formStyles.formSelect} value={formData.institutionId || ''} onChange={handleInputChange} required>
                <option value="">Selecciona una institución...</option>
                {institutions.map(inst => (
                  <option key={inst._id} value={inst._id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={formStyles.formGroup}>
            <label htmlFor="courseName" className={formStyles.formLabel}>Nombre del Curso</label>
            <input type="text" id="courseName" name="courseName" className={formStyles.formInput} value={formData.courseName} onChange={handleInputChange} required />
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="professorName" className={formStyles.formLabel}>Nombre del Profesor</label>
            <input type="text" id="professorName" name="professorName" className={formStyles.formInput} value={formData.professorName} onChange={handleInputChange} required />
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="professorEmail" className={formStyles.formLabel}>Email del Profesor</label>
            <input type="email" id="professorEmail" name="professorEmail" className={formStyles.formInput} value={formData.professorEmail} onChange={handleInputChange} required />
          </div>
          <button type="submit" className={formStyles.button}>Crear</button>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setSuccessModalOpen(false)} title="Profesor Creado y Asignado con Éxito">
        <div>
          <p>Guarda estas credenciales para el nuevo profesor.</p>
          <div className={formStyles.formGroup}>
            <label className={formStyles.formLabel}>Email</label>
            <input type="text" readOnly value={newProfessorCredentials?.email} className={formStyles.formInput} />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.formLabel}>Contraseña Temporal</label>
            <input type="text" readOnly value={newProfessorCredentials?.password} className={formStyles.formInput} />
          </div>
          <button onClick={() => setSuccessModalOpen(false)} className={formStyles.button}>Cerrar</button>
        </div>
      </Modal>

      {loading && <Spinner />}
      {error && <div className={pageStyles.errorMessage}>{error}</div>}

      {!loading && !error && (
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Nombre del Curso</th>
                <th>Institución</th>
                <th>Profesores</th>
                <th>Código de Inscripción</th>
                {user.role !== 'estudiante' && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {coursesToDisplay.length > 0 ? (
                coursesToDisplay.map(course => (
                  <tr key={course._id}>
                    <td>{course.name}</td>
                    <td>{course.institution?.name || 'N/A'}</td>
                    <td>{course.professors.map(p => p.name).join(', ')}</td>
                    <td><code>{course.enrollmentCode}</code></td>
                    {user.role !== 'estudiante' && (
                        <td className={tableStyles.actionsCell}>
                            <button className={`${tableStyles.actionButton} ${tableStyles.deleteButton}`} onClick={() => handleDelete(course._id)}>
                                Eliminar
                            </button>
                        </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user.role === 'estudiante' ? 4 : 5}>
                    {user.role === 'estudiante' ? 'No estás inscrito en ningún curso.' : 'No hay cursos creados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default CoursesPage;
