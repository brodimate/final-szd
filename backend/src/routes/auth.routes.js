require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { registerSchema, loginSchema, resetPasswordSchema } = require('../validators/auth.schema');
const { sendEmail, sendVerificationEmail } = require('../email');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth.middleware');
const crypto = require('crypto');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.display_name,
      isVerified: user.is_verified === 1,
      isAdmin: user.is_admin === 1,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Hibás adatok',
        details: parse.error.flatten()
      });
    }

    const { email, password, displayName } = parse.data;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, is_verified FROM users WHERE email = ?',
        [email]
      );
      if (rows.length > 0) {
        return res.status(409).json({ error: 'Ez az email már regisztrálva van.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const token = uuidv4();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await conn.execute(
        `INSERT INTO users (email, password_hash, display_name, is_verified, verification_token, verification_expires)
         VALUES (?, ?, ?, 0, ?, ?)`,
        [email, passwordHash, displayName || null, token, expires]
      );

      await sendVerificationEmail(email, token);

      return res.status(201).json({
        message: 'Sikeres regisztráció! Kérlek, erősítsd meg az emailed.'
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('REGISTER_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});


router.get('/verify', async (req, res) => {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Hiányzó vagy hibás token' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, is_verified, verification_expires
         FROM users
         WHERE verification_token = ?`,
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: 'Érvénytelen token' });
      }

      const user = rows[0];

      if (user.is_verified === 1) {
        return res.status(400).json({ error: 'Ez a fiók már megerősítve van.' });
      }

      const now = new Date();
      if (user.verification_expires && now > user.verification_expires) {
        return res.status(400).json({ error: 'A token lejárt. Kérj új megerősítő emailt.' });
      }

      await conn.execute(
        `UPDATE users 
         SET is_verified = 1, verification_token = NULL, verification_expires = NULL 
         WHERE id = ?`,
        [user.id]
      );

      return res.json({ message: 'Sikeres megerősítés! Most átirányítunk a bejelentkezéshez.' });

    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('VERIFY_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});



router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Hibás adatok', details: parse.error.flatten() });
    }

    const { email, password } = parse.data;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, email, password_hash, display_name, profile_image, is_verified, is_admin
         FROM users WHERE email = ?`,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Hibás email vagy jelszó' });
      }

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Hibás email vagy jelszó' });

      if (user.is_verified !== 1)
        return res.status(403).json({ error: 'Kérlek, erősítsd meg az emailed.' });

      const token = signToken(user);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          profile_image: user.profile_image || null,
          isVerified: user.is_verified === 1,
          isAdmin: user.is_admin === 1,
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('LOGIN_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});

router.post('/resend', async (req, res) => {
  const email = req.body?.email;
  if (!email) return res.status(400).json({ error: 'Email kötelező' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute('SELECT id, is_verified FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Nincs ilyen felhasználó' });
      }
      const user = rows[0];
      if (user.is_verified === 1) {
        return res.status(400).json({ error: 'Már megerősített fiók' });
      }

      const token = uuidv4();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await conn.execute(
        `UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?`,
        [token, expires, user.id]
      );

      await sendVerificationEmail(email, token);

      return res.json({ message: 'Új megerősítő email elküldve.' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('RESEND_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email megadása kötelező' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(`SELECT id FROM users WHERE email = ?`, [email]);
      if (rows.length === 0) {
        return res.status(200).json({ message: 'Ha létezik ilyen email, küldtünk levelet.' });
      }

      const user = rows[0];

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 1000 * 60 * 30);

      await conn.execute(
        `UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?`,
        [resetToken, resetExpires, user.id]
      );

      const resetUrl = `${process.env.CLIENT_URL}/reset?token=${resetToken}`;
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2>PetFinder – Jelszó visszaállítás</h2>
          <p>Kattints az alábbi gombra az új jelszó beállításához:</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#e53e3e;color:#fff;text-decoration:none;border-radius:6px">Jelszó visszaállítása</a></p>
          <p>Vagy másold be ezt a linket a böngésződbe:<br />${resetUrl}</p>
          <p>Ha nem te kérted, hagyd figyelmen kívül ezt az üzenetet.</p>
        </div>
      `;

      await sendEmail(email, 'PetFinder – Jelszó visszaállítás', html);

      return res.json({ message: 'Ha létezik ilyen email, küldtünk levelet.' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('FORGOT_PASSWORD_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Hibás adatok',
        details: parse.error.flatten()
      });
    }

    const { token, password } = parse.data;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, reset_expires FROM users WHERE reset_token = ?`,
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({ error: 'Érvénytelen token' });
      }

      const user = rows[0];

      if (new Date() > user.reset_expires) {
        return res.status(400).json({ error: 'A token lejárt' });
      }

      const hash = await bcrypt.hash(password, 10);

      await conn.execute(
        `UPDATE users 
         SET password_hash = ?, reset_token = NULL, reset_expires = NULL 
         WHERE id = ?`,
        [hash, user.id]
      );

      return res.json({ message: 'Sikeres jelszó visszaállítás' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('RESET_PASSWORD_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});


router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email kötelező' });

  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(`SELECT id, is_verified FROM users WHERE email = ?`, [email]);
      if (rows.length === 0) {
        return res.status(200).json({ message: 'Ha létezik ilyen email, küldtünk levelet.' });
      }

      const user = rows[0];
      if (user.is_verified) {
        return res.status(400).json({ error: 'Ez a fiók már megerősítve van.' });
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 1000 * 60 * 60);

      await conn.execute(
        `UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?`,
        [verificationToken, verificationExpires, user.id]
      );

      const verifyUrl = `${process.env.CLIENT_URL}/verify?token=${verificationToken}`;
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2>PetFinder – Email újra megerősítése</h2>
          <p>Kattints az alábbi gombra az email címed megerősítéséhez:</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Email megerősítése</a></p>
          <p>Vagy másold be ezt a linket a böngésződbe:<br />${verifyUrl}</p>
        </div>
      `;

      await sendEmail(email, 'PetFinder – Email újra megerősítése', html);

      return res.json({ message: 'Ha létezik ilyen email, küldtünk levelet.' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('RESEND_VERIFY_ERR', err);
    return res.status(500).json({ error: 'Szerver hiba' });
  }
});

router.post('/settings', requireAuth, upload.single('profileImage'), async (req, res) => {
  try {
    const { displayName, latitude, longitude, distance, animalType, notify } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const conn = await pool.getConnection();
    try {
      const sql = `
        UPDATE users
        SET 
          display_name = ?,
          latitude = ?,
          longitude = ?,
          distance_km = ?,
          animal_type = ?,
          notify = ?,
          profile_image = COALESCE(?, profile_image)
        WHERE id = ?
      `;
      await conn.execute(sql, [
        displayName,
        latitude || null,
        longitude || null,
        distance || 0,
        animalType || null,
        notify === 'true' || notify === true ? 1 : 0,
        profileImage,
        req.user.sub
      ]);

      const [rows] = await conn.execute(
        `SELECT id, email, display_name, profile_image, is_admin, is_verified 
         FROM users WHERE id = ?`,
        [req.user.sub]
      );

      const updatedUser = rows[0];

      if (!updatedUser) {
        return res.status(404).json({ error: "Felhasználó nem található" });
      }

      res.json({
        message: "Beállítások frissítve",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.display_name,
          profile_image: updatedUser.profile_image,
          isAdmin: updatedUser.is_admin === 1,
          isVerified: updatedUser.is_verified === 1,
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("SETTINGS_SAVE_ERR", err);
    res.status(500).json({ error: "Szerver hiba a beállítások mentésekor" });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        `SELECT id, email, display_name, profile_image, latitude, longitude, distance_km, animal_type, notify, is_verified 
         FROM users WHERE id = ?`,
        [req.user.sub]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Nincs ilyen felhasználó' });

      res.json({ user: rows[0] });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('ME_ERR', err);
    res.status(500).json({ error: 'Szerver hiba' });
  }
});

module.exports = router;
