import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleClientRegistrationClick = () => {
        // Navigate to the client registration page
        navigate('/client-register');
    };

    const handleRatesClick = () => {
        // Navigate to the rates page
        navigate('/admin-rates');
    };

    return (
        <div className="container">
            <div className="card">
                <h1 className="heading">Welcome to Admin</h1>
                <p>Manage your application efficiently and seamlessly.</p>
                <button
                    className="button"
                    onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = '#007BFF')}
                    onClick={handleClientRegistrationClick}
                >
                    Client Registration
                </button>
                <button
                    className="button"
                    onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = '#007BFF')}
                    onClick={handleRatesClick}
                >
                    Rates
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
