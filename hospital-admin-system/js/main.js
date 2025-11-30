/**
 * Main Application JavaScript
 * Handles page routing, modal management, and global event listeners
 * ACCURATE & PRODUCTION-READY
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Check if user is authenticated
    if (rbac.isAuthenticated()) {
        // Redirect to appropriate dashboard based on role
        redirectToDashboard();
    } else {
        // Show home page
        showPage('home-page');
    }

    // Setup event listeners
    setupEventListeners();
    
    // Apply accessibility features
    setupAccessibility();
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal('login-modal'));
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside
    document. querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Registration link in login form
    const registerLink = document. getElementById('register-link');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e. preventDefault();
            closeModal(document.getElementById('login-modal'));
            openModal('registration-modal');
        });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm. addEventListener('submit', handleLogin);
    }

    // Registration form submission
    const userRegisterForm = document.getElementById('user-register');
    if (userRegisterForm) {
        userRegisterForm.addEventListener('submit', handleUserRegistration);
    }

    const hospitalRegisterForm = document.getElementById('hospital-register');
    if (hospitalRegisterForm) {
        hospitalRegisterForm.addEventListener('submit', handleHospitalRegistration);
    }

    // Registration tab buttons
    document.querySelectorAll('. tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    // Sidebar buttons for admin, hospital, and user pages
    setupSidebarNavigation();
}

/**
 * Setup accessibility features
 */
