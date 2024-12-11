import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../css/OutwardRequestPage.css";

const OutwardRequestPage = () => {
  const { state } = useLocation();
  const userId = state?.user_id;

  const [batchNo, setBatchNo] = useState("");
  const [batchList, setBatchList] = useState([]); // To store batch numbers
  const [fullQty, setFullQty] = useState(0); // Quantity of selected batch
  const [requestedQty, setRequestedQty] = useState("");
  const [submitPerson, setSubmitPerson] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [documentDetails, setDocumentDetails] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch batch numbers and their quantities
    const fetchBatches = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/inward-batches/${userId}`);
        setBatchList(response.data); // Assuming response.data is an array of { batch_no, qty }
      } catch (error) {
        console.error("Error fetching batches:", error);
        setMessage("Failed to load batch data.");
      }
    };
    if (userId) fetchBatches();
  }, [userId]);

  const handleBatchChange = (e) => {
    const selectedBatch = batchList.find(batch => batch.batch_no === e.target.value);
    setBatchNo(e.target.value);
    setFullQty(selectedBatch ? selectedBatch.qty : 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("User ID not available. Please log in again.");
      return;
    }

    if (parseInt(requestedQty) > fullQty) {
      setMessage("Requested quantity exceeds available quantity.");
      return;
    }

    const formData = {
      date,
      batch_no: batchNo,
      qty: requestedQty,
      document_details: documentDetails,
      submit_person: submitPerson,
    };

    try {
      const response = await axios.post(`http://localhost:5000/outward/${userId}`, formData);
      setMessage(response.data.message);
      setBatchList(prev =>
        prev.map(batch =>
          batch.batch_no === batchNo
            ? { ...batch, qty: batch.qty - parseInt(requestedQty) }
            : batch
        )
      );
      setRequestedQty("");
      setFullQty(fullQty - parseInt(requestedQty));

      // If inward request is successful, download the report
      if (response.data.message === "Outward request submitted and stock updated successfully") {
        downloadReport(formData);
      }

    } catch (error) {
      console.error("Error submitting outward data:", error);
      setMessage("Error occurred while submitting outward data. Please try again.");
    }
  };

  const downloadReport = (data) => {
    const reportData = `
      Batch No: ${data.batch_no}
      Quantity: ${data.qty}
      Document Details: ${data.document_details}
      Date: ${data.date}
      Submit Person: ${data.submit_person}
    `;
    //Generate PDF
    axios.post("http://localhost:5000/generate-pdf", { reportData }, { responseType: "blob" })
      .then(response => {
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        saveAs(pdfBlob, "OutwardReport.pdf");
      })
      .catch(err => console.error("Error generating PDF report", err));
  };

  return (
    <div className="outform-container">
      <h2>Outward Request Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Batch No Dropdown */}
        <div className="form-group">
          <label>Batch No</label>
          <select value={batchNo} onChange={handleBatchChange} required>
            <option value="" disabled>Select Batch No</option>
            {batchList.map((batch) => (
              <option key={batch.batch_no} value={batch.batch_no}>
                {batch.batch_no} (Qty: {batch.qty})
              </option>
            ))}
          </select>
        </div>

        {/* Full Quantity */}
        <div className="form-group">
          <label>Full Quantity</label>
          <input type="number" value={fullQty} readOnly />
        </div>

        {/* Requested Quantity */}
        <div className="form-group">
          <label>Request Quantity</label>
          <input
            type="number"
            value={requestedQty}
            onChange={(e) => setRequestedQty(e.target.value)}
            required
          />
        </div>

        {/* Document Details */}
        <div className="form-group">
          <label>Document Details</label>
          <textarea
            value={documentDetails}
            onChange={(e) => setDocumentDetails(e.target.value)}
            rows="2"
          ></textarea>
        </div>

        {/* Date Field */}
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Submit Person */}
        <div className="form-group">
          <label>Submit Person</label>
          <input
            type="text"
            value={submitPerson}
            onChange={(e) => setSubmitPerson(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default OutwardRequestPage;
