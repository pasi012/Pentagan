import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import AdminDashboard from './admin/AdminDashboard';
import ClientRegistration from './admin/ClientRegistration';
import AdminRates from './admin/RatesPage';
import ClientDashboard from './client/ClientDashboard';
import ReportPage from "./client/ReportPage";
import InwardSubmitPage from "./client/InwardSubmitPage";
import OutwardRequestPage from "./client/OutwardRequestPage";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginScreen />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/client-register" element={<ClientRegistration />} />
                <Route path="/admin-rates" element={<AdminRates />} />
                <Route path="/client-dashboard" element={<ClientDashboard />} />
                <Route path="/client-report" element={<ReportPage />} />
                <Route path="/client-inward" element={<InwardSubmitPage />} />
                <Route path="/client-outward" element={<OutwardRequestPage />} />
            </Routes>
        </Router>
    );
};

export default App;
