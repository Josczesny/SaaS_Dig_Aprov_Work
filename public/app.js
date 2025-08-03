// Configurações da API
const API_BASE_URL = 'http://localhost:3000/api';

// Estado global
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentExportType = null; // Variável para armazenar o tipo de exportação atual


// Variáveis de paginação para logs de auditoria
let auditPagination = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0
};

// Variáveis de paginação para tabela principal
let mainPagination = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0
};
let currentApprovals = [];
let currentAuditLogs = [];
let currentSort = { field: null, direction: 'asc' };
let searchTerm = '';
let auditSearchTerm = '';

// Elementos do DOM
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners principais
    setupEventListeners();
    
    // Carregar dados iniciais se estiver logado
    if (authToken) {
        loadUserInfo().then(() => {
            if (currentUser && currentUser.email) {
                showDashboard();
                loadApprovals();
            } else {
                logout();
            }
        }).catch(error => {
            console.error('Erro ao carregar dados do usuário:', error);
            logout();
        });
    } else {
        showLogin();
    }
});

// Configurar event listeners
function setupEventListeners() {
    const elements = {
        loginForm: document.getElementById('loginForm'),
        logoutBtn: document.getElementById('logoutBtn'),
        createApprovalBtn: document.getElementById('createApprovalBtn'),
        refreshDataBtn: document.getElementById('refreshDataBtn'),
        auditBtn: document.getElementById('auditBtn'),
        searchApprovals: document.getElementById('searchApprovals'),
        clearSearch: document.getElementById('clearSearch'),
        searchAuditLogs: document.getElementById('searchAuditLogs'),
        clearAuditSearch: document.getElementById('clearAuditSearch'),
        createApprovalSubmitBtn: document.getElementById('createApprovalSubmitBtn'),
        approveBtn: document.getElementById('approveBtn'),
        rejectBtn: document.getElementById('rejectBtn'),
        submitResponseBtn: document.getElementById('submitResponseBtn'),
        approvalType: document.getElementById('approvalType'),
        // Novos botões de fechar modais
        closeCreateModal: document.getElementById('closeCreateModal'),
        cancelCreateModal: document.getElementById('cancelCreateModal'),
        closeResponseModal: document.getElementById('closeResponseModal'),
        cancelResponseModal: document.getElementById('cancelResponseModal'),
        closeAuditModal: document.getElementById('closeAuditModal'),
        closeAuditModalBtn: document.getElementById('closeAuditModalBtn'),
        // Novos modais
        closeRestoreModal: document.getElementById('closeRestoreModal'),
        cancelRestoreModal: document.getElementById('cancelRestoreModal'),
        confirmRestoreModal: document.getElementById('confirmRestoreModal'),
        closeAlterationModal: document.getElementById('closeAlterationModal'),
        cancelAlterationModal: document.getElementById('cancelAlterationModal'),
        confirmAlterationModal: document.getElementById('confirmAlterationModal'),
        alterApproveBtn: document.getElementById('alterApproveBtn'),
        alterRejectBtn: document.getElementById('alterRejectBtn'),
        // Novos modais
        closeDeleteModal: document.getElementById('closeDeleteModal'),
        cancelDeleteModal: document.getElementById('cancelDeleteModal'),
        confirmDeleteModal: document.getElementById('confirmDeleteModal'),
        closeDetailsModal: document.getElementById('closeDetailsModal'),
        closeDetailsModalBtn: document.getElementById('closeDetailsModalBtn')
    };
    
    // Event listeners para novos modais
    if (elements.closeDeleteModal) {
        elements.closeDeleteModal.addEventListener('click', hideDeleteConfirmationModal);
    }
    
    if (elements.cancelDeleteModal) {
        elements.cancelDeleteModal.addEventListener('click', hideDeleteConfirmationModal);
    }
    
    if (elements.confirmDeleteModal) {
        elements.confirmDeleteModal.addEventListener('click', confirmDeleteApproval);
    }
    
    if (elements.closeDetailsModal) {
        elements.closeDetailsModal.addEventListener('click', hideApprovalDetailsModal);
    }
    
        if (elements.closeDetailsModalBtn) {
        elements.closeDetailsModalBtn.addEventListener('click', hideApprovalDetailsModal);
    }
    
    // Event listeners principais
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    if (elements.createApprovalBtn) {
        elements.createApprovalBtn.addEventListener('click', showCreateApprovalModal);
    }
    
    if (elements.refreshDataBtn) {
        elements.refreshDataBtn.addEventListener('click', loadApprovals);
    }
    
    if (elements.auditBtn) {
        elements.auditBtn.addEventListener('click', showAuditLogs);
    }
    
    // Event listeners para busca
    if (elements.searchApprovals) {
        elements.searchApprovals.addEventListener('input', function() {
            searchTerm = this.value;
            updateApprovalsDisplay();
        });
    }
    
    if (elements.clearSearch) {
        elements.clearSearch.addEventListener('click', function() {
            searchTerm = '';
            if (elements.searchApprovals) elements.searchApprovals.value = '';
            updateApprovalsDisplay();
        });
    }
    
    if (elements.searchAuditLogs) {
        elements.searchAuditLogs.addEventListener('input', function() {
            auditSearchTerm = this.value;
            updateAuditLogsDisplay();
        });
    }
    
    if (elements.clearAuditSearch) {
        elements.clearAuditSearch.addEventListener('click', function() {
            auditSearchTerm = '';
            if (elements.searchAuditLogs) elements.searchAuditLogs.value = '';
            updateAuditLogsDisplay();
        });
    }
    
    // Event listeners para modais
    if (elements.createApprovalSubmitBtn) {
        elements.createApprovalSubmitBtn.addEventListener('click', createApproval);
    }
    
    if (elements.approveBtn) {
        elements.approveBtn.addEventListener('click', () => setResponseAction('approved'));
    }
    
    if (elements.rejectBtn) {
        elements.rejectBtn.addEventListener('click', () => setResponseAction('rejected'));
    }
    
    if (elements.submitResponseBtn) {
        elements.submitResponseBtn.addEventListener('click', submitResponse);
    }
    
    if (elements.approvalType) {
        elements.approvalType.addEventListener('change', handleApprovalTypeChange);
    }
    
    // Event listeners para fechar modais
    if (elements.closeCreateModal) {
        elements.closeCreateModal.addEventListener('click', hideCreateApprovalModal);
    }
    
    if (elements.cancelCreateModal) {
        elements.cancelCreateModal.addEventListener('click', hideCreateApprovalModal);
    }
    
    if (elements.closeResponseModal) {
        elements.closeResponseModal.addEventListener('click', hideResponseModal);
    }
    
    if (elements.cancelResponseModal) {
        elements.cancelResponseModal.addEventListener('click', hideResponseModal);
    }
    
    if (elements.closeAuditModal) {
        elements.closeAuditModal.addEventListener('click', hideAuditLogsModal);
    }
    
    if (elements.closeAuditModalBtn) {
        elements.closeAuditModalBtn.addEventListener('click', hideAuditLogsModal);
    }
    
    // Event listeners para novos modais
    if (elements.closeRestoreModal) {
        elements.closeRestoreModal.addEventListener('click', hideRestoreConfirmationModal);
    }
    
    if (elements.cancelRestoreModal) {
        elements.cancelRestoreModal.addEventListener('click', hideRestoreConfirmationModal);
    }
    
    if (elements.confirmRestoreModal) {
        elements.confirmRestoreModal.addEventListener('click', confirmRestoreApproval);
    }
    
    if (elements.closeAlterationModal) {
        elements.closeAlterationModal.addEventListener('click', hideAlterationModal);
    }
    
    if (elements.cancelAlterationModal) {
        elements.cancelAlterationModal.addEventListener('click', hideAlterationModal);
    }
    
    if (elements.confirmAlterationModal) {
        elements.confirmAlterationModal.addEventListener('click', confirmAlteration);
    }
    
    if (elements.alterApproveBtn) {
        elements.alterApproveBtn.addEventListener('click', () => {
            setAlterationAction('approved');
            console.log('Botão aprovar clicado');
        });
    }
    
    if (elements.alterRejectBtn) {
        elements.alterRejectBtn.addEventListener('click', () => {
            setAlterationAction('rejected');
            console.log('Botão rejeitar clicado');
        });
    }
    
    // Event listener global para fechar modais com ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            // Verificar qual modal está aberto e fechá-lo
            const modals = [
                { id: 'createApprovalModal', hideFunc: hideCreateApprovalModal },
                { id: 'responseModal', hideFunc: hideResponseModal },
                { id: 'auditLogsModal', hideFunc: hideAuditLogsModal },
                { id: 'restoreConfirmationModal', hideFunc: hideRestoreConfirmationModal },
                { id: 'alterationModal', hideFunc: hideAlterationModal },
                { id: 'deleteConfirmationModal', hideFunc: hideDeleteConfirmationModal },
                { id: 'approvalDetailsModal', hideFunc: hideApprovalDetailsModal }
            ];
            
            for (const modal of modals) {
                const modalElement = document.getElementById(modal.id);
                if (modalElement && !modalElement.classList.contains('hidden')) {
                    modal.hideFunc();
                    break; // Fechar apenas o primeiro modal encontrado
                }
            }
        }
    });
    
    // Event listener global para fechar modais clicando fora
    document.addEventListener('click', function(event) {
        const modals = [
            { id: 'createApprovalModal', hideFunc: hideCreateApprovalModal },
            { id: 'responseModal', hideFunc: hideResponseModal },
            { id: 'auditLogsModal', hideFunc: hideAuditLogsModal },
            { id: 'restoreConfirmationModal', hideFunc: hideRestoreConfirmationModal },
            { id: 'alterationModal', hideFunc: hideAlterationModal },
            { id: 'deleteConfirmationModal', hideFunc: hideDeleteConfirmationModal },
            { id: 'approvalDetailsModal', hideFunc: hideApprovalDetailsModal }
        ];
        
        for (const modal of modals) {
            const modalElement = document.getElementById(modal.id);
            if (modalElement && !modalElement.classList.contains('hidden')) {
                const modalContent = modalElement.querySelector('div > div');
                if (event.target === modalElement && !modalContent.contains(event.target)) {
                    modal.hideFunc();
                    break;
                }
            }
        }
    });
    
    // Event listeners para exportação
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const exportPDFBtn = document.getElementById('exportPDFBtn');
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => {
            console.log('Botão CSV clicado');
            exportAuditLogsCSV();
        });
    }
    
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', () => {
            console.log('Botão PDF clicado');
            exportAuditLogsPDF();
        });
    }
    
    // Event listeners para paginação
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            changeAuditPageSize(e.target.value);
        });
    }
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            goToAuditPage(auditPagination.currentPage - 1);
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            goToAuditPage(auditPagination.currentPage + 1);
        });
    }
    
    // Event listeners para paginação da tabela principal
    const mainPageSizeSelect = document.getElementById('mainPageSizeSelect');
    const mainPrevPageBtn = document.getElementById('mainPrevPageBtn');
    const mainNextPageBtn = document.getElementById('mainNextPageBtn');
    
    if (mainPageSizeSelect) {
        mainPageSizeSelect.addEventListener('change', (e) => {
            changeMainPageSize(e.target.value);
        });
    }
    
    if (mainPrevPageBtn) {
        mainPrevPageBtn.addEventListener('click', () => {
            goToMainPage(mainPagination.currentPage - 1);
        });
    }
    
    if (mainNextPageBtn) {
        mainNextPageBtn.addEventListener('click', () => {
            goToMainPage(mainPagination.currentPage + 1);
        });
    }
    
    // Event listeners para modal de exportação
    const closeExportPeriodModal = document.getElementById('closeExportPeriodModal');
    const cancelExportPeriod = document.getElementById('cancelExportPeriod');
    const confirmExportPeriod = document.getElementById('confirmExportPeriod');
    const quickLastWeek = document.getElementById('quickLastWeek');
    const quickLastMonth = document.getElementById('quickLastMonth');
    const quickLastYear = document.getElementById('quickLastYear');
    const quickAll = document.getElementById('quickAll');
    
    if (closeExportPeriodModal) {
        closeExportPeriodModal.addEventListener('click', hideExportPeriodModal);
    }
    
    if (cancelExportPeriod) {
        cancelExportPeriod.addEventListener('click', hideExportPeriodModal);
    }
    
    if (confirmExportPeriod) {
        confirmExportPeriod.addEventListener('click', confirmExportWithPeriod);
    }
    
    if (quickLastWeek) {
        quickLastWeek.addEventListener('click', () => setQuickDateRange('week'));
    }
    
    if (quickLastMonth) {
        quickLastMonth.addEventListener('click', () => setQuickDateRange('month'));
    }
    
    if (quickLastYear) {
        quickLastYear.addEventListener('click', () => setQuickDateRange('year'));
    }
    
    if (quickAll) {
        quickAll.addEventListener('click', () => setQuickDateRange('all'));
    }
    
    // Event delegation para botões dinâmicos
    document.addEventListener('click', async function(e) {
        // Botão de responder - verificar primeiro
        if (e.target.closest('.response-btn')) {
            const button = e.target.closest('.response-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId) {
                e.preventDefault();
                e.stopPropagation();
                showResponseModal(approvalId);
            }
            return;
        }
        
        // Botão de aprovar
        if (e.target.closest('.approve-btn')) {
            const button = e.target.closest('.approve-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                e.preventDefault();
                e.stopPropagation();
                approveApproval(approvalId);
            }
            return;
        }
        
        // Botão de rejeitar
        if (e.target.closest('.reject-btn')) {
            const button = e.target.closest('.reject-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                e.preventDefault();
                e.stopPropagation();
                rejectApproval(approvalId);
            }
            return;
        }
        
        // Botão de deletar
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                e.preventDefault();
                e.stopPropagation();
                deleteApproval(approvalId);
            }
            return;
        }
        
        // Botão de alterar nos logs de auditoria
        if (e.target.closest('.audit-edit-btn')) {
            const button = e.target.closest('.audit-edit-btn');
            const approvalId = button.getAttribute('data-approval-id');
            const action = button.getAttribute('data-action');
            if (approvalId && action) {
                e.preventDefault();
                e.stopPropagation();
                showAlterationModal(approvalId, action);
            }
            return;
        }
        
        // Botão de recuperar nos logs de auditoria
        if (e.target.closest('.audit-restore-btn')) {
            const button = e.target.closest('.audit-restore-btn');
            const approvalId = button.getAttribute('data-approval-id');
            const deletedData = button.getAttribute('data-deleted-data');
            
            if (approvalId && deletedData && deletedData !== 'undefined' && deletedData.trim() !== '') {
                try {
                    e.preventDefault();
                    e.stopPropagation();
                    const deletedApproval = JSON.parse(decodeURIComponent(deletedData));
                    await restoreApproval(approvalId, deletedApproval);
                } catch (error) {
                    console.error('Erro ao processar dados da aprovação deletada:', error);
                    showToast('Erro', 'Erro ao processar dados da aprovação deletada', 'error');
                }
            } else {
                showToast('Erro', 'Dados da aprovação deletada não encontrados', 'error');
            }
            return;
        }
        
        // Clicar na linha da tabela para expandir/contrair detalhes - verificar por último
        if (e.target.closest('tr[data-approval-id]')) {
            const row = e.target.closest('tr[data-approval-id]');
            const approvalId = row.getAttribute('data-approval-id');
            
            // Não expandir se clicou em um botão
            if (e.target.closest('.approve-btn') || 
                e.target.closest('.reject-btn') || 
                e.target.closest('.delete-btn') ||
                e.target.closest('.response-btn')) {
                return;
            }
            
            // Toggle da linha de detalhes
            const detailRow = document.getElementById(`detail-${approvalId}`);
            if (detailRow) {
                if (detailRow.classList.contains('hidden')) {
                    // Esconder todas as outras linhas de detalhes
                    document.querySelectorAll('tr[id^="detail-"]').forEach(detail => {
                        detail.classList.add('hidden');
                    });
                    // Mostrar a linha de detalhes atual
                    detailRow.classList.remove('hidden');
                } else {
                    // Esconder a linha de detalhes atual
                    detailRow.classList.add('hidden');
                }
            }
            return;
        }
        
        // Clique na linha dos logs de auditoria para mostrar detalhes
        if (e.target.closest('#auditLogsTable tr') && !e.target.closest('button')) {
            const row = e.target.closest('tr');
            const approvalId = row.getAttribute('data-approval-id');
            const logData = row.getAttribute('data-log');
            
            if (approvalId && logData) {
                try {
                    const log = JSON.parse(decodeURIComponent(logData));
                    showAuditLogDetails(log);
                } catch (error) {
                    console.error('Erro ao processar dados do log:', error);
                }
            }
            return;
        }
        
        // Cabeçalhos ordenáveis da tabela principal
        if (e.target.classList.contains('sortable') || e.target.closest('.sortable')) {
            const sortableHeader = e.target.classList.contains('sortable') ? e.target : e.target.closest('.sortable');
            const field = sortableHeader.dataset.sort;
            if (field) {
                // Verificar se está na tabela de logs de auditoria
                const auditTable = document.getElementById('auditLogsTable');
                if (auditTable && auditTable.contains(sortableHeader)) {
                    sortAuditLogs(field);
                } else {
                    sortApprovals(field);
                }
            }
            return;
        }
    });
}

