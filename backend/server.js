const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const pdfkit = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '51093510',
  database: 'penta_db',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Login
app.post("/login", (req, res) => {
  const { user_name, password } = req.body;
  const query = "SELECT * FROM users WHERE user_name = ? AND password = ?";

  db.execute(query, [user_name, password], (err, results) => {
    if (err) {
      res.status(500).send({ message: "Error in query execution", error: err });
    } else if (results.length > 0) {
      const user = results[0];
      res.status(200).send({
        message: "Login successful",
        user_id: user.id, // Send user_id for future queries
        role: user.role,
      });
    } else {
      res.status(401).send({ message: "Invalid User Name or password" });
    }
  });
});


// Admin Side

// Register new client
app.post("/register", (req, res) => {
  const { userName, password, role, address, contactName, contactNo, submitPerson } = req.body;

  if (!userName || !password || !address || !contactName || !contactNo || !role || !submitPerson) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // SQL query to insert the new client into the database
  const query = `
    INSERT INTO users (user_name, password, role, address, contact_name, contact_no, submit_person)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.execute(query, [userName, password, role, address, contactName, contactNo, submitPerson], (err, results) => {
    if (err) {
      console.error('Error inserting client:', err);
      return res.status(500).send({ message: "Failed to register client" });
    }
    res.status(200).send({ message: 'Client registered successfully' });
  });
});

// Add Rates
app.post("/rates", (req, res) => {
  const { effectiveRate, ratePerDay, ratePerWeek, ratePerMonth, handlingChargeRate } = req.body;

  if (!effectiveRate || !ratePerDay || !ratePerWeek || !ratePerMonth || !handlingChargeRate) {
    return res.status(400).send({ message: "All fields are required" });
  }

  const query = `
      INSERT INTO charges (effective_rate, rate_per_day, rate_per_week, rate_per_month, handling_charge_rate)
      VALUES (?, ?, ?, ?, ?)
  `;

  db.execute(query, [effectiveRate, ratePerDay, ratePerWeek, ratePerMonth, handlingChargeRate], (err, results) => {
    if (err) {
      console.error('Error saving rates:', err);
      return res.status(500).send({ message: "Failed to save rates" });
    }
    res.status(200).send({ message: "Rates saved successfully" });
  });
});


// Client Side

//create today's close stock
app.get("/stock/today/close/:user_id", (req, res) => {
  const { user_id } = req.params;

  const queryFetchPreviousDayStock = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND stock_date < CURDATE()
    ORDER BY stock_date DESC 
    LIMIT 1`;

  const queryCheckTodayStock = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND DATE(stock_date) = CURDATE()`;

  const queryInsertTodayStock = `
    INSERT INTO close_stock (user_id, stock_date, stock_quantity) 
    VALUES (?, CURDATE(), ?)`;

  db.execute(queryFetchPreviousDayStock, [user_id], (err, previousDayResults) => {
    if (err) {
      console.error("Error fetching previous day's stock:", err);
      return res.status(500).json({ error: "Failed to fetch previous day's stock data" });
    }

    const previousStock = previousDayResults[0]?.stock_quantity || 0;

    db.execute(queryCheckTodayStock, [user_id], (err, todayStockResults) => {
      if (err) {
        console.error("Error checking today's stock:", err);
        return res.status(500).json({ error: "Failed to check today's stock data" });
      }

      if (todayStockResults.length > 0) {
        // Today's stock already exists
        return res.json(todayStockResults[0]);
      }

      // Insert the previous day's stock as today's stock
      db.execute(queryInsertTodayStock, [user_id, previousStock], (err, insertResults) => {
        if (err) {
          console.error("Error inserting today's stock:", err);
          return res.status(500).json({ error: "Failed to insert today's stock data" });
        }

        res.json({ stock_quantity: previousStock });
      });
    });
  });
});

// Fetch Open Stock by User (Today's Data)
app.get("/stock/open/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND stock_date < CURDATE()
    ORDER BY stock_date DESC 
    LIMIT 1`;

  db.execute(query, [user_id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch open stock data" });
    } else if (results.length === 0) {
      res.json([{ stock_quantity: 0 }]); // Default to 0 if no previous data exists
    } else {
      res.json(results);
    }
  });
});

