const pool = require('../config/db.config');

// CREATE a new customer
exports.createCustomer = async (req, res) => {
  const { full_name, email, phone_number, address } = req.body;
  const created_by_user_id = req.user.id; // The logged-in user creating the customer

  if (!full_name || !phone_number || !address) {
    return res.status(400).send({ message: "Full name, phone number, and address are required." });
  }

  try {
    const sql = 'INSERT INTO customers (full_name, email, phone_number, address, created_by) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [full_name, email, phone_number, address, created_by_user_id]);
    res.status(201).send({ message: "Customer created successfully!", customerId: result.insertId });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).send({ message: "Error creating customer." });
  }
};

// READ all customers (existing function)
exports.getAllCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT id, full_name, email, phone_number, address FROM customers ORDER BY created_at DESC');
    res.status(200).send(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).send({ message: "Error fetching customer data." });
  }
};

// READ a single customer by ID
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customers.length === 0) {
      return res.status(404).send({ message: "Customer not found." });
    }
    res.status(200).send(customers[0]);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).send({ message: "Error fetching customer data." });
  }
};

// UPDATE a customer
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone_number, address } = req.body;

  if (!full_name || !phone_number || !address) {
    return res.status(400).send({ message: "Full name, phone number, and address are required." });
  }

  try {
    const sql = 'UPDATE customers SET full_name = ?, email = ?, phone_number = ?, address = ? WHERE id = ?';
    const [result] = await pool.query(sql, [full_name, email, phone_number, address, id]);

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Customer not found or no new data to update." });
    }
    res.status(200).send({ message: "Customer updated successfully." });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).send({ message: "Error updating customer." });
  }
};

// DELETE a customer
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Customer not found." });
    }
    res.status(200).send({ message: "Customer deleted successfully." });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).send({ message: "Error deleting customer." });
  }
};