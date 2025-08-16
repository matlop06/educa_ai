import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { getInstitutions, createInstitution, deleteInstitution } from '../services/api';
import { Navigate } from 'react-router-dom';
import pageStyles from '../layouts/Page.module.css';
import tableStyles from '../components/Table.module.css';
import formStyles from '../components/Form.module.css';
import buttonStyles from '../components/Button.module.css';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const InstitutionsPage = () => {
  const { user } = useContext(UserContext);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the creation modal
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    adminName: '',
    adminEmail: ''
  });

  // State for the success/credentials modal
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [newAdminCredentials, setNewAdminCredentials] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getInstitutions();
      setInstitutions(response.data);
    } catch (err) {
      setError('No se pudieron cargar las instituciones.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super-admin') {
      fetchData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await createInstitution(formData.institutionName, formData.adminName, formData.adminEmail);
      setFormData({ institutionName: '', adminName: '', adminEmail: '' });
      setCreateModalOpen(false);
      setNewAdminCredentials({
        email: response.data.admin.email,
        password: response.data.generatedPassword
      });
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al crear la institución.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro? Esto eliminará la institución y todos sus usuarios, cursos y asistentes asociados.')) {
      try {
        await deleteInstitution(id);
        fetchData();
      } catch (err) {
        alert('Error al eliminar la institución.');
      }
    }
  };

  if (user?.role !== 'super-admin') {
    return <Navigate to="/profesores" replace />;
  }

  return (
    <>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Gestión de Instituciones</h1>
        <button onClick={() => setCreateModalOpen(true)} className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>
            Crear Institución
        </button>
      </header>

      {loading && <Spinner />}
      {error && <div className={pageStyles.errorMessage}>{error}</div>}

      {/* Creation Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Nueva Institución y Administrador">
        <form onSubmit={handleCreate} className={formStyles.form}>
          <div className={formStyles.formGroup}>
            <label htmlFor="institutionName" className={formStyles.formLabel}>Nombre de la Institución</label>
            <input type="text" id="institutionName" name="institutionName" className={formStyles.formInput} value={formData.institutionName} onChange={handleInputChange} required />
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="adminName" className={formStyles.formLabel}>Nombre del Administrador</label>
            <input type="text" id="adminName" name="adminName" className={formStyles.formInput} value={formData.adminName} onChange={handleInputChange} required />
          </div>
          <div className={formStyles.formGroup}>
            <label htmlFor="adminEmail" className={formStyles.formLabel}>Email del Administrador</label>
            <input type="email" id="adminEmail" name="adminEmail" className={formStyles.formInput} value={formData.adminEmail} onChange={handleInputChange} required />
          </div>
          <button type="submit" className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>Crear</button>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setSuccessModalOpen(false)} title="Administrador Creado con Éxito">
        <div>
          <p>Guarda estas credenciales. Serán necesarias para el primer inicio de sesión del administrador.</p>
          <div className={formStyles.formGroup}>
            <label className={formStyles.formLabel}>Email</label>
            <input type="text" readOnly value={newAdminCredentials?.email} className={formStyles.formInput} />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.formLabel}>Contraseña Temporal</label>
            <input type="text" readOnly value={newAdminCredentials?.password} className={formStyles.formInput} />
          </div>
          <button onClick={() => setSuccessModalOpen(false)} className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}>Cerrar</button>
        </div>
      </Modal>

      {!loading && !error && (
        <div className={tableStyles.tableWrapper}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Nombre de la Institución</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {institutions.length > 0 ? (
                institutions.map(inst => (
                  <tr key={inst._id}>
                    <td>{inst.name}</td>
                    <td className={tableStyles.actionsCell}>
                      <button className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`} onClick={() => handleDelete(inst._id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No hay instituciones creadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default InstitutionsPage;
