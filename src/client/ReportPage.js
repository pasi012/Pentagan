import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { saveAs } from "file-saver"; // For downloading PDF
import "../css/ReportPage.css";

const ReportPage = () => {
  const { state } = useLocation();
  const userId = state?.user_id;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateType, setRateType] = useState("Rate Per Day");
  const [effectiveRate, setEffectiveRate] = useState(0);  // New state for effective rate
  const [ratePerDay, setRatePerDay] = useState(0); // State for rate per day
  const [ratePerWeek, setRatePerWeek] = useState(0); // State for rate per week
  const [ratePerMonth, setRatePerMonth] = useState(0); // State for rate per month
  const [handlingChargeRate, setHandlingChargeRate] = useState(0); // State for handling charge rate

  const fetchRates = async () => {
    try {
      const response = await axios.get("http://localhost:5000/report/rates");
      const data = response.data;

      setRatePerDay(data.ratePerDay);
      setRatePerWeek(data.ratePerWeek);
      setRatePerMonth(data.ratePerMonth);
      setEffectiveRate(data.effectiveRate); // Set effective rate
      setHandlingChargeRate(data.handlingChargeRate); // Set handling charge rate
    } catch (error) {
      console.error(error);
      setError("Failed to fetch rates");
    }
  };

  useEffect(() => {
    fetchRates(); // Fetch rates on component load
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [rateType]);

  const fetchData = async () => {
    
    if (!startDate || !endDate) {
      setError("Please select a start and end date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch the previous day's close stock for the start date
      const prevDate = new Date(startDate);
      prevDate.setDate(prevDate.getDate() - 1); // Set previous day
      const prevStockDate = formatDate(prevDate); // Format as "YYYY-MM-DD"

      const prevStockResponse = await axios.get(`http://localhost:5000/report/previous-close/${userId}`, {
        params: { date: prevStockDate },
      });
      const prevStock = prevStockResponse.data[0]?.stock_quantity || 0;

      // Fetch close-range data
      const closeRangeResponse = await axios.get(`http://localhost:5000/report/close-range/${userId}`, {
        params: { startDate, endDate },
      });
      const closeRangeData = closeRangeResponse.data;

      // Fetch inward-outward data
      const inwardOutwardResponse = await axios.get(`http://localhost:5000/report/inward-outward-sum/${userId}`, {
        params: { startDate, endDate },
      });
      const inwardOutwardData = inwardOutwardResponse.data;

      // Calculate open stock and merge data
      let openStock = prevStock;
      const combinedReports = closeRangeData.map((closeReport, index) => {
        const matchingInwardOutward = inwardOutwardData.find(
          (io) => io.stock_date === closeReport.stock_date
        ) || { total_inwards: 0, total_outwards: 0 };

        if (index === 0) {
          openStock = prevStock; // Use previous day's close stock for the first entry
        } else {
          openStock = closeRangeData[index - 1].stock_quantity; // Use previous day's close stock for subsequent entries
        }

        const total_inward = parseInt(matchingInwardOutward.total_inwards, 10) + parseInt(matchingInwardOutward.total_outwards, 10);
        const total_storage_charges = parseInt(closeReport.stock_quantity, 10) * getRate();
        const total_handling_charges = (parseInt(matchingInwardOutward.total_inwards, 10) + parseInt(matchingInwardOutward.total_outwards, 10) + parseInt(matchingInwardOutward.total_outwards, 10)) * handlingChargeRate;
        const total_charges = total_storage_charges + total_handling_charges;

        return {
          date: closeReport.stock_date,
          openStock,
          closeStock: closeReport.stock_quantity,
          totalInward: total_inward,
          totalOutward: matchingInwardOutward.total_outwards,
          totalStorageCharges: total_storage_charges,
          totalHandlingCharges: total_handling_charges,
          totalCharges: total_charges,
        };
      });

      setReports(combinedReports);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  // Function to get rate based on selected rate type
  const getRate = () => {
    switch (rateType) {
      case "Rate Per Week":
        return ratePerWeek;
      case "Rate Per Month":
        return ratePerMonth;
      default:
        return ratePerDay;
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const downloadReport = async () => {
    const reportData = reports.map((report) => ({
      date: report.date,
      openStock: report.openStock,
      totalInward: report.totalInward,
      totalOutward: report.totalOutward,
      closeStock: report.closeStock,
      rateType: getRate(),
      totalStorageCharges: report.totalStorageCharges,
      totalHandlingCharges: report.totalHandlingCharges,
      totalCharges: report.totalCharges,
    }));

    try {
      const response = await axios.post(
        "http://localhost:5000/report/generate-pdf",
        { reportData },
        { responseType: "blob" }
      );
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      saveAs(pdfBlob, "Report.pdf");
    } catch (error) {
      console.error("Error generating PDF report:", error);
      setError("Failed to generate PDF report");
    }
  };

  return (
    <div className="report-container">
      <h1 className="report-title">Report Page</h1>

      {/* Effective Rate input field */}
      <div className="effective-rate">
        <label>
          Effective Rate :
          <input
            type="number"
            value={effectiveRate}
            className="effective-rate-input"
            disabled
          />
        </label>
      </div>

      <div className="report-inputs">
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <label>
          Rate Type:<br />
          <select
            value={rateType}
            onChange={(e) => setRateType(e.target.value)}
            className="rate-dropdown"
          >
            <option value="Rate Per Day">Rate Per Day</option>
            <option value="Rate Per Week">Rate Per Week</option>
            <option value="Rate Per Month">Rate Per Month</option>
          </select>
        </label>

        <button onClick={fetchData} disabled={loading} className="fetch-button">
          {loading ? "Loading..." : "Fetch Reports"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <table className="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Open Stock</th>
            <th>Total Inward</th>
            <th>Total Outward</th>
            <th>Close Stock</th>
            <th>{rateType}</th>
            <th>Total Storage Charges</th>
            <th>Total Handling Charges</th>
            <th>Total Charges</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <tr key={index}>
              <td>{formatDate(report.date)}</td> {/* Format date here */}
              <td>{report.openStock}</td>
              <td>{report.totalInward}</td>
              <td>{report.totalOutward}</td>
              <td>{report.closeStock}</td>
              <td>{getRate()}</td>
              <td>{report.totalStorageCharges}</td>
              <td>{report.totalHandlingCharges}</td>
              <td>{report.totalCharges}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Get Report button */}
      <div className="report-actions">
        <button onClick={downloadReport} className="download-button">
          Download Report
        </button>
      </div>
    </div>
  );
};

export default ReportPage;
