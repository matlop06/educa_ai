import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';
import styles from './StudentDashboard.module.css';
import DashboardLayout from '../layouts/DashboardLayout';

const StudentDashboard = () => {
  const { user } = useContext(UserContext);

  return (
    <DashboardLayout>
      <div className={styles.dashboardContainer}>
        <h1>Mis Cursos</h1>
        {user?.courses && user.courses.length > 0 ? (
          <div className={styles.courseGrid}>
            {user.courses.map(course => (
              <div key={course._id} className={styles.courseCard}>
                <h2>{course.name}</h2>
                <div className={styles.cardActions}>
                  <Link to={`/student/${course.assistants[0]}`} className={styles.actionButton}>
                    Hablar con Asistente
                  </Link>
                  {/* This will link to a new page listing all evaluations for the course */}
                  <Link to={`/course/${course._id}/evaluations`} className={styles.actionButton}>
                    Ver Evaluaciones
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Aún no estás inscrito en ningún curso.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
