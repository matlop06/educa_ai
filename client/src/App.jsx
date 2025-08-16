import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProfesoresPage from './pages/ProfesoresPage';
import UsersPage from './pages/UsersPage';
import InstitutionsPage from './pages/InstitutionsPage';
import CoursesPage from './pages/CoursesPage';
import CreateAssistantPage from './pages/CreateAssistantPage';
import EditAssistantPage from './pages/EditAssistantPage';
import EvaluationPage from './pages/EvaluationPage'; // Added
import EvaluationResultPage from './pages/EvaluationResultPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentChatPage from './pages/StudentChatPage';
import CourseEvaluationsPage from './pages/CourseEvaluationsPage'; // Added
import JoinCoursePage from './pages/JoinCoursePage';
import { UserContext, UserProvider } from './context/UserContext';

const AppRoutes = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student/:assistantId" element={<StudentChatPage />} />
      
      {user ? (
        <Route path="/" element={<DashboardLayout />}>
          <Route path="institutions" element={<InstitutionsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="profesores" element={<ProfesoresPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="join-course" element={<JoinCoursePage />} />
          <Route path="create-assistant" element={<CreateAssistantPage />} />
          <Route path="edit-assistant/:id" element={<EditAssistantPage />} />
          <Route path="evaluations/:assistantId/:evaluationId" element={<EvaluationPage />} />
          <Route path="evaluations/results/:resultId" element={<EvaluationResultPage />} />
          <Route path="course/:courseId/evaluations" element={<CourseEvaluationsPage />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route index element={user.role === 'estudiante' ? <Navigate to="/dashboard" replace /> : <Navigate to="/profesores" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
