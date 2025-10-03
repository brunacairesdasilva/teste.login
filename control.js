// Sistema de Controle de Acesso - Farmasic

// Verificar autenticação em todas as páginas
function checkAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    const currentPage = window.location.pathname.split('/').pop();

    // Páginas que não precisam de autenticação
    const publicPages = ['index.html', 'login.html', 'cadastro.html'];

    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return null;
    }

    return currentUser;
}

// Configurar controle de acesso baseado no tipo de usuário
function setupAccessControl() {
    const currentUser = checkAuth();

    if (!currentUser) return;

    // Atualizar header com informações do usuário
    updateHeader(currentUser);

    // Aplicar restrições de acesso para funcionários
    if (currentUser.type === 'funcionario') {
        restrictFuncionarioAccess();
    }
}

// Atualizar header com informações do usuário
function updateHeader(user) {
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return;

    // Verificar se já existe informação do usuário
    const existingUserInfo = document.querySelector('.user-info');
    if (existingUserInfo) return;

    // Criar elemento de informação do usuário
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: auto;
        color: #fff;
    `;

    userInfo.innerHTML = `
        <span style="font-size: 0.9rem;">
            Olá, <strong>${user.name}</strong> 
            <span style="opacity: 0.7;">(${user.type === 'chefe' ? 'Chefe' : 'Funcionário'})</span>
        </span>
        <button onclick="logout()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s;
        " onmouseover="this.style.background='#c82333'" 
           onmouseout="this.style.background='#dc3545'">
            Sair
        </button>
    `;

    navLinks.appendChild(userInfo);
}

// Restringir acesso de funcionários
function restrictFuncionarioAccess() {
    const currentPage = window.location.pathname.split('/').pop();

    // Se funcionário tentar acessar página de funcionários, redirecionar
    if (currentPage === 'funcionario.html') {
        alert('Acesso negado! Apenas o chefe pode acessar o cadastro de funcionários.');
        window.location.href = 'index.html';
        return;
    }

    // Bloquear card de funcionários na página inicial
    const funcionarioCard = document.querySelector('a[href="funcionario.html"]');

    if (funcionarioCard) {
        // Desabilitar o card visualmente
        funcionarioCard.style.opacity = '0.5';
        funcionarioCard.style.pointerEvents = 'none';
        funcionarioCard.style.position = 'relative';
        funcionarioCard.style.cursor = 'not-allowed';

        // Adicionar overlay de bloqueio
        const lockOverlay = document.createElement('div');
        lockOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            z-index: 10;
        `;

        lockOverlay.innerHTML = `
            <div style="
                background: #dc3545;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 0.85rem;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ">
                🔒 ACESSO RESTRITO<br>
                <span style="font-size: 0.75rem; font-weight: normal;">Somente Chefe</span>
            </div>
        `;

        funcionarioCard.appendChild(lockOverlay);

        // Prevenir clique
        funcionarioCard.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Acesso restrito! Apenas o chefe pode acessar o cadastro de funcionários.');
            return false;
        });
    }
}

// Função de logout
function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('rememberedUser');
        window.location.href = 'index.html';
    }
}

// Verificar se há usuário lembrado no login
function checkRememberedUser() {
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser') || 'null');

    if (rememberedUser && window.location.pathname.includes('index.html')) {
        const usernameInput = document.getElementById('username');
        const rememberCheckbox = document.getElementById('remember');

        if (usernameInput && rememberCheckbox) {
            usernameInput.value = rememberedUser.username;
            rememberCheckbox.checked = true;
        }
    }
}

// Inicializar controle de acesso quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setupAccessControl();
    checkRememberedUser();
});

// Exportar funções para uso global
window.checkAuth = checkAuth;
window.setupAccessControl = setupAccessControl;
window.logout = logout;