// Fetch Close Stock by User (Today's Data)
app.get("/stock/close/:user_id", (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND DATE(stock_date) = CURDATE()`;

  db.execute(query, [user_id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch close stock data" });
    } else if (results.length === 0) {
      res.json([{ stock_quantity: 0 }]); // Default to 0 if no previous data exists
    } else {
      res.json(results);
    }
  });
});

// Calculate Today's Total Charges
app.get("/total-charges/:user_id", (req, res) => {
  const { user_id } = req.params;

  const queryCloseStock = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    ORDER BY stock_date DESC 
    LIMIT 1`;

  const queryRatePerDay = `
    SELECT rate_per_day 
    FROM charges`;

  db.execute(queryCloseStock, [user_id], (err, closeStockResults) => {
    if (err) return res.status(500).json({ error: "Failed to fetch close stock data" });

    const closeStock = closeStockResults[0]?.stock_quantity || 0;

    db.execute(queryRatePerDay, [user_id], (err, rateResults) => {
      if (err) return res.status(500).json({ error: "Failed to fetch rate per day" });

      const ratePerDay = rateResults[0]?.rate_per_day || 0;
      const totalCharges = closeStock * ratePerDay;

      res.json({ total_charges: totalCharges });
    });
  });
});

// Generate PDF
app.post("/generate-pdf", (req, res) => {
  const { reportData } = req.body;
  const doc = new pdfkit();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=InwardReport.pdf");

  // PDF content
  doc.text(reportData, 100, 100);
  doc.end();
  doc.pipe(res);
});

// Insert Inward Request and Update Close Stock
app.post("/inward/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { batch_no, details, qty, document_details, submit_date, submit_person, reference } = req.body;

  if (!batch_no || !details || qty <= 0 || !submit_person) {
    return res.status(400).send({ message: "Invalid input data" });
  }

  // SQL Query to insert the inward request
  const queryInward = `
    INSERT INTO inward_requests 
    (user_id, batch_no, details, qty, document_details, submit_date, submit_person, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // SQL Query to update the close stock
  const queryUpdateStock = `
    UPDATE close_stock
    SET stock_quantity = stock_quantity + ?
    WHERE user_id = ? AND DATE(stock_date) = CURDATE()
  `;

  // Use `submit_date` if provided, otherwise default to `CURDATE()` (current date)
  const dateToInsert = submit_date || null; // Pass `null` to use default value `CURDATE()` in MySQL

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send({ message: "Error in transaction" });
    }

    // Insert inward request
    db.execute(queryInward, [user_id, batch_no, details, qty, document_details, dateToInsert, submit_person, reference], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error("Error inserting inward request:", err);
          res.status(500).send({ message: "Error in submitting inward request", error: err });
        });
      }

      // Update close stock
      db.execute(queryUpdateStock, [qty, user_id], (err, updateResults) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error updating close stock:", err);
            res.status(500).send({ message: "Error in updating close stock", error: err });
          });
        }

        // Commit the transaction if everything is successful
        db.commit((err) => {
          if (err) {
            console.error("Error committing transaction:", err);
            return db.rollback(() => {
              res.status(500).send({ message: "Error in committing transaction", error: err });
            });
          }

          // Successfully submitted inward request and updated stock
          res.status(200).send({ message: "Inward request submitted and stock updated successfully" });

        });
      });
    });
  });
});

// Fetch inward batches and their quantities
app.get("/inward-batches/:user_id", (req, res) => {
  const { user_id } = req.params;
  const query = `
    SELECT batch_no, qty 
    FROM inward_requests 
    WHERE user_id = ? AND qty > 0`;

  db.execute(query, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching inward batches:", err);
      return res.status(500).json({ error: "Failed to fetch inward batches." });
    }
    res.json(results);
  });
});

// Insert Outward Request and Update Close Stock
app.post("/outward/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { date, batch_no, qty, document_details, submit_person } = req.body;

  if (!batch_no || qty <= 0 || !submit_person) {
    return res.status(400).send({ message: "Invalid input data" });
  }

  const queryUpdateInward = `
    UPDATE inward_requests 
    SET qty = qty - ? 
    WHERE user_id = ? AND batch_no = ?`;

  const insertQuery = `
    INSERT INTO outward_requests (user_id, date, batch_no, qty, document_details, submit_person)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const updateStockQuery = `
    UPDATE close_stock
    SET stock_quantity = stock_quantity - ?
    WHERE user_id = ? AND DATE(stock_date) = CURDATE()
  `;

  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send({ message: "Error in transaction" });
    }

    db.execute(queryUpdateInward, [qty, user_id, batch_no], (err) => {
      if (err) {
        db.rollback();
        return res.status(500).send({ message: "Failed to update inward data" });
      }

      // Insert outward request
      db.execute(insertQuery, [user_id, date, batch_no, qty, document_details, submit_person], (err, results) => {
        if (err) {
          return db.rollback(() => {
            console.error("Error inserting outward request:", err);
            res.status(500).send({ message: "Error in submitting outward request", error: err });
          });
        }

        // Update close stock
        db.execute(updateStockQuery, [qty, user_id], (err, updateResults) => {
          if (err) {
            return db.rollback(() => {
              console.error("Error updating close stock:", err);
              res.status(500).send({ message: "Error in updating close stock", error: err });
            });
          }

          // Commit the transaction if everything is successful
          db.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              return db.rollback(() => {
                res.status(500).send({ message: "Error in committing transaction", error: err });
              });
            }

            res.status(200).send({ message: "Outward request submitted and stock updated successfully" });
          });
        });
      });
    });
  });
});


