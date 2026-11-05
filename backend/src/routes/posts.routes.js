const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');
const path = require('path');
const { sendEmail } = require('../email');


function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { text, animal_type, latitude, longitude } = req.body;
    if (!animal_type || !latitude || !longitude || !req.file) {
      return res.status(400).json({ error: 'Minden mező kötelező (szöveg kivételével).' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const conn = await pool.getConnection();

    try {
      await conn.execute(
        `INSERT INTO posts (user_id, text, animal_type, image_url, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.sub, text || null, animal_type, imageUrl, latitude, longitude]
      );

      const [notifyUsers] = await conn.execute(`
        SELECT email, display_name, latitude, longitude, distance_km
        FROM users
        WHERE notify = 1
          AND animal_type = ?
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND distance_km > 0
      `, [animal_type]);

      const nearbyUsers = notifyUsers.filter(u => {
        const dist = getDistanceKm(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(u.latitude),
          parseFloat(u.longitude)
        );
        return dist <= u.distance_km;
      });

      for (const u of nearbyUsers) {
        const fullImageUrl = `${process.env.API_URL || 'http://localhost:4000'}${imageUrl}`;
        const html = `
          <div style="font-family:Arial,sans-serif; line-height:1.6;">
            <h2>Lehetséges, hogy megtalálták az eltűnt háziállatod!</h2>
            <p>Kedves ${u.display_name || 'Felhasználó'},</p>
            <p>Új bejegyzés jelent meg a közeledben, ami egyezik az általad megadott állat fajtájával (<b>${animal_type}</b>).</p>
            ${text ? `<p><strong>Leírás:</strong> ${text}</p>` : ''}
            <p><strong>Kép:</strong><br>
              <a href="${fullImageUrl}" target="_blank">
                <img src="${fullImageUrl}" alt="Állat képe" style="max-width:320px;border-radius:10px;margin-top:6px;" />
              </a>
            </p>
            <p>További részleteket megtekinthetsz az oldalon:<br>
              <a href="${process.env.CLIENT_URL}" style="color:#1a73e8;text-decoration:none;">
                ${process.env.CLIENT_URL}
              </a>
            </p>
            <p style="color:#888;font-size:12px;">Ez az üzenet automatikusan generálódott az EHÁK rendszerben.</p>
          </div>
        `;
      
        await sendEmail(
          u.email,
          `EHÁK – Új ${animal_type} bejegyzés a közeledben`,
          html
        );
      }


      res.status(201).json({
        message: 'Poszt sikeresen létrehozva!',
        notified: nearbyUsers.length
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('POSTS_CREATE_ERR', err);
    res.status(500).json({ error: 'Szerver hiba poszt létrehozásakor' });
  }
});

router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const [rows] = await conn.query(
        `SELECT p.id, p.text, p.animal_type, p.image_url, p.latitude, p.longitude, p.created_at,
                u.id AS user_id, u.display_name, u.email, u.profile_image
         FROM posts p
         JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
         [limit, offset]
      );
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('GET_POSTS_ERR', err);
    res.status(500).json({ error: 'Szerver hiba a posztok lekérésekor' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      let sql, params;

      if (req.user.isAdmin) {
        sql = `DELETE FROM posts WHERE id = ?`;
        params = [req.params.id];
      } else {
        sql = `DELETE FROM posts WHERE id = ? AND user_id = ?`;
        params = [req.params.id, req.user.sub];
      }

      const [result] = await conn.execute(sql, params);
      if (result.affectedRows === 0) {
        return res.status(403).json({ error: 'Nincs jogosultság a törléshez' });
      }

      res.json({ message: 'Poszt sikeresen törölve' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('DELETE_POST_ERR', err);
    res.status(500).json({ error: 'Szerver hiba poszt törlésekor' });
  }
});

router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;
