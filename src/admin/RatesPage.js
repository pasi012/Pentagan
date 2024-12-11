import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/RatesPage.css';

const RatesPage = () => {
    const [effectiveRate, setEffectiveRate] = useState('');
    const [ratePerDay, setRatePerDay] = useState('');
    const [ratePerWeek, setRatePerWeek] = useState('');
    const [ratePerMonth, setRatePerMonth] = useState('');
    const [handlingChargeRate, setHandlingChargeRate] = useState('');
    const navigate = useNavigate();

    const handleSaveRates = () => {
        const ratesData = {
            effectiveRate,
            ratePerDay,
            ratePerWeek,
            ratePerMonth,
            handlingChargeRate
        };

        // Send data to the backend to store rates
        axios.post('http://localhost:5000/rates', ratesData)
            .then((response) => {
                console.log('Rates saved successfully:', response.data);
                alert('Rates saved successfully!');
                navigate('/admin-dashboard'); // Navigate back to the admin dashboard
            })
            .catch((error) => {
                console.error('Error saving rates:', error);
            });
    };

    return (
        <div className="container">
            <div className="card">
                <h1 className="rateheading">Manage Rates</h1>
                <form>
                    <div className="form-group">
                        <label>Effective Rate:</label>
                        <input 
                            type="number" 
                            value={effectiveRate} 
                            onChange={(e) => setEffectiveRate(e.target.value)} 
                            placeholder="Enter effective rate" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Rate per Day:</label>
                        <input 
                            type="number" 
                            value={ratePerDay} 
                            onChange={(e) => setRatePerDay(e.target.value)} 
                            placeholder="Enter rate per day" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Rate per Week:</label>
                        <input 
                            type="number" 
                            value={ratePerWeek} 
                            onChange={(e) => setRatePerWeek(e.target.value)} 
                            placeholder="Enter rate per week" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Rate per Month:</label>
                        <input 
                            type="number" 
                            value={ratePerMonth} 
                            onChange={(e) => setRatePerMonth(e.target.value)} 
                            placeholder="Enter rate per month" 
                        />
                    </div>
                    <div className="form-group">
                        <label>Handling Charge Rate:</label>
                        <input 
                            type="number" 
                            value={handlingChargeRate} 
                            onChange={(e) => setHandlingChargeRate(e.target.value)} 
                            placeholder="Enter handling charge rate" 
                        />
                    </div>
                    <button 
                        type="button" 
                        className="button" 
                        onClick={handleSaveRates}
                    >
                        Save Rates
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatesPage;
