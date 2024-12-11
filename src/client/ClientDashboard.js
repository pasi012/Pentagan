import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import "../css/ClientDashboard.css"; // Import the CSS file

ChartJS.register(ArcElement, Tooltip, Legend);

const ClientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get userId from the login or context
  const userId = location.state?.user_id;

  const [openStockData, setOpenStockData] = useState([]);
  const [closeStockData, setCloseStockData] = useState([]);
  const [totalChargesData, setTotalChargesData] = useState(0);

  // Fetch data when the component is mounted
  useEffect(() => {
    if (userId) {
      fetchCloseStock();
      fetchOpenStockData();
      fetchCloseStockData();
      fetchTotalChargesData();
    }
  }, [userId]);

  const fetchCloseStock = async () => {
    try {
      await axios.get(`http://localhost:5000/stock/today/close/${userId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOpenStockData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/stock/open/${userId}`);
      const data = response.data.map((item) => item.stock_quantity);
      setOpenStockData(data);
    } catch (error) {
      console.error("Error fetching open stock data:", error);
    }
  };

  const fetchCloseStockData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/stock/close/${userId}`);
      const data = response.data.map((item) => item.stock_quantity);
      setCloseStockData(data);
    } catch (error) {
      console.error("Error fetching close stock data:", error);
    }
  };

  const fetchTotalChargesData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/total-charges/${userId}`);
      setTotalChargesData(response.data.total_charges);
    } catch (error) {
      console.error("Error fetching today's total charges:", error);
    }
  };

  const createPieChartData = (data, labels, backgroundColors) => ({
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
      },
    ],
  });

  const navigateToInward = () => {
    navigate("/client-inward", { state: { user_id: userId } });
  };

  const navigateToOutward = () => {
    navigate("/client-outward", { state: { user_id: userId } });
  };

  const navigateToReport = () => {
    navigate("/client-report", { state: { user_id: userId } });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      <div className="charts-section">
        {/* Open Stock */}
        <div className="chart-card">
          <h3>Today Open Stock</h3>
          {openStockData.length ? (
            <Doughnut
              data={createPieChartData(
                openStockData,
                openStockData.map((_) => `Today's Open Stock`),
                ["#4bc0c0", "#36a2eb", "#ff6384", "#ff9f40"]
              )}
            />
          ) : (
            <p>Loading Open Stock Data...</p>
          )}
        </div>

        {/* Close Stock */}
        <div className="chart-card">
          <h3>Today Close Stock</h3>
          {closeStockData.length > 0 && closeStockData.some((item) => item > 0) ? (
            <Pie
              data={createPieChartData(
                closeStockData,
                closeStockData.map((_) => `Today's Close Stock`),
                ["#9966ff", "#ff9f40", "#ff6384", "#4bc0c0"]
              )}
            />
          ) : (
            <p>No Close Stock Data Available</p>
          )}
        </div>

        {/* Total Charges */}
        <div className="chart-card">
          <h3>Today Total Storage Charges</h3>
          {totalChargesData > 0 ? (
            <Doughnut
              data={createPieChartData(
                [totalChargesData, 100 - totalChargesData],
                ["Today's Charges", "Remaining"],
                ["#ffcd56", "#c9cbcf"]
              )}
            />
          ) : (
            <p>Loading Total Charges Data...</p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button onClick={navigateToReport}>Report</button><br/>
        <button onClick={navigateToInward}>Inward Submit</button><br/>
        <button onClick={navigateToOutward}>Outward Request</button>
      </div>
    </div>
  );
};

export default ClientDashboard;
