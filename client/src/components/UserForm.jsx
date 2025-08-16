import React, { useState, useEffect } from 'react';
import formStyles from './Form.module.css';
import { getInstitutions } from '../services/api';

const UserForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'admin',
    institution: ''
  });
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si se pasa un usuario para editar, llenamos el formulario con sus datos
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'admin',
        institution: user.institution?._id || ''
      });
    }
  }, [user]);

  useEffect(() => {
    // Cargar las instituciones para el selector
    const fetchInstitutions = async () => {
      try {
        const response = await getInstitutions();
        setInstitutions(response.data);
      } catch (err) {
        console.error("Error al cargar instituciones", err);
        setError("No se pudieron cargar las instituciones.");
      }
    };
    fetchInstitutions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.name || !formData.email || !formData.role || !formData.institution) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={formStyles.form}>
      {error && <p className={formStyles.error}>{error}</p>}
      <div className={formStyles.formGroup}>
        <label htmlFor="name">Nombre Completo</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="role">Rol</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div className={formStyles.formGroup}>
        <label htmlFor="institution">Institución</label>
        <select
          id="institution"
          name="institution"
          value={formData.institution}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione una institución</option>
          {institutions.map(inst => (
            <option key={inst._id} value={inst._id}>{inst.name}</option>
          ))}
        </select>
      </div>
      <div className={formStyles.formActions}>
        <button type="button" onClick={onCancel} className={formStyles.cancelButton}>
          Cancelar
        </button>
        <button type="submit" className={formStyles.submitButton}>
          Guardar
        </button>
      </div>
    </form>
  );
};

export default UserForm;