//Reports

// Fetch previous day's close stock
app.get("/report/previous-close/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { date } = req.query; // Get the date parameter from the query

  const query = `
    SELECT stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND stock_date = ?
  `;

  db.execute(query, [user_id, date], (err, results) => {
    if (err) {
      console.error("Error fetching previous day's stock:", err);
      return res.status(500).json({ error: "Failed to fetch previous day's stock data" });
    }

    if (results.length === 0) {
      return res.json([{ stock_quantity: 0 }]); // Default to 0 if no previous data exists
    } else {
      res.json(results);
    }
  });
});

// Fetch Close Stock in a Date Range by User
app.get("/report/close-range/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { startDate, endDate } = req.query;  // Get start and end dates from query params

  const query = `
    SELECT stock_date, stock_quantity 
    FROM close_stock 
    WHERE user_id = ? 
    AND stock_date BETWEEN ? AND ? 
    ORDER BY stock_date ASC
  `;

  db.execute(query, [user_id, startDate, endDate], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch close stock data" });
    } else {
      res.json(results);
    }
  });
});

// Fetch date-wise sums of inwards and outwards
app.get("/report/inward-outward-sum/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { startDate, endDate } = req.query;

  const query = `
    SELECT 
      stock_date, 
      SUM(CASE WHEN type = 'inward' THEN qty ELSE 0 END) AS total_inwards,
      SUM(CASE WHEN type = 'outward' THEN qty ELSE 0 END) AS total_outwards
    FROM (
      SELECT submit_date AS stock_date, qty, 'inward' AS type
      FROM inward_requests
      WHERE user_id = ? AND submit_date BETWEEN ? AND ?
      UNION ALL
      SELECT date AS stock_date, qty, 'outward' AS type
      FROM outward_requests
      WHERE user_id = ? AND date BETWEEN ? AND ?
    ) AS combined
    GROUP BY stock_date
    ORDER BY stock_date;
  `;

  db.execute(query, [user_id, startDate, endDate, user_id, startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching inward/outward sums:", err);
      return res.status(500).send({ message: "Failed to fetch inward/outward sums", error: err });
    }
    res.json(results);
  });
});

// Fetch Rates
app.get("/report/rates", (req, res) => {
  const query = `
    SELECT 
      rate_per_day, 
      rate_per_week, 
      rate_per_month,
      effective_rate,
      handling_charge_rate
    FROM charges
    LIMIT 1;  -- Assuming you want to return only one set of rates
  `;

  db.execute(query, (err, results) => {
    if (err) {
      console.error("Error fetching rates:", err);
      return res.status(500).send({ message: "Failed to fetch rates" });
    }

    if (results.length === 0) {
      return res.status(404).send({ message: "Rates not found" });
    }

    const {
      rate_per_day,
      rate_per_week,
      rate_per_month,
      effective_rate,
      handling_charge_rate
    } = results[0];

    res.json({
      ratePerDay: rate_per_day,
      ratePerWeek: rate_per_week,
      ratePerMonth: rate_per_month,
      effectiveRate: effective_rate,
      handlingChargeRate: handling_charge_rate
    });
  });
});

// Generate Report PDF
app.post("/report/generate-pdf", (req, res) => {
  const { reportData } = req.body;
  const doc = new pdfkit();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=Report.pdf");

  doc.text("Report", { align: "center" });

  reportData.forEach((report) => {

    // Format date to "YYYY-MM-DD" format
    const formattedDate = new Date(report.date).toISOString().split("T")[0];

    doc.text(
      `Date: ${formattedDate}
      Open Stock: ${report.openStock}
      Total Inward: ${report.totalInward}
      Total Outward: ${report.totalOutward}
      Close Stock: ${report.closeStock}
      Rate Type: ${report.rateType}
      Total Storage Charges: ${report.totalStorageCharges}
      Total Handling Charges: ${report.totalHandlingCharges}
      Total Charges: ${report.totalCharges}`,
      { align: "left" }
    );
    doc.moveDown();
  });

  doc.end();
  doc.pipe(res);
});


//Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
