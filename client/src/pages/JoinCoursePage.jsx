import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinCourse } from '../services/api';

const JoinCoursePage = () => {
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await joinCourse(enrollmentCode);
      setSuccess(response.data.message || 'Inscripción exitosa. Serás redirigido a tus cursos.');
      // Redirect to the courses page after a short delay
      setTimeout(() => {
        navigate('/courses');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al inscribirte en el curso.');
      console.error('Join course failed', err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Inscribirse a un Curso</h2>
              <p className="text-muted text-center mb-4">
                Introduce el código de inscripción que te proporcionó tu profesor para añadirte al curso.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="enrollmentCode" className="form-label">Código de Inscripción</label>
                  <input
                    type="text"
                    className="form-control"
                    id="enrollmentCode"
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value)}
                    required
                    placeholder="Ej: CURSO-12345"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Inscribirme</button>
              </form>
              {error && <div className="alert alert-danger mt-3">{error}</div>}
              {success && <div className="alert alert-success mt-3">{success}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCoursePage;
