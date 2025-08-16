import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { getInstitutions, getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { Navigate } from 'react-router-dom';

import DashboardLayout from '../layouts/DashboardLayout';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import Spinner from '../components/Spinner';

import pageStyles from '../layouts/Page.module.css';
import tableStyles from '../components/Table.module.css';
import buttonStyles from '../components/Button.module.css';
import formStyles from '../components/Form.module.css';
import styles from './UsersPage.module.css'; // Custom styles for this page

const UsersPage = () => {
  const { user } = useContext(UserContext);
  const [institutions, setInstitutions] = useState([]);
  const [usersByInstitution, setUsersByInstitution] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const institutionsResponse = await getInstitutions();
      const institutionsData = institutionsResponse.data;
      setInstitutions(institutionsData);

      const usersResponse = await getUsers();
      const usersData = usersResponse.data;

      // Group users by institution
      const groupedUsers = usersData.reduce((acc, u) => {
        const institutionId = u.institution?._id || 'unassigned';
        if (!acc[institutionId]) {
          acc[institutionId] = [];
        }
        acc[institutionId].push(u);
        return acc;
      }, {});

      setUsersByInstitution(groupedUsers);

    } catch (err) {
      setError('No se pudieron cargar los datos.');
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

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setIsModalOpen(true);
  };

  const handleOpenConfirmModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setIsConfirmModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (formData) => {
    try {
      if (selectedUser) {
        await updateUser(selectedUser._id, formData);
      } else {
        await createUser(formData);
      }
      fetchData();
      handleCloseModals();
    } catch (err) {
      console.error('Error al guardar el usuario', err);
      alert('No se pudo guardar el usuario.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser._id);
      fetchData();
      handleCloseModals();
    } catch (err) {
      console.error('Error al eliminar el usuario', err);
      alert('Error al eliminar el usuario.');
    }
  };

  if (user?.role !== 'super-admin') {
    return <Navigate to="/assistants" replace />;
  }

  return (
    <>
      <header className={pageStyles.header}>
        <h1 className={pageStyles.title}>Gestión de Usuarios</h1>
        <button onClick={handleOpenCreateModal} className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`}>
          Crear Usuario
        </button>
      </header>

      {loading && <Spinner />}
      {error && <div className={pageStyles.errorMessage}>{error}</div>}
      
      {!loading && !error && (
        <div className={styles.institutionsContainer}>
          {institutions.map(institution => (
            <div key={institution._id} className={styles.institutionCard}>
              <h2 className={styles.institutionName}>{institution.name}</h2>
              <div className={tableStyles.tableWrapper}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersByInstitution[institution._id]?.length > 0 ? (
                      usersByInstitution[institution._id].map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td className={tableStyles.actionsCell}>
                            <button 
                              onClick={() => handleOpenEditModal(u)} 
                              className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleOpenConfirmModal(u)}
                              className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`}
                              disabled={u.role === 'super-admin'}
                              title={u.role === 'super-admin' ? 'No se puede eliminar' : 'Eliminar'}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No hay usuarios en esta institución.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={selectedUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}>
        <UserForm user={selectedUser} onSave={handleSaveUser} onCancel={handleCloseModals} />
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={handleCloseModals} title="Confirmar Eliminación">
        <div>
          <p>¿Estás seguro de que quieres eliminar al usuario <strong>{selectedUser?.name}</strong>?</p>
          <p>Esta acción no se puede deshacer.</p>
          <div className={formStyles.formActions}>
            <button onClick={handleCloseModals} className={`${buttonStyles.button} ${buttonStyles.buttonSecondary}`}>Cancelar</button>
            <button onClick={handleConfirmDelete} className={`${buttonStyles.button} ${buttonStyles.buttonDanger}`}>Eliminar</button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UsersPage;
