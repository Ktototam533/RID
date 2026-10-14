const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Pseudo-Datenbank (in Realität: MongoDB, PostgreSQL, etc.)
const users = [];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// REGISTRIERUNG
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validierung
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Alle Felder erforderlich' });
        }
        
        // E-Mail bereits vorhanden?
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'E-Mail existiert bereits' });
        }
        
        // ⭐ PASSWORT HASHEN (wichtig!)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Benutzer speichern
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword // ← GEHASHED! Nicht lesbar!
        };
        users.push(user);
        
        res.json({ message: 'Registrierung erfolgreich', user: { id: user.id, name, email } });
    } catch (error) {
        res.status(500).json({ message: 'Fehler: ' + error.message });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Benutzer finden
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
        }
        
        // ⭐ PASSWORT VERGLEICHEN (gehashed)
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
        }
        
        // ⭐ TOKEN ERSTELLEN
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Anmeldung erfolgreich',
            token,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Fehler: ' + error.message });
    }
});

// Geschützte Route (Beispiel)
app.get('/api/profile', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token erforderlich' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        
        res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(401).json({ message: 'Ungültiger Token' });
    }
});

app.listen(5000, () => {
    console.log('✅ Server läuft auf http://localhost:5000');
});