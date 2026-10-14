const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ⭐ MIDDLEWARE
app.use(cors({
    origin: '*', // Erlaubt alle Origins (nur für Development!)
    credentials: true
}));
app.use(express.json());

// Pseudo-Datenbank
const users = [];
const JWT_SECRET = 'your-secret-key-123';

// ⭐ TEST-Route
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Backend läuft!' });
});

// REGISTRIERUNG
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Alle Felder erforderlich' });
        }
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'E-Mail existiert bereits' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword
        };
        users.push(user);
        
        console.log('✅ Neuer Benutzer registriert:', email);
        res.json({ 
            message: 'Registrierung erfolgreich',
            user: { id: user.id, name, email }
        });
    } catch (error) {
        console.error('❌ Registrierungs-Fehler:', error);
        res.status(500).json({ message: 'Fehler: ' + error.message });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔍 Login-Versuch:', email);
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
        }
        
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ message: 'E-Mail oder Passwort falsch' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login erfolgreich:', email);
        res.json({
            message: 'Anmeldung erfolgreich',
            token,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.error('❌ Login-Fehler:', error);
        res.status(500).json({ message: 'Fehler: ' + error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});