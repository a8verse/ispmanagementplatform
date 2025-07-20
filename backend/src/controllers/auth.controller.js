const pool = require('../config/db.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  const { role_id, username, password, email, full_name } = req.body;

  if (!role_id || !username || !password || !email) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (role_id, username, password_hash, email, full_name) VALUES (?, ?, ?, ?, ?)';
    await pool.query(sql, [role_id, username, hashedPassword, email, full_name]);
    res.status(201).send({ message: "User registered successfully!" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).send({ message: "Username or email already exists." });
    }
    console.error("Registration error:", error);
    res.status(500).send({ message: "Error registering user." });
  }
};

// Log in an existing user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Username and password are required." });
  }

  try {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [users] = await pool.query(sql, [username]);

    if (users.length === 0) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    const user = users[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).send({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).send({
      message: "Login successful!",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send({ message: "Internal server error." });
  }
};