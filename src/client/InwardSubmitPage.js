import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../css/InwardSubmitPage.css";
import { saveAs } from "file-saver"; // For file download

const InwardSubmitPage = () => {
  const { state } = useLocation();
  const userId = state?.user_id;
  const [batchNo, setBatchNo] = useState("");
  const [details, setDetails] = useState("");
  const [qty, setQty] = useState("");
  const [documentDetails, setDocumentDetails] = useState("");
  const [submitDate, setSubmitDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitPerson, setSubmitPerson] = useState("");
  const [reference, setReference] = useState(""); // New state for reference
  const [message, setMessage] = useState("");

  useEffect(() => {
    const generateBatchNo = () => {
      const randomBatchNo = `BATCH-${Math.floor(100000 + Math.random() * 900000)}`;
      setBatchNo(randomBatchNo);
    };
    generateBatchNo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("User ID not available. Please log in again.");
      return;
    }

    const formData = {
      batch_no: batchNo,
      details,
      qty,
      document_details: documentDetails,
      submit_date: submitDate,
      submit_person: submitPerson,
      reference,
    };

    try {
      const response = await axios.post(`http://localhost:5000/inward/${userId}`, formData);
      setMessage(response.data.message);
      // If inward request is successful, download the report
      if (response.data.message === "Inward request submitted and stock updated successfully") {
        downloadReport(formData);

        // Clear all fields after submission
        setBatchNo("");  // Clear batch number (if needed)
        setDetails("");  // Clear details
        setQty("");      // Clear quantity
        setDocumentDetails(""); // Clear document details
        setSubmitDate(new Date().toISOString().split("T")[0]);  // Reset to today's date
        setSubmitPerson("");   // Clear submit person's name
        setReference("");      // Clear reference

      }
    } catch (error) {
      console.error("Error submitting inward data:", error);
      setMessage("Error occurred while submitting inward data. Please try again.");
    }
  };

  const downloadReport = (data) => {
    const reportData = `
      Batch No: ${data.batch_no}
      Details: ${data.details}
      Quantity: ${data.qty}
      Document Details: ${data.document_details}
      Submit Date: ${data.submit_date}
      Submit Person: ${data.submit_person}
      Reference: ${data.reference}
    `;
    //Generate PDF
    axios.post("http://localhost:5000/generate-pdf", { reportData }, { responseType: "blob" })
      .then(response => {
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        saveAs(pdfBlob, "InwardReport.pdf");
      })
      .catch(err => console.error("Error generating PDF report", err));
  };

  return (
    <div className="inform-container">
      <h2>Inward Submit Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Batch No (Automatically Generated)</label>
          <input type="text" value={batchNo} readOnly />
        </div>
        <div className="form-group">
          <label>Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Enter Details"
            rows="3"
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Enter Quantity"
            required
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Document Details (If Necessary)</label>
          <textarea
            value={documentDetails}
            onChange={(e) => setDocumentDetails(e.target.value)}
            placeholder="Enter Document Details"
            rows="2"
          ></textarea>
        </div>
        <div className="form-group">
          <label>Submit Date</label>
          <input
            type="date"
            value={submitDate}
            onChange={(e) => setSubmitDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Enter Reference"
          />
        </div>
        <div className="form-group">
          <label>Submit Person</label>
          <input
            type="text"
            value={submitPerson}
            onChange={(e) => setSubmitPerson(e.target.value)}
            placeholder="Enter Your Name"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default InwardSubmitPage;
