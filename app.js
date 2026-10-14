const API_URL = 'http://localhost:5000/api';

// ==================== ALERT SYSTEM ====================
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.innerHTML = alertHTML;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// ==================== ACCOUNT BUTTON ====================
document.getElementById('accountBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById('authModal'));
    modal.show();
});

// ==================== FORM SWITCHING ====================
document.getElementById('switchToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Registrieren';
});

document.getElementById('switchToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Anmelden';
});

// ==================== REGISTRIERUNG ====================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        showAlert('❌ Passwörter stimmen nicht überein!', 'warning');
        return;
    }
    
    if (password.length < 8) {
        showAlert('❌ Passwort muss mindestens 8 Zeichen lang sein!', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('✅ Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
            document.getElementById('registerForm').reset();
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('authTitle').textContent = 'Anmelden';
        } else {
            showAlert('❌ ' + data.message, 'danger');
        }
    } catch (error) {
        showAlert('❌ Fehler: ' + error.message, 'danger');
    }
});

// ==================== LOGIN ====================
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userName', data.name);
            
            showAlert('✅ Anmeldung erfolgreich!', 'success');
            document.getElementById('loginForm').reset();
            
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            updateAccountButton();
        } else {
            showAlert('❌ ' + data.message, 'danger');
        }
    } catch (error) {
        showAlert('❌ Verbindungsfehler: ' + error.message, 'danger');
    }
});

// ==================== ACCOUNT BUTTON UPDATE ====================
function updateAccountButton() {
    const accountBtn = document.getElementById('accountBtn');
    const userName = localStorage.getItem('userName');
    
    if (userName) {
        accountBtn.innerHTML = `<i class="fas fa-user"></i> ${userName} <small>(Abmelden)</small>`;
        accountBtn.onclick = logout;
    }
}

// ==================== LOGOUT ====================
function logout(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    showAlert('✅ Erfolgreich abgemeldet!', 'info');
    location.reload();
}

// ==================== FILTER ====================
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const category = this.dataset.filter;
        const recipes = document.querySelectorAll('.recipe-item');

        recipes.forEach(recipe => {
            if (category === 'all' || recipe.dataset.category === category) {
                recipe.style.display = 'block';
            } else {
                recipe.style.display = 'none';
            }
        });
    });
});

// ==================== FAVORITEN ====================
function toggleFavorite(event) {
    event.preventDefault();
    const button = event.target.closest('.btn-favorite');
    button.classList.toggle('active');
}

// ==================== CTA BUTTON ====================
document.querySelector('.btn-cta').addEventListener('click', function() {
    document.querySelector('#recipeContainer').scrollIntoView({ behavior: 'smooth' });
});

// ==================== INIT ====================
updateAccountButton();