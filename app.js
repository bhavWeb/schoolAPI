import express from "express";
import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Add School API
app.post("/addSchool", async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validate input data
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
      [name, address, latitude, longitude]
    );
    res.status(201).json({ message: "School added successfully", schoolId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List Schools API
app.get("/listSchools", async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  try {
    const [schools] = await pool.query("SELECT * FROM schools");

    // Calculate distance and sort by proximity
    const sortedSchools = schools
      .map((school) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          school.latitude,
          school.longitude
        );
        return { ...school, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate distance using the Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