// Funções para modais Tailwind
async function showCreateApprovalModal() {
    const modal = document.getElementById('createApprovalModal');
    const form = document.getElementById('createApprovalForm');
    const amountField = document.getElementById('amount');
    const approverSelect = document.getElementById('approver');
    
    if (form) form.reset();
    if (amountField) amountField.style.display = 'block';
    
    // Carregar aprovadores
    await loadApprovers();
    
    modal.classList.remove('hidden');
}

function hideCreateApprovalModal() {
    const modal = document.getElementById('createApprovalModal');
    modal.classList.add('hidden');
}



function hideResponseModal() {
    const modal = document.getElementById('responseModal');
    modal.classList.add('hidden');
}

function showAuditLogsModal() {
    const modal = document.getElementById('auditLogsModal');
    modal.classList.remove('hidden');
    
    // Carregar logs de auditoria
    loadAuditLogs();
}

function hideAuditLogsModal() {
    const modal = document.getElementById('auditLogsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Função de login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        showLoading();
        
        console.log('Fazendo login com:', email);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            console.log('Token salvo:', authToken);
            
            // Carregar informações do usuário
            await loadUserInfo();
            
            // Só mostrar dashboard se o usuário foi carregado
            if (currentUser && currentUser.email) {
                showDashboard();
                await loadApprovals();
                showToast('Sucesso', 'Login realizado com sucesso!', 'success');
            } else {
                showToast('Erro', 'Erro ao carregar informações do usuário', 'error');
            }
        } else {
            showToast('Erro', data.error || 'Erro no login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Carregar informações do usuário
async function loadUserInfo() {
    try {
        console.log('Carregando informações do usuário...');
        console.log('Token:', authToken);
        
        const response = await fetch(`${API_BASE_URL}/auth/user`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            currentUser = await response.json();
            console.log('Usuário carregado:', currentUser);
            
            userName.textContent = currentUser.name;
            userRole.textContent = currentUser.role;
            
            // Mostrar botão de auditoria apenas para admin
            if (currentUser.role === 'admin') {
                auditBtn.style.display = 'inline-block';
            }
        } else {
            console.error('Erro ao carregar usuário:', response.status);
            const errorData = await response.json();
            console.error('Erro detalhado:', errorData);
            
            // Se o token for inválido, fazer logout
            if (response.status === 401) {
                logout();
                showToast('Erro', 'Sessão expirada. Faça login novamente.', 'error');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
        showToast('Erro', 'Erro ao carregar informações do usuário', 'error');
    }
}

// Mostrar dashboard
function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    userInfo.style.display = 'block';
}

// Mostrar tela de login
function showLogin() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    userInfo.style.display = 'none';
}

// Carregar aprovações
async function loadApprovals() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/approval/pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentApprovals = data.approvals || [];
            
            console.log('Aprovações carregadas:', currentApprovals.length);
            
            // Resetar paginação
            mainPagination.currentPage = 1;
            updateMainPagination();
            
            // Exibir aprovações paginadas
            const paginatedApprovals = getPaginatedMainApprovals();
            console.log('Aprovações paginadas:', paginatedApprovals.length, 'de', currentApprovals.length);
            displayApprovals(paginatedApprovals);
            updateStats(currentApprovals);
        } else {
            console.error('Erro ao carregar aprovações:', response.status);
            showToast('Erro', 'Erro ao carregar aprovações', 'error');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Exibir aprovações na tabela
function displayApprovals(approvals) {
    const tbody = document.getElementById('approvalsTableBody');
    tbody.innerHTML = '';
    
    if (approvals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    Nenhuma aprovação pendente encontrada
                </td>
            </tr>
        `;
        return;
    }
    
    approvals.forEach(approval => {
        const row = document.createElement('tr');
        row.setAttribute('data-approval-id', approval.id);
        row.classList.add('hover:bg-gray-50', 'cursor-pointer', 'transition-colors');
        
        // Adicionar linha de detalhes expansível
        const detailRow = document.createElement('tr');
        detailRow.id = `detail-${approval.id}`;
        detailRow.classList.add('hidden', 'bg-gray-50');
        detailRow.innerHTML = `
            <td colspan="8" class="px-6 py-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <div><strong>Tipo:</strong> ${getTypeLabel(approval.type)}</div>
                        <div><strong>Solicitante:</strong> ${approval.requester}</div>
                        <div><strong>Aprovador:</strong> ${approval.approver}</div>
                        <div><strong>Status:</strong> <span class="${getStatusClass(approval.status)}">${getStatusLabel(approval.status)}</span></div>
                    </div>
                    <div class="space-y-2">
                        <div><strong>Valor:</strong> ${approval.amount ? `R$ ${parseFloat(approval.amount).toFixed(2)}` : 'N/A'}</div>
                        <div><strong>Data de Criação:</strong> ${formatDate(approval.createdAt)}</div>
                        <div><strong>Última Atualização:</strong> ${formatDate(approval.updatedAt)}</div>
                        ${approval.responseBy ? `<div><strong>Respondido por:</strong> ${approval.responseBy}</div>` : ''}
                    </div>
                </div>
                <div class="mt-3">
                    <div><strong>Descrição:</strong></div>
                    <p class="text-sm text-gray-700 mt-1">${approval.description}</p>
                    ${approval.justification ? `
                        <div class="mt-2"><strong>Justificativa:</strong></div>
                        <p class="text-sm text-gray-700 mt-1">${approval.justification}</p>
                    ` : ''}
                </div>
            </td>
        `;
        row.innerHTML = `
            <td><small class="text-muted">${approval.id ? approval.id.substring(0, 8) + '...' : 'N/A'}</small></td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${getTypeLabel(approval.type)}</span>
            </td>
            <td>${approval.requester || 'N/A'}</td>
            <td>${approval.approver || 'N/A'}</td>
            <td>${approval.amount ? `R$ ${parseFloat(approval.amount).toFixed(2)}` : '-'}</td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(approval.status)}">
                    ${getStatusLabel(approval.status)}
                </span>
            </td>
            <td><small class="text-gray-500">${formatDate(approval.createdAt)}</small></td>
            <td>
                <div class="flex space-x-1">
                    <button class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors approve-btn" data-approval-id="${approval.id}" title="Aprovar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors reject-btn" data-approval-id="${approval.id}" title="Rejeitar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors response-btn" data-approval-id="${approval.id}" title="Responder">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors delete-btn" data-approval-id="${approval.id}" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
        tbody.appendChild(detailRow);
    });
}

// Função de ordenação com 3 cliques
function sortApprovals(field) {
    // Se clicou na mesma coluna
    if (currentSort.field === field) {
        currentSort.clicks++;
        
        // Terceiro clique: remover filtro
        if (currentSort.clicks >= 3) {
            currentSort.field = null;
            currentSort.direction = 'asc';
            currentSort.clicks = 0;
            
            // Limpar todos os ícones e resetar para estado original
            document.querySelectorAll('.sortable').forEach(th => {
                th.classList.remove('asc', 'desc', 'bg-blue-50', 'text-blue-700');
                const icon = th.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-sort ml-1';
                }
            });
            
            // Retornar ao estado original
            displayApprovals(currentApprovals);
            return;
        }
        
        // Primeiro e segundo clique: alternar direção
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Nova coluna: começar do primeiro clique
        currentSort.field = field;
        currentSort.direction = 'asc';
        currentSort.clicks = 1;
    }
    
    // Atualizar ícones dos cabeçalhos
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc', 'bg-blue-50', 'text-blue-700');
        const icon = th.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort ml-1';
        }
        
        if (th.dataset.sort === field) {
            th.classList.add(currentSort.direction, 'bg-blue-50', 'text-blue-700');
            if (icon) {
                if (currentSort.direction === 'asc') {
                    icon.className = 'fas fa-sort-up ml-1';
                } else {
                    icon.className = 'fas fa-sort-down ml-1';
                }
            }
        }
    });
    
    // Ordenar aprovações
    const sortedApprovals = [...currentApprovals].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Tratamento especial para valores
        if (field === 'amount') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else if (field === 'createdAt') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }
        
        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayApprovals(sortedApprovals);
}

