import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import useAuthStore from '../store/authStore';

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ustaz');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState({});

    const { login: storeLogin } = useAuthStore();

    // Validation
    const validateForm = () => {
        const errors = {};

        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = "Please enter a valid email";
        }

        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Login Handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const res = await axiosInstance.post('/auth/login', {
                email,
                password,
                role
            });

            storeLogin(res.data.user, res.data.token);

            return { success: true, user: res.data.user };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Invalid email or password';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        role,
        setRole,
        loading,
        error,
        formErrors,
        handleLogin,
    };
};