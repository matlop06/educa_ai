import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourses } from '../services/api'; // Assuming getCourses can fetch a single course with evaluations
import Spinner from '../components/Spinner';
import styles from './CourseEvaluationsPage.module.css';
import DashboardLayout from '../layouts/DashboardLayout';

const CourseEvaluationsPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // This assumes getCourses can be adapted to fetch a single course by ID
        // Or a new API endpoint is created: getCourseById(courseId)
        const response = await getCourses(); 
        const currentCourse = response.data.find(c => c._id === courseId);
        setCourse(currentCourse);
      } catch (error) {
        console.error('Error fetching course evaluations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loading) return <Spinner />;
  if (!course) return <div>Curso no encontrado.</div>;

  const allEvaluations = course.assistants.flatMap(a => a.evaluations.map(e => ({...e, assistantId: a._id})));

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <h1>Evaluaciones de {course.name}</h1>
          <Link to={`/student/${course.assistants[0]}`} className={styles.backButton}>
            Volver al Chat
          </Link>
        </header>
        <main className={styles.grid}>
          {allEvaluations.length > 0 ? (
            allEvaluations.map(evaluation => (
              <div key={evaluation._id} className={styles.evaluationCard}>
                <h3>{evaluation.title}</h3>
                <p>Fecha: {new Date(evaluation.date).toLocaleDateString()}</p>
                <Link to={`/evaluations/${evaluation.assistantId}/${evaluation._id}`} className={styles.startButton}>
                  Iniciar Evaluación
                </Link>
              </div>
            ))
          ) : (
            <p>No hay evaluaciones disponibles para este curso.</p>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default CourseEvaluationsPage;
