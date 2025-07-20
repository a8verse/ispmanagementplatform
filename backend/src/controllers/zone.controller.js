const pool = require('../config/db.config');

// All CRUD operations for Zones
exports.createZone = async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).send({ message: "Zone name is required." });
    try {
        const [result] = await pool.query('INSERT INTO zones (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).send({ message: "Zone created successfully!", zoneId: result.insertId });
    } catch (error) {
        res.status(500).send({ message: "Error creating zone.", error: error.message });
    }
};

exports.getAllZones = async (req, res) => {
    try {
        const [zones] = await pool.query('SELECT * FROM zones ORDER BY name');
        res.status(200).send(zones);
    } catch (error) {
        res.status(500).send({ message: "Error fetching zones.", error: error.message });
    }
};
// Implement updateZone and deleteZone similarly if needed