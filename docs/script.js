// Aguarda o carregamento completo do HTML antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const formTitle = document.getElementById('form-title');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const authError = document.getElementById('auth-error');
    const registerError = document.getElementById('register-error');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const dataForm = document.getElementById('data-form');
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const bmiValue = document.getElementById('bmi-value');
    const bmiCategory = document.getElementById('bmi-category');
    const historyTableBody = document.getElementById('history-table-body');

    // NOVO: Elementos para as novas funcionalidades
    const goalWeightInput = document.getElementById('goal-weight');
    const goalMessage = document.getElementById('goal-message');
    const notesInput = document.getElementById('notes');
    const chartCanvas = document.getElementById('weight-chart');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- ESTADO DA APLICAÇÃO ---
    let currentUser = null;
    let users = {};
    let weightChartInstance = null; // NOVO: Para guardar a instância do gráfico

    // --- FUNÇÕES DE DADOS (localStorage) ---
    function loadUsersFromLocalStorage() {
        const storedUsers = localStorage.getItem('bmiTrackerUsers');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    }

    function saveUsersToLocalStorage() {
        localStorage.setItem('bmiTrackerUsers', JSON.stringify(users));
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E VISUALIZAÇÃO ---
    function updateView() {
        if (currentUser) {
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            welcomeMessage.textContent = `Bem-vindo(a), ${currentUser}!`;
            renderDashboard();
        } else {
            authContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    }

    function renderDashboard() {
        // A altura geralmente não muda, então preenchemos com o último valor registrado
        const userData = users[currentUser]?.data || [];
        if (userData.length > 0) {
            heightInput.value = userData[userData.length - 1].height;
        }
        
        renderHistoryTable();
        updateCurrentStatus();
        renderGoal(); // NOVO
        renderChart(); // NOVO
    }

    function renderHistoryTable() {
        historyTableBody.innerHTML = '';
        const userData = users[currentUser]?.data || [];
        for (let i = userData.length - 1; i >= 0; i--) {
            const record = userData[i];
            const row = document.createElement('tr');
            // NOVO: Adiciona a coluna de notas
            row.innerHTML = `
                <td>${new Date(record.date).toLocaleDateString('pt-BR')}</td>
                <td>${record.weight}</td>
                <td>${record.height}</td>
                <td>${record.bmi.toFixed(2)}</td>
                <td>${record.notes || ''}</td>
            `;
            historyTableBody.appendChild(row);
        }
    }

    function updateCurrentStatus() {
        const userData = users[currentUser]?.data || [];
        if (userData.length > 0) {
            const lastRecord = userData[userData.length - 1];
            const bmi = lastRecord.bmi;
            bmiValue.textContent = bmi.toFixed(2);
            const { category, categoryClass } = getBmiCategory(bmi);
            bmiCategory.textContent = category;
            bmiValue.className = '';
            bmiCategory.className = '';
            bmiValue.classList.add(categoryClass);
            bmiCategory.classList.add(categoryClass);
        } else {
            bmiValue.textContent = '-';
            bmiCategory.textContent = 'Nenhum registro ainda';
            bmiValue.className = '';
            bmiCategory.className = '';
        }
    }
    
    // NOVO: Função para renderizar a meta de peso
    function renderGoal() {
        const user = users[currentUser];
        goalWeightInput.value = user.goal || '';
        goalMessage.textContent = '';
        goalMessage.className = 'goal-message';

        const lastWeight = user.data.length > 0 ? user.data[user.data.length - 1].weight : null;

        if (user.goal && lastWeight) {
            const diff = (lastWeight - user.goal).toFixed(1);
            if (diff <= 0) {
                goalMessage.textContent = 'Parabéns, você alcançou sua meta!';
                goalMessage.classList.add('goal-success');
            } else {
                goalMessage.textContent = `Faltam ${diff} kg para sua meta!`;
                goalMessage.classList.add('goal-progress');
            }
        }
    }

    // NOVO: Função para renderizar o gráfico
    function renderChart() {
        if (weightChartInstance) {
            weightChartInstance.destroy(); // Destrói o gráfico antigo para criar um novo
        }
        const userData = users[currentUser]?.data || [];
        const labels = userData.map(r => new Date(r.date).toLocaleDateString('pt-BR'));
        const weightData = userData.map(r => r.weight);

        weightChartInstance = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Peso (kg)',
                    data: weightData,
                    borderColor: 'rgba(74, 144, 226, 1)',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                // CORREÇÃO DO BUG: A opção 'maintainAspectRatio: false' foi removida.
                // Em um layout flexível/grid, ela pode causar um loop de redimensionamento infinito.
                // Com o padrão (true), a altura do gráfico é calculada a partir da largura, evitando o bug.
                scales: { y: { beginAtZero: false } }
            }
        });
    }

    // --- FUNÇÕES DE CÁLCULO E LÓGICA ---
    function calculateBMI(weight, height) {
        if (height === 0) return 0;
        return weight / (height * height);
    }

    function getBmiCategory(bmi) {
        if (bmi < 18.5) return { category: 'Abaixo do peso', categoryClass: 'bmi-underweight' };
        if (bmi < 24.9) return { category: 'Peso normal', categoryClass: 'bmi-normal' };
        if (bmi < 29.9) return { category: 'Sobrepeso', categoryClass: 'bmi-overweight' };
        return { category: 'Obesidade', categoryClass: 'bmi-obese' };
    }

    // --- EVENT LISTENERS ---
    showRegisterLink.addEventListener('click', (e) => { 
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        showRegisterLink.parentElement.classList.add('hidden');
        showLoginLink.parentElement.classList.remove('hidden');
        formTitle.textContent = 'Registrar';
        authError.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => { 
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        showLoginLink.parentElement.classList.add('hidden');
        showRegisterLink.parentElement.classList.remove('hidden');
        formTitle.textContent = 'Login';
        registerError.textContent = '';
    });
    
    // Lógica de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value;
        if (users[username] && users[username].password === password) {
            currentUser = username;
            updateView();
        } else {
            authError.textContent = 'Usuário ou senha inválidos.';
        }
    });

    // Lógica de Registro
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value;
        if (users[username]) {
            registerError.textContent = 'Este nome de usuário já existe.';
        } else if (username.length < 3 || password.length < 4) {
            registerError.textContent = 'Usuário 3+ e senha 4+ caracteres.';
        } else {
            // NOVO: Adiciona o campo 'goal' ao criar usuário
            users[username] = { password: password, data: [], goal: null };
            saveUsersToLocalStorage();
            alert('Usuário registrado com sucesso! Faça o login.');
            registerForm.reset();
            showLoginLink.click();
        }
    });

    logoutButton.addEventListener('click', () => {
        currentUser = null;
        loginForm.reset();
        updateView();
    });

    // Lógica para salvar novos dados
    dataForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);
        const notes = notesInput.value.trim(); // NOVO

        if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
            alert('Por favor, insira valores válidos para peso e altura.');
            return;
        }

        const newRecord = {
            date: new Date().toISOString(),
            weight: weight,
            height: height,
            bmi: calculateBMI(weight, height),
            notes: notes // NOVO
        };

        users[currentUser].data.push(newRecord);
        saveUsersToLocalStorage();
        renderDashboard();
        // Limpa apenas os campos de peso e notas após o envio
        weightInput.value = '';
        notesInput.value = '';
    });

    // NOVO: Listener para salvar a meta de peso
    goalWeightInput.addEventListener('change', () => {
        const goal = parseFloat(goalWeightInput.value);
        if (!isNaN(goal) && goal > 0) {
            users[currentUser].goal = goal;
        } else {
            users[currentUser].goal = null;
        }
        saveUsersToLocalStorage();
        renderGoal();
    });

    // NOVO: Listeners para o modal de confirmação
    clearHistoryBtn.addEventListener('click', () => {
        confirmModal.classList.remove('hidden');
    });

    modalCancelBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });

    modalConfirmBtn.addEventListener('click', () => {
        users[currentUser].data = [];
        saveUsersToLocalStorage();
        renderDashboard();
        confirmModal.classList.add('hidden');
    });

    // --- INICIALIZAÇÃO ---
    loadUsersFromLocalStorage();
    updateView();
});