// Atualizar estatísticas
async function updateStats(approvals) {
    try {
        // Buscar todas as aprovações para estatísticas completas
        const response = await fetch(`${API_BASE_URL}/approval/all`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const allApprovals = data.approvals || [];
            
            const pending = allApprovals.filter(a => a.status === 'pending').length;
            const approved = allApprovals.filter(a => a.status === 'approved').length;
            const rejected = allApprovals.filter(a => a.status === 'rejected').length;
            const total = allApprovals.length;
            
            const pendingElement = document.getElementById('pendingCount');
            const approvedElement = document.getElementById('approvedCount');
            const rejectedElement = document.getElementById('rejectedCount');
            const deletedElement = document.getElementById('deletedCount');
            
            if (pendingElement) pendingElement.textContent = pending;
            if (approvedElement) approvedElement.textContent = approved;
            if (rejectedElement) rejectedElement.textContent = rejected;
            
            // Buscar aprovações deletadas dos logs de auditoria
            try {
                const auditResponse = await fetch(`${API_BASE_URL}/audit/logs`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (auditResponse.ok) {
                    const auditData = await auditResponse.json();
                    const deletedLogs = auditData.logs.filter(log => log.action === 'deleted');
                    if (deletedElement) deletedElement.textContent = deletedLogs.length;
                } else {
                    if (deletedElement) deletedElement.textContent = '0';
                }
            } catch (error) {
                console.error('Erro ao buscar logs de auditoria para contador:', error);
                if (deletedElement) deletedElement.textContent = '0';
            }
            
            console.log('Estatísticas atualizadas:', { pending, approved, rejected, total });
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        // Fallback para dados locais se a API falhar
        const pending = approvals.filter(a => a.status === 'pending').length;
        const approved = approvals.filter(a => a.status === 'approved').length;
        const rejected = approvals.filter(a => a.status === 'rejected').length;
        const total = approvals.length;
        
        const pendingElement = document.getElementById('pendingCount');
        const approvedElement = document.getElementById('approvedCount');
        const rejectedElement = document.getElementById('rejectedCount');
        const deletedElement = document.getElementById('deletedCount');
        
        if (pendingElement) pendingElement.textContent = pending;
        if (approvedElement) approvedElement.textContent = approved;
        if (rejectedElement) rejectedElement.textContent = rejected;
        if (deletedElement) deletedElement.textContent = approvals.filter(a => a.status === 'deleted').length;
    }
}

// Manipular mudança de tipo de aprovação
function handleApprovalTypeChange() {
    const type = document.getElementById('approvalType').value;
    const amountField = document.getElementById('amount');
    const amountLabel = amountField.previousElementSibling;
    
    if (amountField && amountLabel) {
        if (type === 'vacation') {
            amountField.style.display = 'none';
            amountLabel.style.display = 'none';
            amountField.value = '';
        } else {
            amountField.style.display = 'block';
            amountLabel.style.display = 'block';
        }
    }
}

// Criar aprovação
async function createApproval() {
    console.log('Função createApproval chamada');
    
    try {
        const type = document.getElementById('approvalType').value;
        const amount = document.getElementById('amount').value;
        const approver = document.getElementById('approver').value;
        const description = document.getElementById('description').value;
        
        console.log('Valores do formulário:', { type, amount, approver, description });
        
        if (!type || !approver || !description) {
            showToast('Erro', 'Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
    
        if (type !== 'vacation' && !amount) {
            showToast('Erro', 'Valor é obrigatório para este tipo de aprovação', 'error');
            return;
        }
        
        showLoading();
        
        const approvalData = {
            type,
            requester: currentUser.email,
            approver,
            description
        };
        
        if (amount) {
            approvalData.amount = parseFloat(amount);
        }
        
        console.log('Enviando dados:', approvalData);
        console.log('Token:', authToken);
        console.log('Current user:', currentUser);
        
        const response = await fetch(`${API_BASE_URL}/approval/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(approvalData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            showToast('Sucesso', 'Aprovação criada com sucesso!', 'success');
            hideCreateApprovalModal();
            await loadApprovals();
        } else {
            showToast('Erro', data.error || 'Erro ao criar aprovação', 'error');
        }
    } catch (error) {
        console.error('Erro detalhado:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Definir ação de resposta
function setResponseAction(action) {
    responseAction = action;
    
    // Atualizar visual dos botões
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (approveBtn && rejectBtn) {
        // Resetar ambos os botões para estado branco com texto colorido
        approveBtn.classList.remove('bg-green-600', 'bg-green-700', 'bg-green-800', 'text-white');
        approveBtn.classList.add('bg-white', 'text-green-600', 'border-green-600');
        rejectBtn.classList.remove('bg-red-600', 'bg-red-700', 'bg-red-800', 'text-white');
        rejectBtn.classList.add('bg-white', 'text-red-600', 'border-red-600');
        
        // Aplicar classes baseadas na ação
        if (action === 'approved') {
            approveBtn.classList.remove('bg-white', 'text-green-600', 'border-green-600');
            approveBtn.classList.add('bg-green-600', 'text-white');
        } else if (action === 'rejected') {
            rejectBtn.classList.remove('bg-white', 'text-red-600', 'border-red-600');
            rejectBtn.classList.add('bg-red-600', 'text-white');
        }
    }
    
    console.log('Ação definida:', action, 'Botões atualizados');
}

// Mostrar modal de resposta
async function showResponseModal(approvalId) {
    console.log('showResponseModal async chamada com approvalId:', approvalId);
    currentApprovalId = approvalId;
    responseAction = null;
    
    try {
        // Buscar dados da aprovação
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const approval = await response.json();
            console.log('Dados da aprovação carregados:', approval);
            
            // Se já foi respondida, carregar dados existentes
            if (approval.status !== 'pending') {
                responseAction = approval.status;
                document.getElementById('responseJustification').value = approval.justification || '';
                
                // Atualizar visual dos botões
                setResponseAction(approval.status);
                
                // Atualizar título do modal
                const modalTitle = document.querySelector('#responseModal h3');
                if (modalTitle) {
                    modalTitle.innerHTML = '<i class="fas fa-edit mr-2 text-primary-600"></i>Alterar Decisão';
                }
            } else {
                document.getElementById('responseJustification').value = '';
                // Resetar botões para estado neutro
                setResponseAction(null);
                
                // Atualizar título do modal
                const modalTitle = document.querySelector('#responseModal h3');
                if (modalTitle) {
                    modalTitle.innerHTML = '<i class="fas fa-reply mr-2 text-primary-600"></i>Responder Aprovação';
                }
            }
        } else {
            console.error('Erro ao carregar aprovação:', response.status);
            showToast('Erro', 'Erro ao carregar dados da aprovação', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar dados da aprovação:', error);
        showToast('Erro', 'Erro de conexão ao carregar dados', 'error');
    }
    
    // Mostrar modal
    const modal = document.getElementById('responseModal');
    modal.classList.remove('hidden');
}

// Aprovar aprovação
async function approveApproval(approvalId) {
    // Verificar se já está processando
    if (window.processingApproval === approvalId) {
        console.log('Aprovação já está sendo processada:', approvalId);
        return;
    }
    
    try {
        window.processingApproval = approvalId;
        showLoading();
        
        const responseData = {
            action: 'approved',
            approverID: currentUser.email,
            justification: 'Aprovado via botão rápido'
        };
        
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(responseData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sucesso', 'Aprovação aprovada com sucesso!', 'success');
            
            // Atualizar dados do sistema
            await loadApprovals();
            await updateStats(currentApprovals);
            
            // Se o modal de auditoria estiver aberto, atualizar apenas os dados
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                console.log('Modal de auditoria aberto, atualizando dados...');
                try {
                    const response = await fetch(`${API_BASE_URL}/audit/logs`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        currentAuditLogs = data.logs || [];
                        updateAuditLogsDisplay();
                        console.log('Dados dos logs atualizados com sucesso');
                    }
                } catch (error) {
                    console.error('Erro ao atualizar logs de auditoria:', error);
                }
            }
        } else {
            showToast('Erro', data.error || 'Erro ao aprovar', 'error');
        }
    } catch (error) {
        console.error('Erro ao aprovar:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
        window.processingApproval = null;
    }
}

// Rejeitar aprovação
async function rejectApproval(approvalId) {
    // Verificar se já está processando
    if (window.processingApproval === approvalId) {
        console.log('Aprovação já está sendo processada:', approvalId);
        return;
    }
    
    try {
        window.processingApproval = approvalId;
        showLoading();
        
        const responseData = {
            action: 'rejected',
            approverID: currentUser.email,
            justification: 'Rejeitado via botão rápido'
        };
        
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(responseData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sucesso', 'Aprovação rejeitada com sucesso!', 'success');
            
            // Atualizar dados do sistema
            await loadApprovals();
            await updateStats(currentApprovals);
            
            // Se o modal de auditoria estiver aberto, atualizar apenas os dados
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                console.log('Modal de auditoria aberto, atualizando dados...');
                try {
                    const response = await fetch(`${API_BASE_URL}/audit/logs`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        currentAuditLogs = data.logs || [];
                        updateAuditLogsDisplay();
                        console.log('Dados dos logs atualizados com sucesso');
                    }
                } catch (error) {
                    console.error('Erro ao atualizar logs de auditoria:', error);
                }
            }
        } else {
            showToast('Erro', data.error || 'Erro ao rejeitar', 'error');
        }
    } catch (error) {
        console.error('Erro ao rejeitar:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
        window.processingApproval = null;
    }
}

// Deletar aprovação
async function deleteApproval(approvalId) {
    // Verificar se já está processando
    if (window.processingApproval === approvalId) {
        console.log('Aprovação já está sendo processada:', approvalId);
        return;
    }
    
    try {
        // Buscar detalhes da aprovação antes de deletar
        const approval = currentApprovals.find(a => a.id === approvalId);
        if (approval) {
            showDeleteConfirmationModal(approvalId, approval);
        } else {
            showToast('Erro', 'Aprovação não encontrada', 'error');
        }
    } catch (error) {
        console.error('Erro ao buscar aprovação:', error);
        showToast('Erro', 'Erro ao buscar detalhes da aprovação', 'error');
    }
}

async function confirmDeleteApproval() {
    const approvalId = document.getElementById('deleteConfirmationModal').dataset.approvalId;
    
    if (window.processingApproval === approvalId) {
        console.log('Aprovação já está sendo processada:', approvalId);
        return;
    }
    
    try {
        window.processingApproval = approvalId;
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showToast('Sucesso', 'Aprovação deletada com sucesso!', 'success');
            hideDeleteConfirmationModal();
            
            // Atualizar todos os dados do sistema
            await loadApprovals();           // Atualizar lista de aprovações
            await updateStats(currentApprovals); // Atualizar contadores
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                await refreshAuditLogs();
            }
        } else {
            const data = await response.json();
            showToast('Erro', data.error || 'Erro ao deletar', 'error');
        }
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
        window.processingApproval = null;
    }
}

// Enviar resposta
async function submitResponse() {
    // Verificar se já está processando
    if (window.processingResponse) {
        console.log('Resposta já está sendo processada');
        return;
    }
    
    if (!responseAction) {
        showToast('Erro', 'Selecione uma ação', 'error');
        return;
    }
    
    const justification = document.getElementById('responseJustification').value;
    if (!justification) {
        showToast('Erro', 'Justificativa é obrigatória', 'error');
        return;
    }
    
    if (!currentApprovalId) {
        showToast('Erro', 'ID da aprovação não encontrado', 'error');
        return;
    }
    
    try {
        window.processingResponse = true;
        showLoading();
        
        const responseData = {
            action: responseAction,
            approverID: currentUser.email,
            justification: justification
        };
        
        const response = await fetch(`${API_BASE_URL}/approval/${currentApprovalId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(responseData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const isUpdate = responseAction !== 'pending';
            const message = isUpdate ? 'Decisão alterada com sucesso!' : 'Resposta enviada com sucesso!';
            showToast('Sucesso', message, 'success');
            
            // Remover foco do botão antes de fechar o modal
            const submitBtn = document.getElementById('submitResponseBtn');
            if (submitBtn) {
                submitBtn.blur();
            }
            
            // Fechar modal de resposta
            hideResponseModal();
            
            // Atualizar dados do sistema
            await loadApprovals();
            await updateStats(currentApprovals);
            
            // Se o modal de auditoria estiver aberto, atualizar apenas os dados
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                console.log('Modal de auditoria aberto, atualizando dados...');
                try {
                    const response = await fetch(`${API_BASE_URL}/audit/logs`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        currentAuditLogs = data.logs || [];
                        updateAuditLogsDisplay();
                        console.log('Dados dos logs atualizados com sucesso');
                    }
                } catch (error) {
                    console.error('Erro ao atualizar logs de auditoria:', error);
                }
            }
            
        } else {
            showToast('Erro', data.error || 'Erro ao enviar resposta', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
        window.processingResponse = false;
    }
}

// Mostrar logs de auditoria
async function showAuditLogs() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/audit/logs`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentAuditLogs = data.logs || [];
            
            // Resetar paginação
            auditPagination.currentPage = 1;
            updateAuditPagination();
            
            // Mostrar o modal
            showAuditLogsModal();
            
            // Atualizar display com logs paginados
            const paginatedLogs = getPaginatedAuditLogs();
            console.log('Logs paginados:', paginatedLogs.length, 'de', currentAuditLogs.length);
            displayAuditLogs(paginatedLogs);
        } else {
            console.error('Erro ao carregar logs de auditoria:', response.status);
            showToast('Erro', 'Erro ao carregar logs de auditoria', 'error');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Exibir logs de auditoria
function displayAuditLogs(logs, attempts = 0) {
    const tbody = document.getElementById('auditLogsTable');
    
    if (!tbody) {
        if (attempts < 10) {
            console.error(`Elemento #auditLogsTable não encontrado, tentativa ${attempts + 1}/10...`);
            setTimeout(() => {
                displayAuditLogs(logs, attempts + 1);
            }, 100);
            return;
        } else {
            console.error('Elemento #auditLogsTable não encontrado após 10 tentativas');
            showToast('Erro', 'Erro ao carregar logs de auditoria', 'error');
            return;
        }
    }
    
    tbody.innerHTML = '';
    
    console.log('Logs de auditoria recebidos:', logs);
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum log encontrado</td></tr>';
        return;
    }
    
    logs.forEach((log, index) => {
        console.log(`Log ${index}:`, log);
        console.log('Current user:', currentUser);
        console.log('Log structure:', {
            id: log.approvalId,
            type: log.type,
            requester: log.requester,
            approver: log.approver,
            action: log.action,
            comment: log.comment,
            timestamp: log.timestamp,
            metadata: log.metadata
        });
        const row = document.createElement('tr');
        
        // Adicionar dados do log na linha para clique
        row.setAttribute('data-approval-id', log.approvalId || '');
        row.setAttribute('data-log', encodeURIComponent(JSON.stringify(log)));
        row.style.cursor = 'pointer';
        
        // Verificar se tem dados da aprovação deletada ou restaurada
        let metadata = {};
        
        if (log.metadata) {
            if (typeof log.metadata === 'string') {
                try {
                    metadata = JSON.parse(log.metadata);
                    console.log('Metadata parseado com sucesso:', metadata);
                } catch (error) {
                    console.error('Erro ao parsear metadata:', error);
                    metadata = {};
                }
            } else {
                metadata = log.metadata;
            }
        }
        
        // Determinar o tipo de ação e cor do badge
        let actionBadge = '';
        let actionText = '';
        
        // Verificar se é uma alteração
        const isAlteration = metadata && metadata.isUpdate;
        
        if (log.action === 'approved') {
            actionBadge = 'bg-green-100 text-green-800';
            actionText = isAlteration ? 'Aprovado (alterado)' : 'Aprovado';
        } else if (log.action === 'rejected') {
            actionBadge = 'bg-red-100 text-red-800';
            actionText = isAlteration ? 'Rejeitado (alterado)' : 'Rejeitado';
        } else if (log.action === 'deleted') {
            actionBadge = 'bg-gray-100 text-gray-800';
            actionText = 'Deletado';
        } else if (log.action === 'restored') {
            actionBadge = 'bg-blue-100 text-blue-800';
            actionText = 'Restaurado';
        } else {
            actionBadge = 'bg-gray-100 text-gray-800';
            actionText = log.action;
        }
        
        const hasDeletedData = metadata && metadata.deletedApproval;
        const hasRestoredData = metadata && metadata.restoredApproval;
        const isUpdate = metadata && metadata.isUpdate;
        
        // Debug para logs deletados
        if (log.action === 'deleted') {
            console.log('Log de exclusão encontrado:', {
                logId: log.id,
                approvalId: log.approvalId,
                metadata: metadata,
                hasDeletedData: hasDeletedData,
                deletedApproval: hasDeletedData ? metadata.deletedApproval : null
            });
            
            // Debug para o botão de recuperar
            if (hasDeletedData) {
                const encodedData = encodeURIComponent(JSON.stringify(metadata.deletedApproval));
                console.log('Dados codificados para o botão:', {
                    original: metadata.deletedApproval,
                    encoded: encodedData,
                    length: encodedData.length
                });
            } else {
                console.error('Log de exclusão sem dados deletados!');
                console.error('Log completo:', log);
                console.error('Metadata:', metadata);
            }
        }
        
        // Gerar o HTML do botão de recuperar
        let restoreButtonHTML = '';
        if (log.action === 'deleted') {
            if (hasDeletedData) {
                const encodedData = encodeURIComponent(JSON.stringify(metadata.deletedApproval));
                restoreButtonHTML = `
                    <button class="btn btn-sm btn-outline-success audit-restore-btn" 
                            data-approval-id="${log.approvalId}" 
                            data-deleted-data="${encodedData}">
                        <i class="fas fa-undo"></i> Recuperar
                    </button>
                `;
                console.log('HTML do botão de recuperar gerado:', {
                    approvalId: log.approvalId,
                    encodedData: encodedData,
                    buttonHTML: restoreButtonHTML
                });
            } else {
                // Mesmo sem dados, mostrar botão para debug
                restoreButtonHTML = `
                    <button class="btn btn-sm btn-outline-warning audit-restore-btn" 
                            data-approval-id="${log.approvalId}" 
                            data-deleted-data="">
                        <i class="fas fa-exclamation-triangle"></i> Recuperar (Sem dados)
                    </button>
                `;
                console.error('Não foi possível gerar botão de recuperar - dados não disponíveis');
            }
        }
        
        row.innerHTML = `
            <td><small>${log.approvalId ? log.approvalId.substring(0, 8) + '...' : 'N/A'}</small></td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    ${hasDeletedData ? getTypeLabel(metadata.deletedApproval.type) : 'N/A'}
                </span>
            </td>
            <td>${hasDeletedData ? metadata.deletedApproval.requester : 'N/A'}</td>
            <td>${log.approver}</td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionBadge}">
                    ${actionText}
                </span>
            </td>
            <td>
                ${log.comment || '-'}
            </td>
            <td><small class="text-gray-500">${formatDate(log.timestamp)}</small></td>
            <td>
                ${currentUser && currentUser.role === 'admin' && log.action !== 'deleted' && log.action !== 'restored' ? `
                    <button class="inline-flex items-center px-2 py-1 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors audit-edit-btn" 
                            data-approval-id="${log.approvalId}" 
                            data-action="${log.action}" 
                            data-comment="${log.comment || ''}">
                        <i class="fas fa-edit mr-1"></i> Alterar
                    </button>
                ` : log.action === 'deleted' ? restoreButtonHTML : log.action === 'restored' ? '<small class="text-gray-500">Já restaurada</small>' : '<small class="text-gray-500">Apenas admin</small>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Atualizar dados
async function refreshData() {
    await loadApprovals();
    showToast('Info', 'Dados atualizados', 'info');
}

// Atualizar logs de auditoria se estiverem abertos
async function refreshAuditLogs() {
    const auditModal = document.getElementById('auditLogsModal');
    if (auditModal && !auditModal.classList.contains('hidden')) {
        try {
            const response = await fetch(`${API_BASE_URL}/audit/logs`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentAuditLogs = data.logs || [];
                updateAuditLogsDisplay();
            }
        } catch (error) {
            console.error('Erro ao atualizar logs de auditoria:', error);
        }
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    userInfo.style.display = 'none';
    
    document.getElementById('loginForm').reset();
    showToast('Info', 'Logout realizado', 'info');
}

// Funções utilitárias
function getTypeLabel(type) {
    const labels = {
        'purchase': 'Compra',
        'reimbursement': 'Reembolso',
        'vacation': 'Férias'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const statuses = {
        'pending': 'Pendente',
        'approved': 'Aprovado',
        'rejected': 'Rejeitado'
    };
    return statuses[status] || status;
}

function getActionLabel(action) {
    const actions = {
        'approved': 'Aprovado',
        'rejected': 'Rejeitado',
        'deleted': 'Excluído',
        'restored': 'Restaurado',
        'created': 'Criado'
    };
    return actions[action] || action;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800',
        'deleted': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Funções de UI
function showToast(title, message, type = 'info') {
    try {
        const toastContainer = document.getElementById('toastContainer');
        
        if (!toastContainer) {
            console.error('Container de toast não encontrado');
            alert(`${title}: ${message}`);
            return;
        }
        
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `mb-4 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-x-full`;
        
        // Definir cores baseadas no tipo
        let bgColor, borderColor, textColor;
        switch (type) {
            case 'success':
                bgColor = 'bg-green-50';
                borderColor = 'border-green-400';
                textColor = 'text-green-800';
                break;
            case 'error':
                bgColor = 'bg-red-50';
                borderColor = 'border-red-400';
                textColor = 'text-red-800';
                break;
            case 'warning':
                bgColor = 'bg-yellow-50';
                borderColor = 'border-yellow-400';
                textColor = 'text-yellow-800';
                break;
            default:
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-400';
                textColor = 'text-blue-800';
        }
        
        toast.className += ` ${bgColor} ${borderColor} ${textColor}`;
        
        // Conteúdo do toast
        toast.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                </div>
                <div class="ml-3 flex-1">
                    <h4 class="text-sm font-medium">${title}</h4>
                    <p class="text-sm mt-1">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar ao container
        toastContainer.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
        
    } catch (error) {
        console.error('Erro ao mostrar toast:', error);
        alert(`${title}: ${message}`);
    }
}

function showLoading() {
    // Implementar loading se necessário
}

function hideLoading() {
    // Implementar loading se necessário
} 

// Recuperar aprovação deletada
async function restoreApproval(approvalId, deletedApproval) {
    // Usar modal moderno em vez de confirm
    showRestoreConfirmationModal(approvalId, deletedApproval);
} 

// Funções de busca
function filterApprovals(approvals, searchTerm) {
    console.log('=== DEBUG FILTRO DE APROVAÇÕES ===');
    console.log('Termo de busca:', searchTerm);
    console.log('Total de aprovações:', approvals.length);
    
    if (!searchTerm.trim()) {
        console.log('Termo de busca vazio, retornando todas as aprovações');
        return approvals;
    }
    
    const term = searchTerm.toLowerCase().trim();
    console.log('Termo normalizado:', term);
    
    // Mapeamento de termos de busca para tipos
    const searchTypeMap = {
        'reembolso': 'reimbursement',
        'reembolsos': 'reimbursement',
        'compra': 'purchase',
        'compras': 'purchase',
        'ferias': 'vacation',
        'férias': 'vacation'
    };
    
    console.log('Mapeamento de busca:', searchTypeMap);
    console.log('Termo encontrado no mapeamento:', searchTypeMap[term]);
    
    // Verificar se o termo corresponde a um tipo específico
    const expectedType = searchTypeMap[term];
    const isTypeSpecificSearch = !!expectedType;
    
    console.log('É busca por tipo específico?', isTypeSpecificSearch);
    
    const filtered = approvals.filter(approval => {
        console.log('--- Analisando aprovação ---');
        console.log('ID:', approval.id);
        console.log('Tipo:', approval.type);
        console.log('Tipo traduzido:', getTypeLabel(approval.type));
        console.log('Solicitante:', approval.requester);
        console.log('Descrição:', approval.description);
        
        // Se é busca por tipo específico, verificar apenas o tipo
        if (isTypeSpecificSearch) {
            const typeMatch = approval.type === expectedType;
            console.log('Tipo corresponde?', typeMatch);
            
            if (typeMatch) {
                console.log('✅ Aprovação encontrada por tipo específico');
                return true;
            } else {
                console.log('❌ Tipo não corresponde, rejeitando');
                return false;
            }
        }
        
        // Se não é busca por tipo específico, fazer busca geral
        console.log('Fazendo busca geral...');
        
        const requesterMatch = approval.requester.toLowerCase().includes(term);
        const approverMatch = approval.approver.toLowerCase().includes(term);
        const descriptionMatch = approval.description.toLowerCase().includes(term);
        const statusMatch = approval.status.toLowerCase().includes(term) ||
                          getStatusLabel(approval.status).toLowerCase().includes(term);
        const idMatch = approval.id.toLowerCase().includes(term);
        
        // Valor
        const amountMatch = approval.amount && (
            approval.amount.toString().includes(term) ||
            `R$ ${parseFloat(approval.amount).toFixed(2)}`.toLowerCase().includes(term)
        );
        
        // Data
        const dateMatch = formatDate(approval.createdAt).toLowerCase().includes(term) ||
                         approval.createdAt.toLowerCase().includes(term);
        
        // Email parts
        const requesterEmailMatch = approval.requester.split('@')[0].toLowerCase().includes(term) ||
                                  approval.requester.split('@')[1]?.toLowerCase().includes(term);
        const approverEmailMatch = approval.approver.split('@')[0].toLowerCase().includes(term) ||
                                 approval.approver.split('@')[1]?.toLowerCase().includes(term);
        
        const matches = requesterMatch || approverMatch || descriptionMatch || 
                       statusMatch || idMatch || amountMatch || dateMatch || 
                       requesterEmailMatch || approverEmailMatch;
        
        console.log('Resultados da busca geral:', {
            requesterMatch,
            approverMatch,
            descriptionMatch,
            statusMatch,
            idMatch,
            amountMatch,
            dateMatch,
            requesterEmailMatch,
            approverEmailMatch,
            matches
        });
        
        if (matches) {
            console.log('✅ Aprovação encontrada por busca geral');
        } else {
            console.log('❌ Aprovação não encontrada');
        }
        
        return matches;
    });
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Aprovações filtradas:', filtered.length);
    console.log('Aprovações encontradas:', filtered.map(a => ({
        id: a.id,
        type: a.type,
        typeLabel: getTypeLabel(a.type),
        requester: a.requester
    })));
    
    return filtered;
}

function filterAuditLogs(logs, searchTerm) {
    if (!searchTerm.trim()) return logs;
    
    const term = searchTerm.toLowerCase();
    return logs.filter(log => {
        // Buscar em todos os campos dos logs
        return (
            // Campos básicos
            log.approver.toLowerCase().includes(term) ||
            log.action.toLowerCase().includes(term) ||
            (log.comment && log.comment.toLowerCase().includes(term)) ||
            (log.approvalId && log.approvalId.toLowerCase().includes(term)) ||
            
            // ID do log
            log.id.toLowerCase().includes(term) ||
            
            // Data formatada
            formatDate(log.timestamp).toLowerCase().includes(term) ||
            log.timestamp.toLowerCase().includes(term) ||
            
            // Ação em português
            getActionLabel(log.action).toLowerCase().includes(term) ||
            
            // Buscar por partes do email
            log.approver.split('@')[0].toLowerCase().includes(term) ||
            log.approver.split('@')[1]?.toLowerCase().includes(term) ||
            
            // Buscar nos dados de metadata (se existir)
            (log.metadata && typeof log.metadata === 'string' && log.metadata.toLowerCase().includes(term)) ||
            (log.metadata && typeof log.metadata === 'object' && JSON.stringify(log.metadata).toLowerCase().includes(term))
        );
    });
}

function updateApprovalsDisplay() {
    console.log('updateApprovalsDisplay chamada:', { searchTerm, currentApprovalsCount: currentApprovals.length });
    const filteredApprovals = filterApprovals(currentApprovals, searchTerm);
    console.log('Chamando displayApprovals com:', filteredApprovals.length, 'aprovações');
    displayApprovals(filteredApprovals);
}

function updateAuditLogsDisplay() {
                    const filteredLogs = filterAuditLogs(currentAuditLogs, auditSearchTerm);
                console.log('Logs filtrados:', filteredLogs.length, 'de', currentAuditLogs.length);
                
                // Atualizar paginação com logs filtrados
                auditPagination.currentPage = 1;
                updateAuditPagination();
                
                // Exibir logs filtrados e paginados
                const paginatedFilteredLogs = getPaginatedAuditLogs(filteredLogs);
                displayAuditLogs(paginatedFilteredLogs);
} 

// Função para carregar logs de auditoria
async function loadAuditLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/audit/logs`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentAuditLogs = data.logs || [];
            updateAuditLogsDisplay();
        } else {
            console.error('Erro ao carregar logs de auditoria:', response.status);
            showToast('Erro', 'Erro ao carregar logs de auditoria', 'error');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    }
}

// Função para carregar aprovadores
async function loadApprovers() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/approvers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const approverSelect = document.getElementById('approver');
            
            if (approverSelect) {
                // Limpar opções existentes, exceto a primeira
                approverSelect.innerHTML = '<option value="">Selecione um aprovador</option>';
                
                // Adicionar aprovadores
                data.approvers.forEach(approver => {
                    const option = document.createElement('option');
                    option.value = approver.email;
                    option.textContent = `${approver.name} (${approver.role}) - ${approver.email}`;
                    approverSelect.appendChild(option);
                });
            }
        } else {
            console.error('Erro ao carregar aprovadores:', response.status);
            showToast('Erro', 'Erro ao carregar lista de aprovadores', 'error');
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    }
} 

// Funções de paginação para logs de auditoria
function updateAuditPagination() {
    const totalItems = currentAuditLogs.length;
    const totalPages = Math.ceil(totalItems / auditPagination.pageSize);
    
    auditPagination.totalItems = totalItems;
    auditPagination.totalPages = totalPages;
    
    // Ajustar página atual se necessário
    if (auditPagination.currentPage > totalPages && totalPages > 0) {
        auditPagination.currentPage = totalPages;
    }
    
    updateAuditPageInfo();
}

function updateAuditPageInfo() {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${auditPagination.currentPage} de ${auditPagination.totalPages}`;
    }
    
    // Botões sempre habilitados para navegação circular
    if (prevBtn) {
        prevBtn.disabled = false;
    }
    
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

function getPaginatedAuditLogs(logsToPaginate = null) {
    const logs = logsToPaginate || currentAuditLogs;
    const startIndex = (auditPagination.currentPage - 1) * auditPagination.pageSize;
    const endIndex = startIndex + auditPagination.pageSize;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    console.log('Paginação audit logs:', {
        currentPage: auditPagination.currentPage,
        pageSize: auditPagination.pageSize,
        totalItems: logs.length,
        startIndex,
        endIndex,
        paginatedCount: paginatedLogs.length
    });
    return paginatedLogs;
}

function goToAuditPage(page) {
    if (page < 1) {
        auditPagination.currentPage = auditPagination.totalPages;
    } else if (page > auditPagination.totalPages) {
        auditPagination.currentPage = 1;
    } else {
        auditPagination.currentPage = page;
    }
    updateAuditPageInfo();
    displayAuditLogs(getPaginatedAuditLogs());
}

function changeAuditPageSize(newSize) {
    auditPagination.pageSize = parseInt(newSize);
    auditPagination.currentPage = 1; // Voltar para primeira página
    updateAuditPagination();
    displayAuditLogs(getPaginatedAuditLogs());
}

// Funções de paginação para tabela principal
function updateMainPagination() {
    const totalItems = currentApprovals.length;
    const totalPages = Math.ceil(totalItems / mainPagination.pageSize);
    
    mainPagination.totalItems = totalItems;
    mainPagination.totalPages = totalPages;
    
    // Ajustar página atual se necessário
    if (mainPagination.currentPage > totalPages && totalPages > 0) {
        mainPagination.currentPage = totalPages;
    }
    
    updateMainPageInfo();
}

function updateMainPageInfo() {
    const pageInfo = document.getElementById('mainPageInfo');
    const prevBtn = document.getElementById('mainPrevPageBtn');
    const nextBtn = document.getElementById('mainNextPageBtn');
    
    if (pageInfo) {
        pageInfo.textContent = `Página ${mainPagination.currentPage} de ${mainPagination.totalPages}`;
    }
    
    // Botões sempre habilitados para navegação circular
    if (prevBtn) {
        prevBtn.disabled = false;
    }
    
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

function getPaginatedMainApprovals() {
    const startIndex = (mainPagination.currentPage - 1) * mainPagination.pageSize;
    const endIndex = startIndex + mainPagination.pageSize;
    const paginatedApprovals = currentApprovals.slice(startIndex, endIndex);
    console.log('Paginação main approvals:', {
        currentPage: mainPagination.currentPage,
        pageSize: mainPagination.pageSize,
        totalItems: currentApprovals.length,
        startIndex,
        endIndex,
        paginatedCount: paginatedApprovals.length
    });
    return paginatedApprovals;
}

function goToMainPage(page) {
    if (page < 1) {
        mainPagination.currentPage = mainPagination.totalPages;
    } else if (page > mainPagination.totalPages) {
        mainPagination.currentPage = 1;
    } else {
        mainPagination.currentPage = page;
    }
    updateMainPageInfo();
    displayApprovals(getPaginatedMainApprovals());
}

function changeMainPageSize(newSize) {
    mainPagination.pageSize = parseInt(newSize);
    mainPagination.currentPage = 1; // Voltar para primeira página
    updateMainPagination();
    displayApprovals(getPaginatedMainApprovals());
}

// Função de ordenação para logs de auditoria
function sortAuditLogs(field) {
    // Se clicou na mesma coluna
    if (auditPagination.currentSort && auditPagination.currentSort.field === field) {
        auditPagination.currentSort.clicks++;
        
        // Terceiro clique: remover filtro
        if (auditPagination.currentSort.clicks >= 3) {
            auditPagination.currentSort.field = null;
            auditPagination.currentSort.direction = 'asc';
            auditPagination.currentSort.clicks = 0;
            
            // Limpar todos os ícones
            document.querySelectorAll('#auditLogsTable .sortable').forEach(th => {
                th.classList.remove('asc', 'desc', 'bg-blue-50', 'text-blue-700');
                const icon = th.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-sort ml-1';
                }
            });
            
            // Retornar ao estado original
            const paginatedLogs = getPaginatedAuditLogs();
            displayAuditLogs(paginatedLogs);
            return;
        }
        
        // Primeiro e segundo clique: alternar direção
        auditPagination.currentSort.direction = auditPagination.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        // Nova coluna: começar do primeiro clique
        auditPagination.currentSort = { field, direction: 'asc', clicks: 1 };
    }
    
    // Atualizar ícones dos cabeçalhos
    document.querySelectorAll('#auditLogsTable .sortable').forEach(th => {
        th.classList.remove('asc', 'desc', 'bg-blue-50', 'text-blue-700');
        const icon = th.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-sort ml-1';
        }
        
        if (th.dataset.sort === field) {
            th.classList.add(auditPagination.currentSort.direction, 'bg-blue-50', 'text-blue-700');
            if (icon) {
                if (auditPagination.currentSort.direction === 'asc') {
                    icon.className = 'fas fa-sort-up ml-1';
                } else {
                    icon.className = 'fas fa-sort-down ml-1';
                }
            }
        }
    });
    
    // Ordenar logs de auditoria
    const sortedLogs = [...currentAuditLogs].sort((a, b) => {
        let aVal, bVal;
        
        // Tratamento especial para diferentes campos
        if (field === 'id') {
            aVal = a.approvalId || '';
            bVal = b.approvalId || '';
        } else if (field === 'type') {
            let metadataA = {};
            let metadataB = {};
            try {
                metadataA = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata || {};
                metadataB = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata || {};
            } catch (error) {
                metadataA = {};
                metadataB = {};
            }
            aVal = metadataA.deletedApproval?.type || '';
            bVal = metadataB.deletedApproval?.type || '';
        } else if (field === 'requester') {
            let metadataA = {};
            let metadataB = {};
            try {
                metadataA = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata || {};
                metadataB = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : b.metadata || {};
            } catch (error) {
                metadataA = {};
                metadataB = {};
            }
            aVal = metadataA.deletedApproval?.requester || '';
            bVal = metadataB.deletedApproval?.requester || '';
        } else if (field === 'approver') {
            aVal = a.approver || '';
            bVal = b.approver || '';
        } else if (field === 'status') {
            // Mapear ações para status mais legíveis
            const getStatusValue = (action) => {
                switch(action) {
                    case 'approved': return 'Aprovado';
                    case 'rejected': return 'Rejeitado';
                    case 'deleted': return 'Deletado';
                    case 'restored': return 'Restaurado';
                    default: return action;
                }
            };
            aVal = getStatusValue(a.action || '');
            bVal = getStatusValue(b.action || '');
        } else if (field === 'comment') {
            aVal = a.comment || '';
            bVal = b.comment || '';
        } else if (field === 'timestamp') {
            aVal = new Date(a.timestamp);
            bVal = new Date(b.timestamp);
        } else {
            aVal = String(a[field] || '').toLowerCase();
            bVal = String(b[field] || '').toLowerCase();
        }
        
        if (aVal < bVal) return auditPagination.currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return auditPagination.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    currentAuditLogs = sortedLogs;
    updateAuditPagination();
    displayAuditLogs(getPaginatedAuditLogs());
}

// Funções de export
async function exportAuditLogsCSV(startDate = null, endDate = null) {
    console.log('exportAuditLogsCSV chamada:', { startDate, endDate });
    try {
        if (!startDate || !endDate) {
            console.log('Datas não fornecidas, abrindo modal de período');
            currentExportType = 'csv';
            showExportPeriodModal('csv');
            return;
        }

        console.log('Fazendo requisição para exportar CSV:', `${API_BASE_URL}/audit/export/csv?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${API_BASE_URL}/audit/export/csv?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            console.log('Resposta OK, criando blob para download');
            const blob = await response.blob();
            console.log('Blob criado:', blob.size, 'bytes');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${startDate}-to-${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Sucesso', 'CSV exportado com sucesso!', 'success');
        } else {
            const errorData = await response.json();
            console.error('Erro na resposta:', errorData);
            showToast('Erro', `Erro ao exportar CSV: ${errorData.error || 'Erro desconhecido'}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        showToast('Erro', 'Erro de conexão ao exportar CSV', 'error');
    }
}

async function exportAuditLogsPDF(startDate = null, endDate = null) {
    console.log('exportAuditLogsPDF chamada:', { startDate, endDate });
    try {
        if (!startDate || !endDate) {
            console.log('Datas não fornecidas, abrindo modal de período');
            currentExportType = 'pdf';
            showExportPeriodModal('pdf');
            return;
        }

        console.log('Fazendo requisição para exportar PDF:', `${API_BASE_URL}/audit/export/pdf?startDate=${startDate}&endDate=${endDate}`);
        const response = await fetch(`${API_BASE_URL}/audit/export/pdf?startDate=${startDate}&endDate=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            console.log('Resposta OK, criando blob para download');
            const blob = await response.blob();
            console.log('Blob criado:', blob.size, 'bytes');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${startDate}-to-${endDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Sucesso', 'PDF exportado com sucesso!', 'success');
        } else {
            const errorData = await response.json();
            console.error('Erro na resposta:', errorData);
            showToast('Erro', `Erro ao exportar PDF: ${errorData.error || 'Erro desconhecido'}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        showToast('Erro', 'Erro de conexão ao exportar PDF', 'error');
    }
} 

// Funções para modal de confirmação de restauração
function showRestoreConfirmationModal(approvalId, deletedApproval) {
    const modal = document.getElementById('restoreConfirmationModal');
    const detailsContainer = document.getElementById('restoreApprovalDetails');
    
    if (modal && detailsContainer) {
        // Exibir detalhes da aprovação
        detailsContainer.innerHTML = `
            <div class="text-sm">
                <p><strong>Tipo:</strong> ${getTypeLabel(deletedApproval.type)}</p>
                <p><strong>Solicitante:</strong> ${deletedApproval.requester}</p>
                <p><strong>Aprovador:</strong> ${deletedApproval.approver}</p>
                <p><strong>Valor:</strong> R$ ${deletedApproval.amount || 'N/A'}</p>
                <p><strong>Descrição:</strong> ${deletedApproval.description}</p>
            </div>
        `;
        
        // Armazenar dados para uso na confirmação
        modal.dataset.approvalId = approvalId;
        modal.dataset.deletedApproval = JSON.stringify(deletedApproval);
        
        modal.classList.remove('hidden');
    }
}

function hideRestoreConfirmationModal() {
    const modal = document.getElementById('restoreConfirmationModal');
    if (modal) {
        modal.classList.add('hidden');
        // Limpar dados
        delete modal.dataset.approvalId;
        delete modal.dataset.deletedApproval;
    }
}

async function confirmRestoreApproval() {
    const modal = document.getElementById('restoreConfirmationModal');
    if (!modal) return;
    
    const approvalId = modal.dataset.approvalId;
    const deletedApproval = JSON.parse(modal.dataset.deletedApproval || '{}');
    
    if (!approvalId || !deletedApproval) {
        showToast('Erro', 'Dados da aprovação não encontrados', 'error');
        return;
    }
    
    try {
        showLoading();
        
        console.log('Restaurando aprovação:', { approvalId, deletedApproval });
        
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                deletedApproval: deletedApproval,
                restoredBy: currentUser.email
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sucesso', 'Aprovação recuperada com sucesso!', 'success');
            
            // Fechar modal de confirmação
            hideRestoreConfirmationModal();
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                await showAuditLogs();
            }
        } else {
            showToast('Erro', data.error || 'Erro ao recuperar aprovação', 'error');
        }
    } catch (error) {
        console.error('Erro ao recuperar aprovação:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Funções para modal de alteração
function showAlterationModal(approvalId, currentStatus) {
    console.log('showAlterationModal chamada:', { approvalId, currentStatus });
    const modal = document.getElementById('alterationModal');
    const justificationField = document.getElementById('alterationJustification');
    
    if (!modal) {
        console.error('Modal de alteração não encontrado');
        return;
    }
    
    if (justificationField) {
        // Limpar campo de justificativa
        justificationField.value = '';
    }
    
    // Armazenar dados para uso na confirmação
    modal.dataset.approvalId = approvalId;
    modal.dataset.currentStatus = currentStatus;
    
    // Mostrar o status atual da aprovação (não o oposto)
    setAlterationAction(currentStatus);
    
    modal.classList.remove('hidden');
    console.log('Modal de alteração aberto');
}

function hideAlterationModal() {
    const modal = document.getElementById('alterationModal');
    if (modal) {
        modal.classList.add('hidden');
        // Limpar dados
        delete modal.dataset.approvalId;
        delete modal.dataset.currentStatus;
    }
}

function setAlterationAction(action) {
    const approveBtn = document.getElementById('alterApproveBtn');
    const rejectBtn = document.getElementById('alterRejectBtn');
    
    if (approveBtn && rejectBtn) {
        // Resetar ambos os botões para estado branco com texto colorido
        approveBtn.classList.remove('bg-green-600', 'bg-green-700', 'bg-green-800', 'text-white');
        approveBtn.classList.add('bg-white', 'text-green-600', 'border-green-600');
        rejectBtn.classList.remove('bg-red-600', 'bg-red-700', 'bg-red-800', 'text-white');
        rejectBtn.classList.add('bg-white', 'text-red-600', 'border-red-600');
        
        // Aplicar classe ativa baseada na ação selecionada
        if (action === 'approved') {
            approveBtn.classList.remove('bg-white', 'text-green-600', 'border-green-600');
            approveBtn.classList.add('bg-green-600', 'text-white');
        } else if (action === 'rejected') {
            rejectBtn.classList.remove('bg-white', 'text-red-600', 'border-red-600');
            rejectBtn.classList.add('bg-red-600', 'text-white');
        }
        
        // Armazenar ação selecionada
        const modal = document.getElementById('alterationModal');
        if (modal) {
            modal.dataset.selectedAction = action;
        }
        
        console.log('Ação de alteração definida:', action);
    }
}

async function confirmAlteration() {
    const modal = document.getElementById('alterationModal');
    if (!modal) return;
    
    const approvalId = modal.dataset.approvalId;
    const currentStatus = modal.dataset.currentStatus;
    const selectedAction = modal.dataset.selectedAction;
    const justification = document.getElementById('alterationJustification').value.trim();
    
    if (!approvalId || !selectedAction) {
        showToast('Erro', 'Dados da aprovação não encontrados', 'error');
        return;
    }
    
    if (!justification) {
        showToast('Erro', 'Justificativa é obrigatória', 'error');
        return;
    }
    
    try {
        showLoading();
        
        console.log('Alterando aprovação:', { approvalId, currentStatus, selectedAction, justification });
        
        const response = await fetch(`${API_BASE_URL}/approval/${approvalId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                action: selectedAction,
                justification: justification,
                approverID: currentUser.email,
                isAlteration: true,
                previousStatus: currentStatus
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Sucesso', 'Status da aprovação alterado com sucesso!', 'success');
            
            // Fechar modal de alteração
            hideAlterationModal();
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal && !auditModal.classList.contains('hidden')) {
                await showAuditLogs();
            }
        } else {
            showToast('Erro', data.error || 'Erro ao alterar aprovação', 'error');
        }
    } catch (error) {
        console.error('Erro ao alterar aprovação:', error);
        showToast('Erro', 'Erro de conexão: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
} 

// Funções para o modal de confirmação de exclusão
function showDeleteConfirmationModal(approvalId, approval) {
    const modal = document.getElementById('deleteConfirmationModal');
    const detailsContainer = document.getElementById('deleteApprovalDetails');
    
    if (modal && detailsContainer) {
        // Armazenar ID da aprovação no modal
        modal.dataset.approvalId = approvalId;
        
        // Preencher detalhes da aprovação
        detailsContainer.innerHTML = `
            <div class="space-y-2">
                <div><strong>Tipo:</strong> ${getTypeLabel(approval.type)}</div>
                <div><strong>Solicitante:</strong> ${approval.requester}</div>
                <div><strong>Descrição:</strong> ${approval.description}</div>
                ${approval.amount ? `<div><strong>Valor:</strong> R$ ${approval.amount.toFixed(2)}</div>` : ''}
                <div><strong>Status:</strong> <span class="${getStatusClass(approval.status)}">${getStatusLabel(approval.status)}</span></div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }
}

function hideDeleteConfirmationModal() {
    const modal = document.getElementById('deleteConfirmationModal');
    if (modal) {
        modal.classList.add('hidden');
        delete modal.dataset.approvalId;
    }
}

// Funções para o modal de detalhes da aprovação
function showApprovalDetailsModal(approval) {
    const modal = document.getElementById('approvalDetailsModal');
    
    if (modal) {
        // Preencher detalhes da aprovação
        document.getElementById('detailType').textContent = getTypeLabel(approval.type);
        document.getElementById('detailRequester').textContent = approval.requester;
        document.getElementById('detailApprover').textContent = approval.approver;
        document.getElementById('detailStatus').innerHTML = `<span class="${getStatusClass(approval.status)}">${getStatusLabel(approval.status)}</span>`;
        document.getElementById('detailAmount').textContent = approval.amount ? `R$ ${approval.amount.toFixed(2)}` : 'N/A';
        document.getElementById('detailCreatedAt').textContent = formatDate(approval.createdAt);
        document.getElementById('detailUpdatedAt').textContent = formatDate(approval.updatedAt);
        document.getElementById('detailDescription').textContent = approval.description;
        
        // Mostrar informações de resposta se aplicável
        const responseInfo = document.getElementById('detailResponseInfo');
        const justification = document.getElementById('detailJustification');
        
        if (approval.responseBy && approval.justification) {
            document.getElementById('detailResponseBy').textContent = approval.responseBy;
            document.getElementById('detailJustificationText').textContent = approval.justification;
            responseInfo.classList.remove('hidden');
            justification.classList.remove('hidden');
        } else {
            responseInfo.classList.add('hidden');
            justification.classList.add('hidden');
        }
        
        modal.classList.remove('hidden');
    }
}

function hideApprovalDetailsModal() {
    const modal = document.getElementById('approvalDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Função para mostrar detalhes dos logs de auditoria
function showAuditLogDetails(log) {
    const modal = document.getElementById('approvalDetailsModal');
    
    // Extrair dados do log
    let metadata = {};
    if (log.metadata) {
        if (typeof log.metadata === 'string') {
            try {
                metadata = JSON.parse(log.metadata);
            } catch (error) {
                metadata = {};
            }
        } else {
            metadata = log.metadata;
        }
    }
    
    const deletedApproval = metadata.deletedApproval || {};
    
    // Preencher dados no modal
    document.getElementById('detailType').textContent = getTypeLabel(deletedApproval.type || 'N/A');
    document.getElementById('detailRequester').textContent = deletedApproval.requester || 'N/A';
    document.getElementById('detailApprover').textContent = log.approver || 'N/A';
    document.getElementById('detailStatus').textContent = getActionLabel(log.action) + (metadata.isUpdate ? ' (alterado)' : '');
    document.getElementById('detailAmount').textContent = deletedApproval.amount ? `R$ ${deletedApproval.amount.toFixed(2)}` : 'N/A';
    document.getElementById('detailCreatedAt').textContent = formatDate(deletedApproval.createdAt || log.timestamp);
    document.getElementById('detailUpdatedAt').textContent = formatDate(log.timestamp);
    document.getElementById('detailDescription').textContent = deletedApproval.description || 'N/A';
    
    // Mostrar justificativa se houver
    const justificationDiv = document.getElementById('detailJustification');
    const justificationText = document.getElementById('detailJustificationText');
    if (log.comment) {
        justificationText.textContent = log.comment;
        justificationDiv.classList.remove('hidden');
    } else {
        justificationDiv.classList.add('hidden');
    }
    
    // Mostrar informações de resposta se aplicável
    const responseInfo = document.getElementById('detailResponseInfo');
    if (log.action === 'approved' || log.action === 'rejected') {
        document.getElementById('detailResponseBy').textContent = log.approver || 'N/A';
        responseInfo.classList.remove('hidden');
    } else {
        responseInfo.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

// Funções para modal de exportação
function showExportPeriodModal(exportType) {
    currentExportType = exportType;
    const modal = document.getElementById('exportPeriodModal');
    const startDate = document.getElementById('exportStartDate');
    const endDate = document.getElementById('exportEndDate');
    
    // Definir datas padrão (último mês)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    startDate.value = lastMonth.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
    
    modal.classList.remove('hidden');
}

function hideExportPeriodModal() {
    const modal = document.getElementById('exportPeriodModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    // Não zerar o currentExportType aqui, pois ainda precisamos dele
}

function setQuickDateRange(range) {
    const startDate = document.getElementById('exportStartDate');
    const endDate = document.getElementById('exportEndDate');
    const today = new Date();
    
    switch (range) {
        case 'week':
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate.value = lastWeek.toISOString().split('T')[0];
            endDate.value = today.toISOString().split('T')[0];
            break;
        case 'month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            startDate.value = lastMonth.toISOString().split('T')[0];
            endDate.value = today.toISOString().split('T')[0];
            break;
        case 'year':
            const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            startDate.value = lastYear.toISOString().split('T')[0];
            endDate.value = today.toISOString().split('T')[0];
            break;
        case 'all':
            startDate.value = '2020-01-01';
            endDate.value = today.toISOString().split('T')[0];
            break;
    }
}

async function confirmExportWithPeriod() {
    console.log('confirmExportWithPeriod chamada');
    const startDate = document.getElementById('exportStartDate').value;
    const endDate = document.getElementById('exportEndDate').value;
    
    console.log('Datas selecionadas:', { startDate, endDate, currentExportType });
    
    if (!startDate || !endDate) {
        showToast('Erro', 'Por favor, selecione as datas inicial e final', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('Erro', 'A data inicial não pode ser maior que a data final', 'error');
        return;
    }
    
    // Armazenar o tipo de exportação antes de fechar o modal
    const exportType = currentExportType;
    hideExportPeriodModal();
    
    try {
        if (exportType === 'csv') {
            console.log('Chamando exportAuditLogsCSV com datas:', { startDate, endDate });
            await exportAuditLogsCSV(startDate, endDate);
        } else if (exportType === 'pdf') {
            console.log('Chamando exportAuditLogsPDF com datas:', { startDate, endDate });
            await exportAuditLogsPDF(startDate, endDate);
        } else {
            console.error('Tipo de exportação desconhecido:', exportType);
            showToast('Erro', `Tipo de exportação desconhecido: ${exportType}`, 'error');
        }
    } catch (error) {
        console.error('Erro na exportação:', error);
        showToast('Erro', 'Erro ao exportar dados', 'error');
    } finally {
        // Zerar o currentExportType após o uso
        currentExportType = null;
    }
}