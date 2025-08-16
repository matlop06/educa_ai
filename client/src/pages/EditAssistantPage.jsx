import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { getCourses, getAssistantById, updateAssistant } from '../services/api';
import pageStyles from '../layouts/Page.module.css';
import formStyles from '../components/Form.module.css';
import Spinner from '../components/Spinner';

const EditAssistantPage = () => {
  const { user } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    style: 'formal',
    isPublic: false,
    course: '',
  });
  const [knowledgeFile, setKnowledgeFile] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const coursesResponse = await getCourses();
        setCourses(coursesResponse.data);

        const assistantResponse = await getAssistantById(id);
        const assistant = assistantResponse.data;
        setFormData({
          name: assistant.name,
          instructions: assistant.instructions,
          style: assistant.style,
          isPublic: assistant.isPublic,
          course: assistant.course?._id || '', // Ensure we are using the ID
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setKnowledgeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    // Append all form data
    Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
    });
    if (knowledgeFile) {
      data.append('knowledgeFile', knowledgeFile);
    }

    try {
      await updateAssistant(id, data);
      navigate('/assistants');
    } catch (error) {
      console.error('Error updating assistant:', error);
      alert('No se pudo actualizar el asistente.');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <header className={pageStyles.pageHeader}>
        <h1 className={pageStyles.pageTitle}>Editar Asistente</h1>
      </header>
      <div className={pageStyles.contentWrapper}>
        <form onSubmit={handleSubmit}>
          <div className={formStyles.formGroup}>
            <label htmlFor="name" className={formStyles.formLabel}>Nombre del Asistente</label>
            <input type="text" id="name" className={formStyles.formInput} name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="instructions" className={formStyles.formLabel}>Instrucciones Personalizadas</label>
            <textarea id="instructions" className={formStyles.formTextarea} name="instructions" value={formData.instructions} onChange={handleChange} rows="6" required></textarea>
          </div>

          <div className={formStyles.formGroup}>
            <label className={formStyles.formLabel}>Institución Educativa</label>
            <p>{user?.institution?.name || 'N/A'}</p>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="course" className={formStyles.formLabel}>Curso (Opcional)</label>
            <select id="course" name="course" className={formStyles.formSelect} value={formData.course} onChange={handleChange}>
              <option value="">Selecciona un curso...</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="style" className={formStyles.formLabel}>Personalidad del Asistente</label>
            <select id="style" name="style" className={formStyles.formSelect} value={formData.style} onChange={handleChange}>
              <option value="formal">Formal y Profesional</option>
              <option value="amigable">Amigable y Cercano</option>
              <option value="directo">Directo y Conciso</option>
              <option value="socratico">Socrático (guía con preguntas)</option>
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="knowledgeFile" className={formStyles.formLabel}>Reemplazar Archivo de Conocimiento (Opcional)</label>
            <input type="file" id="knowledgeFile" className={formStyles.fileInput} name="knowledgeFile" onChange={handleFileChange} accept=".txt,.pdf,.doc,.docx" />
          </div>


          <div className={formStyles.formActions}>
            <button type="button" onClick={() => navigate('/assistants')} className={`${formStyles.button} ${formStyles.buttonSecondary}`}>Cancelar</button>
            <button type="submit" className={formStyles.button}>Actualizar Asistente</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssistantPage;
