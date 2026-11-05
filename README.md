# PetFinder – Futtatási útmutató

Ez a projekt egy **Node.js backendből**, egy **React frontendből** és egy **MySQL adatbázisból** épül fel.  
Az alábbi lépések segítségével egy teljesen friss rendszerre is gond nélkül telepíthető.

---

# 1. Node.js telepítése

### Node.js telepítése

Töltsd le és telepítsd a Node.js-t:  
https://nodejs.org/

Ellenőrzés:

    node -v
    npm -v

---

# 2. Backend telepítése

Lépj a backend mappába:

    cd backend

### Függőségek telepítése

    npm install

### `.env` fájl létrehozása

Hozz létre egy `.env` fájlt a backend mappában a következő tartalommal:

    PORT=4000
    CLIENT_URL=http://localhost:5173

    MYSQL_HOST=localhost
    MYSQL_PORT=3306
    MYSQL_USER=root
    MYSQL_PASSWORD=mysql jelszavad
    MYSQL_DATABASE=petfinder

    JWT_SECRET=valami_titkos_jelszo
    JWT_EXPIRES_IN=7d

    EMAIL_FROM="PetFinder <sajátemail@gmail.com>"
    GMAIL_USER=sajátemail@gmail.com
    GMAIL_APP_PASSWORD=gmail alkalmazásjelszavad

### Uploads mappa létrehozása

    mkdir uploads

### Backend indítása

    npm run dev

---

# 3. Frontend telepítése

Lépj a frontend mappába:

    cd frontend

### Függőségek telepítése

    npm install

### `.env` fájl létrehozása

    VITE_API_BASE_URL=http://localhost:4000/api

### Frontend indítása

    npm run dev

---

# 4. MySQL adatbázis

Adatbázis létrehozása:

    CREATE DATABASE petfinder;

### Users tábla

    CREATE TABLE users (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        is_verified TINYINT(1) DEFAULT 0,
        verification_token VARCHAR(255),
        verification_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        reset_token VARCHAR(255),
        reset_expires DATETIME,
        profile_image VARCHAR(255),
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        distance_km INT DEFAULT 0,
        animal_type VARCHAR(50),
        notify TINYINT(1) DEFAULT 0,
        is_admin TINYINT(1) DEFAULT 0
    );

### Posts tábla

    CREATE TABLE posts (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        text TEXT,
        animal_type VARCHAR(50),
        image_url VARCHAR(255),
        latitude DECIMAL(9,6),
        longitude DECIMAL(9,6),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

---

# 5. Indítás sorrendje

1. Indítsd a MySQL szervert
2. Indítsd el a backend-et → `npm run dev`
3. Indítsd el a frontend-et → `npm run dev`
