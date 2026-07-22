import React, { useState } from 'react';

const MAIN_API_URL = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:5000/api';

export default function UstazLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${MAIN_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      if (data.user?.role !== 'ustaz' && data.user?.role !== 'admin') {
        throw new Error('Access denied. Only Ustazs and Admins can log in here.');
      }

      localStorage.setItem('ustazToken', data.token);
      localStorage.setItem('ustazUser', JSON.stringify(data.user));

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-emerald-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto mb-3">
            📚
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ustaz Exam Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Log in with your Medresa credentials</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ustaz Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ustaz@medresa.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 text-gray-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Log In to Exam Manager'}
          </button>
        </form>
      </div>
    </div>
  );
}
