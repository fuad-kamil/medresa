import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import StudentLogin from './pages/StudentLogin';
import ExamPlayer from './pages/ExamPlayer';
import UstazQuizManager from './pages/UstazQuizManager';
import UstazLogin from './pages/UstazLogin';

export default function App() {
  const [quizId, setQuizId] = useState(null);
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [ustazToken, setUstazToken] = useState(null);
  const [ustazUser, setUstazUser] = useState(null);

  useEffect(() => {
    // Parse query params
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('quizId');
    const token = params.get('token');
    const userJson = params.get('user');

    if (qId) setQuizId(qId);
    
    if (token) {
      // Accessed via URL token from Main Portal -> DO NOT persist in storage
      setUstazToken(token);
      sessionStorage.removeItem('ustazToken');
      sessionStorage.removeItem('ustazUser');
    } else {
      // Accessed via direct login -> retrieve persisted credentials in sessionStorage
      setUstazToken(sessionStorage.getItem('ustazToken'));
    }

    if (userJson) {
      try {
        const parsedUser = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        setUstazUser(parsedUser);
      } catch (e) {}
    } else {
      if (!token) {
        const storedUser = sessionStorage.getItem('ustazUser');
        if (storedUser) {
          try { setUstazUser(JSON.parse(storedUser)); } catch (e) {}
        }
      }
    }

    // Clean token and sensitive params from URL address bar for security
    if (token || userJson) {
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (qId ? `?quizId=${qId}` : '');
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  // 1. Student Exam Flow
  if (quizId) {
    return (
      <>
        <Toaster position="top-center" />
        {!verifiedStudent ? (
          <StudentLogin
            quizId={quizId}
            onVerified={(student) => setVerifiedStudent(student)}
          />
        ) : (
          <ExamPlayer quizId={quizId} student={verifiedStudent} />
        )}
      </>
    );
  }

  // 2. Ustaz Login Screen (If not logged in)
  if (!ustazToken || !ustazUser) {
    return (
      <>
        <Toaster position="top-center" />
        <UstazLogin
          onLoginSuccess={(token, user) => {
            setUstazToken(token);
            setUstazUser(user);
          }}
        />
      </>
    );
  }

  const handleLogout = () => {
    setUstazToken(null);
    setUstazUser(null);
    sessionStorage.removeItem('ustazToken');
    sessionStorage.removeItem('ustazUser');
    localStorage.removeItem('ustazToken');
    localStorage.removeItem('ustazUser');
  };

  // 3. Ustaz Exam Manager View (If logged in)
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <UstazQuizManager ustazToken={ustazToken} ustazUser={ustazUser} onLogout={handleLogout} />
    </div>
  );
}