function setupAccessibility() {
    // Add skip to main content link
    const skipLink = document.createElement('a');
    skipLink. href = '#main-content';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document. body.firstChild);

    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (! btn.textContent.trim()) {
            btn.setAttribute('aria-label', 'Button');
        }
    });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value. trim();
    const password = document.getElementById('login-password').value.trim();

    // Validation
    if (!username || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Disable button during submission
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn. textContent = 'Logging in...';

    try {
        const response = await api.login(username, password);
        
        // Set token
        api.setToken(response.token);

        // Set user in RBAC
        rbac.setUser({
            id: response.user. id,
            username: response.user.username,
            role: response.user.role,
            email: response.user.email,
            name: response.user.name,
            hospitalId: response.user.hospitalId || null
        });

        showAlert('Login successful! ', 'success');

        // Close modal and redirect
        closeModal(document. getElementById('login-modal'));
        
        // Small delay for UX
        setTimeout(() => {
            redirectToDashboard();
        }, 500);
    } catch (error) {
        showAlert(error.message || 'Login failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Handle user registration form submission
 */
async function handleUserRegistration(e) {
    e.preventDefault();

    const userData = {
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        phone: document.getElementById('user-phone').value.trim(),
        address: document.getElementById('user-address').value.trim(),
        nid: document.getElementById('user-nid').value.trim()
    };

    // Validate
    if (!userData.name || ! userData.email || !userData.phone || !userData.address || !userData.nid) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Validate email format
    if (!authModule.isValidEmail(userData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Validate phone format
    if (!authModule. isValidPhone(userData.phone)) {
        showAlert('Please enter a valid phone number', 'error');
        return;
    }

    // Validate NID format
    if (!authModule.isValidNID(userData.nid)) {
        showAlert('National ID must be between 10-20 characters', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn. textContent;
    submitBtn. disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        await api.registerUser(userData);
        showAlert('Registration submitted successfully!  Admin will review and send you login credentials.', 'success');
        e.target.reset();
        setTimeout(() => {
            closeModal(document.getElementById('registration-modal'));
        }, 2000);
    } catch (error) {
        showAlert(error.message || 'Registration failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Handle hospital registration form submission
 */
async function handleHospitalRegistration(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('hospital-name').value.trim());
    formData.append('venue', document.getElementById('hospital-venue').value.trim());
    formData.append('email', document.getElementById('hospital-email').value.trim());
    formData.append('phone', document. getElementById('hospital-phone').value. trim());
    formData.append('license', document.getElementById('hospital-license').files[0]);

    // Validate
    if (! formData.get('name') || !formData. get('venue') || !formData.get('email') || 
        !formData.get('phone') || !formData.get('license')) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Validate email
    if (!authModule.isValidEmail(formData.get('email'))) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Validate phone
    if (!authModule.isValidPhone(formData.get('phone'))) {
        showAlert('Please enter a valid phone number', 'error');
        return;
    }

    // Validate file size (max 5MB)
    const file = document.getElementById('hospital-license').files[0];
    if (file. size > 5 * 1024 * 1024) {
        showAlert('File size must not exceed 5MB', 'error');
        return;
    }

    const submitBtn = e. target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        await api.registerHospital(formData);
        showAlert('Hospital registration submitted successfully! Admin will review your license and send you login credentials.', 'success');
        e.target.reset();
        setTimeout(() => {
            closeModal(document. getElementById('registration-modal'));
        }, 2000);
    } catch (error) {
        showAlert(error.message || 'Registration failed', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        rbac.logout();
        api.clearToken();
        showAlert('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

/**
 * Switch registration tabs
 */
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    // Deactivate all tabs and contents
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('. tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });

    // Activate clicked tab
    e.target.classList.add('active');
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList. remove('hidden');
        tabContent. classList.add('active');
    }
}

/**
 * Setup sidebar navigation for dashboards
 */
function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sectionName = e.target.dataset.section;
            const sidebar = e.target.closest('aside');
            const container = sidebar.nextElementSibling;

            if (! sidebar || !container) return;

            // Deactivate all buttons in this sidebar
            sidebar.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
            
            // Activate clicked button
            e.target.classList.add('active');

            // Hide all sections
            container.querySelectorAll('[class$="-section"]').forEach(section => {
                section.classList. remove('active');
                section.classList.add('hidden');
            });

            // Show selected section
            const section = document.getElementById(sectionName);
            if (section) {
                section.classList.add('active');
                section.classList.remove('hidden');
                
                // Load section data if available
                loadSectionData(sectionName);
            }
        });
    });

    // Setup doctor tabs
    document.querySelectorAll('.doctors-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset. doctorTab;
            
            // Deactivate all tabs
            document.querySelectorAll('. doctors-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.doctors-tab-content').forEach(content => {
                content.classList. add('hidden');
                content. classList.remove('active');
            });

            // Activate clicked tab
            e.target.classList. add('active');
            const tabContent = document.getElementById(tabName);
            if (tabContent) {
                tabContent.classList. remove('hidden');
                tabContent.classList.add('active');
                // Load data for this tab
                loadDoctorTabData(tabName);
            }
        });
    });
}

/**
 * Load section data based on current page
 */
function loadSectionData(sectionName) {
    if (rbac.hasRole('admin')) {
        adminLoadSection(sectionName);
    } else if (rbac.hasRole('hospital')) {
        hospitalLoadSection(sectionName);
    } else if (rbac.hasRole('user')) {
        userLoadSection(sectionName);
    }
}

/**
 * Load doctor tab data
 */
function loadDoctorTabData(tabName) {
    if (rbac.hasRole('hospital')) {
        hospitalModule.loadDoctors(tabName);
    }
}

/**
 * Show/hide pages
 */
function showPage(pageId) {
    document.querySelectorAll('.page'). forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

/**
 * Redirect to appropriate dashboard based on user role
 */
function redirectToDashboard() {
    if (rbac.hasRole('admin')) {
        showPage('admin-page');
        adminLoadSection('user-info');
    } else if (rbac.hasRole('hospital')) {
        showPage('hospital-page');
        hospitalLoadSection('doctors');
    } else if (rbac.hasRole('user')) {
        showPage('user-page');
        userLoadSection('user-about');
    }
}

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        // Restore body scroll
        document.body. style.overflow = 'auto';
    }
}

/**
 * Show alert/notification
 */
function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.alert-notification').forEach(alert => alert.remove());

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert-notification alert-${type}`;
    alert.setAttribute('role', 'alert');
    alert.textContent = message;
    
    const backgroundColor = type === 'success' ? '#27ae60' : 
                           type === 'error' ? '#e74c3c' : 
                           type === 'warning' ? '#f39c12' : '#3498db';

    alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${backgroundColor};
        color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;

    document.body.appendChild(alert);

    // Remove after 4 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// CSS for animations
if (! document.getElementById('alert-animations')) {
    const style = document.createElement('style');
    style.id = 'alert-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        . skip-to-main {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: white;
            padding: 8px;
            z-index: 100;
        }

        .skip-to-main:focus {
            top: 0;
        }
    `;
    document.head.appendChild(style);
}