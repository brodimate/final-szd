const express = require('express');
const { pool } = require('../db');
const router = express.Router();


router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [users] = await conn.execute(
        `SELECT id, email, display_name, profile_image 
         FROM users WHERE id = ?`,
        [id]
      );
      if (users.length === 0) return res.status(404).json({ error: 'Felhasználó nem található' });

      const user = users[0];

      const [posts] = await conn.execute(
        `SELECT id, text, animal_type, image_url, latitude, longitude, created_at 
         FROM posts WHERE user_id = ? ORDER BY created_at DESC`,
        [id]
      );

      res.json({ user, posts });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("USER_PROFILE_ERR", err);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

module.exports = router;
