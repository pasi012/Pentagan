import React, { useState } from 'react';
import '../css/ClientRegistration.css'; // Import the CSS file

const ClientRegistration = () => {
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    role: 'client', // default to client
    address: '',
    contactName: '',
    contactNo: '',
    submitPerson: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Client registered successfully!');
        navigate('/admin-dashboard');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error registering client:', error);
      alert('Failed to register client.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2>Client Registration</h2>
      <form onSubmit={handleSubmit} style={{ width: '300px' }}>
        <label>User Name:</label>
        <input
          type="text"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          required
        />
        <br />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <br />
        <label>Address:</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <br />
        <label>Contact Name:</label>
        <input
          type="text"
          name="contactName"
          value={formData.contactName}
          onChange={handleChange}
          required
        />
        <br />
        <label>Contact No:</label>
        <input
          type="text"
          name="contactNo"
          value={formData.contactNo}
          onChange={handleChange}
          required
        />
        <br />
        <label>Role:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="client">Client</option>
          <option value="admin">Admin</option>
        </select>        
        <br />
        <label>Submit Person:</label>
        <input
          type="text"
          name="submitPerson"
          value={formData.submitPerson}
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ClientRegistration;
