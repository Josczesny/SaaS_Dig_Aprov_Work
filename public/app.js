// Configurações da API
const API_BASE_URL = 'http://localhost:3000/api';

// Estado global
let authToken = localStorage.getItem('authToken');
let currentUser = null;
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
const auditBtn = document.getElementById('auditBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando listeners...');
    
    // Verificar se Bootstrap está carregado
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap não está carregado!');
        return;
    }
    
    // Configurar acessibilidade dos modais
    fixModalAccessibility();
    
    // Listener global para limpeza do backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop') || 
            (e.target.classList.contains('modal') && e.target.classList.contains('fade'))) {
            console.log('Clique no backdrop detectado, limpando...');
            clearModalBackdrop();
        }
    });
    
    // Listener para tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log('ESC pressionado, limpando backdrop...');
            setTimeout(clearModalBackdrop, 100);
        }
    });
    
    // Elementos principais
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const createApprovalBtn = document.getElementById('createApprovalBtn');
    const refreshDataBtn = document.getElementById('refreshDataBtn');
    const auditBtn = document.getElementById('auditBtn');
    
    console.log('Elementos principais encontrados:', {
        loginForm: !!loginForm,
        logoutBtn: !!logoutBtn,
        createApprovalBtn: !!createApprovalBtn,
        refreshDataBtn: !!refreshDataBtn,
        auditBtn: !!auditBtn
    });
    
    // Event listeners para elementos principais
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Event listener para loginForm adicionado');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('Event listener para logoutBtn adicionado');
    }
    
    if (createApprovalBtn) {
        createApprovalBtn.addEventListener('click', showCreateApprovalModal);
        console.log('Event listener para createApprovalBtn adicionado');
    }
    
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', loadApprovals);
        console.log('Event listener para refreshDataBtn adicionado');
    }
    
    if (auditBtn) {
        auditBtn.addEventListener('click', showAuditLogs);
        console.log('Event listener para auditBtn adicionado');
    }
    
    // Event listeners para campos de busca
    const searchApprovals = document.getElementById('searchApprovals');
    const clearSearch = document.getElementById('clearSearch');
    const searchAuditLogs = document.getElementById('searchAuditLogs');
    const clearAuditSearch = document.getElementById('clearAuditSearch');
    
    if (searchApprovals) {
        searchApprovals.addEventListener('input', function() {
            searchTerm = this.value;
            updateApprovalsDisplay();
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', function() {
            searchApprovals.value = '';
            searchTerm = '';
            updateApprovalsDisplay();
        });
    }
    
    if (searchAuditLogs) {
        searchAuditLogs.addEventListener('input', function() {
            auditSearchTerm = this.value;
            updateAuditLogsDisplay();
        });
    }
    
    if (clearAuditSearch) {
        clearAuditSearch.addEventListener('click', function() {
            searchAuditLogs.value = '';
            auditSearchTerm = '';
            updateAuditLogsDisplay();
        });
    }
    
    // Event listeners para botões de exportação
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const exportPDFBtn = document.getElementById('exportPDFBtn');
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportAuditLogsCSV);
    }
    
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportAuditLogsPDF);
    }
    
    // Event listeners para modais
    const createApprovalSubmitBtn = document.getElementById('createApprovalSubmitBtn');
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const submitResponseBtn = document.getElementById('submitResponseBtn');
    const approvalType = document.getElementById('approvalType');
    
    if (createApprovalSubmitBtn) {
        createApprovalSubmitBtn.addEventListener('click', createApproval);
    }
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            responseAction = 'approved';
            document.getElementById('responseJustification').focus();
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            responseAction = 'rejected';
            document.getElementById('responseJustification').focus();
        });
    }
    
    if (submitResponseBtn) {
        submitResponseBtn.addEventListener('click', submitResponse);
    }
    
    if (approvalType) {
        approvalType.addEventListener('change', handleApprovalTypeChange);
    }
    
    console.log('Listeners configurados com sucesso');
    
    // Event delegation para botões dinâmicos
    document.addEventListener('click', async function(e) {
        // Botão de aprovar
        if (e.target.classList.contains('approve-btn') || e.target.closest('.approve-btn')) {
            const button = e.target.classList.contains('approve-btn') ? e.target : e.target.closest('.approve-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                approveApproval(approvalId);
            }
            return;
        }
        
        // Botão de rejeitar
        if (e.target.classList.contains('reject-btn') || e.target.closest('.reject-btn')) {
            const button = e.target.classList.contains('reject-btn') ? e.target : e.target.closest('.reject-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                rejectApproval(approvalId);
            }
            return;
        }
        
        // Botão de deletar
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId && !window.processingApproval) {
                deleteApproval(approvalId);
            }
            return;
        }
        
        // Botão de responder
        if (e.target.classList.contains('response-btn') || e.target.closest('.response-btn')) {
            const button = e.target.classList.contains('response-btn') ? e.target : e.target.closest('.response-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId) {
                showResponseModal(approvalId);
            }
            return;
        }
        
        // Botão de alterar nos logs de auditoria
        if (e.target.classList.contains('audit-edit-btn') || e.target.closest('.audit-edit-btn')) {
            const button = e.target.classList.contains('audit-edit-btn') ? e.target : e.target.closest('.audit-edit-btn');
            const approvalId = button.getAttribute('data-approval-id');
            if (approvalId) {
                await showResponseModal(approvalId);
            }
            return;
        }
        
        // Botão de recuperar nos logs de auditoria
        if (e.target.classList.contains('audit-restore-btn') || e.target.closest('.audit-restore-btn')) {
            const button = e.target.classList.contains('audit-restore-btn') ? e.target : e.target.closest('.audit-restore-btn');
            const approvalId = button.getAttribute('data-approval-id');
            const deletedData = button.getAttribute('data-deleted-data');
            
            if (approvalId && deletedData && deletedData !== 'undefined' && deletedData.trim() !== '') {
                try {
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
        
        // Cabeçalhos ordenáveis
        if (e.target.classList.contains('sortable') || e.target.closest('.sortable')) {
            const sortableHeader = e.target.classList.contains('sortable') ? e.target : e.target.closest('.sortable');
            const field = sortableHeader.dataset.sort;
            if (field) {
                sortApprovals(field);
            }
            return;
        }
    });
    
    // Carregar dados iniciais se estiver logado
    if (authToken) {
        loadApprovals();
    }
});

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
            updateApprovalsDisplay();
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
    const tbody = document.getElementById('approvalsTable');
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
        row.innerHTML = `
            <td><small class="text-muted">${approval.id ? approval.id.substring(0, 8) + '...' : 'N/A'}</small></td>
            <td>
                <span class="badge bg-secondary">${getTypeLabel(approval.type)}</span>
            </td>
            <td>${approval.amount ? `R$ ${parseFloat(approval.amount).toFixed(2)}` : '-'}</td>
            <td>${approval.requester || 'N/A'}</td>
            <td>${approval.approver || 'N/A'}</td>
            <td>
                <span class="badge badge-${getStatusClass(approval.status)}">
                    ${getStatusLabel(approval.status)}
                </span>
            </td>
            <td><small>${formatDate(approval.createdAt)}</small></td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-success approve-btn" data-approval-id="${approval.id}" title="Aprovar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-outline-danger reject-btn" data-approval-id="${approval.id}" title="Rejeitar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-outline-primary response-btn" data-approval-id="${approval.id}" title="Responder">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="btn btn-outline-warning delete-btn" data-approval-id="${approval.id}" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
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
            
            // Limpar todos os ícones
            document.querySelectorAll('.sortable').forEach(th => {
                th.classList.remove('asc', 'desc');
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
        th.classList.remove('asc', 'desc');
        if (th.dataset.sort === field) {
            th.classList.add(currentSort.direction);
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
            
            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('approvedCount').textContent = approved;
            document.getElementById('rejectedCount').textContent = rejected;
            document.getElementById('totalCount').textContent = total;
            
            console.log('Estatísticas atualizadas:', { pending, approved, rejected, total });
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        // Fallback para dados locais se a API falhar
        const pending = approvals.filter(a => a.status === 'pending').length;
        const approved = approvals.filter(a => a.status === 'approved').length;
        const rejected = approvals.filter(a => a.status === 'rejected').length;
        const total = approvals.length;
        
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;
        document.getElementById('totalCount').textContent = total;
    }
}

// Mostrar modal de criação de aprovação
function showCreateApprovalModal() {
    document.getElementById('createApprovalForm').reset();
    document.getElementById('amountField').style.display = 'block';
    new bootstrap.Modal(document.getElementById('createApprovalModal')).show();
}

// Manipular mudança de tipo de aprovação
function handleApprovalTypeChange() {
    const type = document.getElementById('approvalType').value;
    const amountField = document.getElementById('amountField');
    
    if (type === 'vacation') {
        amountField.style.display = 'none';
        document.getElementById('approvalAmount').value = '';
    } else {
        amountField.style.display = 'block';
    }
}

// Criar aprovação
async function createApproval() {
    console.log('Função createApproval chamada');
    
    try {
        const type = document.getElementById('approvalType').value;
        const amount = document.getElementById('approvalAmount').value;
        const approver = document.getElementById('approvalApprover').value;
        const description = document.getElementById('approvalDescription').value;
        
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
            bootstrap.Modal.getInstance(document.getElementById('createApprovalModal')).hide();
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
    
    // Remover todas as classes de cor
    approveBtn.classList.remove('btn-success', 'btn-outline-success');
    rejectBtn.classList.remove('btn-danger', 'btn-outline-danger');
    
    // Aplicar classes baseadas na ação
    if (action === 'approved') {
        approveBtn.classList.add('btn-success');
        rejectBtn.classList.add('btn-outline-danger');
    } else if (action === 'rejected') {
        approveBtn.classList.add('btn-outline-success');
        rejectBtn.classList.add('btn-danger');
    } else {
        // Estado neutro (pending)
        approveBtn.classList.add('btn-outline-success');
        rejectBtn.classList.add('btn-outline-danger');
    }
    
    console.log('Ação definida:', action, 'Botões atualizados');
}

// Mostrar modal de resposta
async function showResponseModal(approvalId) {
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
                const modalTitle = document.querySelector('#responseModal .modal-title');
                if (modalTitle) {
                    modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Alterar Decisão';
                }
            } else {
                document.getElementById('responseJustification').value = '';
                // Resetar botões para estado neutro
                setResponseAction(null);
                
                // Atualizar título do modal
                const modalTitle = document.querySelector('#responseModal .modal-title');
                if (modalTitle) {
                    modalTitle.innerHTML = '<i class="fas fa-reply me-2"></i>Responder Aprovação';
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
    const responseModal = new bootstrap.Modal(document.getElementById('responseModal'));
    responseModal.show();
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
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal.classList.contains('show')) {
                await showAuditLogs();
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
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal.classList.contains('show')) {
                await showAuditLogs();
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
    
    if (!confirm('Tem certeza que deseja deletar esta aprovação?')) {
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
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal.classList.contains('show')) {
                await showAuditLogs();
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
            
            // Fechar modal de resposta
            const responseModal = bootstrap.Modal.getInstance(document.getElementById('responseModal'));
            if (responseModal) {
                responseModal.hide();
            }
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal.classList.contains('show')) {
                await showAuditLogs();
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
            
            // Mostrar o modal primeiro
            const modalElement = document.getElementById('auditLogsModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            
            // Aguardar o modal estar completamente aberto
            modalElement.addEventListener('shown.bs.modal', function onModalShown() {
                console.log('Modal de logs aberto, atualizando display...');
                updateAuditLogsDisplay();
                modalElement.removeEventListener('shown.bs.modal', onModalShown);
            });
            
            // Corrigir problema do backdrop ao fechar
            modalElement.addEventListener('hidden.bs.modal', function onModalHidden() {
                console.log('Modal de logs fechado, limpando backdrop...');
                clearModalBackdrop();
                modalElement.removeEventListener('hidden.bs.modal', onModalHidden);
            });
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
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum log encontrado</td></tr>';
        return;
    }
    
    logs.forEach((log, index) => {
        console.log(`Log ${index}:`, log);
        const row = document.createElement('tr');
        
        // Determinar o tipo de ação e cor do badge
        let actionBadge = '';
        let actionText = '';
        
        if (log.action === 'approved') {
            actionBadge = 'bg-success';
            actionText = 'Aprovado';
        } else if (log.action === 'rejected') {
            actionBadge = 'bg-danger';
            actionText = 'Rejeitado';
        } else if (log.action === 'deleted') {
            actionBadge = 'bg-dark';
            actionText = 'Deletado';
        } else if (log.action === 'restored') {
            actionBadge = 'bg-info';
            actionText = 'Restaurado';
        } else {
            actionBadge = 'bg-secondary';
            actionText = log.action;
        }
        
        // Verificar se tem dados da aprovação deletada ou restaurada
        let metadata = log.metadata;
        
        // Se metadata for string, tentar fazer parse
        if (typeof metadata === 'string') {
            try {
                metadata = JSON.parse(metadata);
                console.log('Metadata parseado com sucesso:', metadata);
            } catch (error) {
                console.error('Erro ao parsear metadata:', error);
                metadata = {};
            }
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
            <td><small>${formatDate(log.timestamp)}</small></td>
            <td>${log.approver}</td>
            <td>
                <span class="badge ${actionBadge}">
                    ${actionText}
                </span>
                ${isUpdate ? '<small class="text-warning ms-1">(Alterado)</small>' : ''}
                ${log.action === 'deleted' ? '<small class="text-danger ms-1">(Excluído)</small>' : ''}
                ${log.action === 'restored' ? '<small class="text-info ms-1">(Restaurado)</small>' : ''}
            </td>
            <td>
                ${log.comment || '-'}
                ${hasDeletedData ? `
                    <br><small class="text-muted">
                        <strong>Dados da aprovação excluída:</strong><br>
                        Tipo: ${getTypeLabel(metadata.deletedApproval.type)}<br>
                        Solicitante: ${metadata.deletedApproval.requester}<br>
                        Valor: ${metadata.deletedApproval.amount ? `R$ ${parseFloat(metadata.deletedApproval.amount).toFixed(2)}` : '-'}<br>
                        Status: ${getStatusLabel(metadata.deletedApproval.status)}
                    </small>
                ` : ''}
                ${hasRestoredData ? `
                    <br><small class="text-muted">
                        <strong>Dados da restauração:</strong><br>
                        Status original: ${getStatusLabel(metadata.restoredApproval.originalStatus)}<br>
                        Status restaurado: ${getStatusLabel(metadata.restoredApproval.restoredStatus)}
                    </small>
                ` : ''}
            </td>
            <td>
                <span class="badge bg-${isUpdate ? 'warning' : log.action === 'deleted' ? 'danger' : log.action === 'restored' ? 'info' : 'info'}">
                    ${isUpdate ? 'Alteração' : log.action === 'deleted' ? 'Exclusão' : log.action === 'restored' ? 'Restauração' : 'Original'}
                </span>
            </td>
            <td>
                ${currentUser.role === 'admin' && log.action !== 'deleted' && log.action !== 'restored' ? `
                    <button class="btn btn-sm btn-outline-warning audit-edit-btn" data-approval-id="${log.approvalId}" data-action="${log.action}" data-comment="${log.comment || ''}">
                        <i class="fas fa-edit"></i> Alterar
                    </button>
                ` : log.action === 'deleted' ? restoreButtonHTML : log.action === 'restored' ? '<small class="text-muted">Já restaurada</small>' : '<small class="text-muted">Apenas admin</small>'}
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
    if (auditModal.classList.contains('show')) {
        try {
            const response = await fetch(`${API_BASE_URL}/audit/logs`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                displayAuditLogs(data.logs || []);
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
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
    };
    return classes[status] || 'secondary';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Funções de UI
function showToast(title, message, type = 'info') {
    try {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastTitle || !toastMessage) {
            console.error('Elementos do toast não encontrados');
            alert(`${title}: ${message}`);
            return;
        }
        
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Remover classes anteriores
        toast.classList.remove('bg-success', 'bg-danger', 'bg-info');
        
        // Adicionar classe baseada no tipo
        if (type === 'success') {
            toast.classList.add('bg-success');
        } else if (type === 'error') {
            toast.classList.add('bg-danger');
        } else {
            toast.classList.add('bg-info');
        }
        
        if (typeof bootstrap !== 'undefined') {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } else {
            console.error('Bootstrap não disponível para toast');
            alert(`${title}: ${message}`);
        }
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
    if (!confirm('Tem certeza que deseja recuperar esta aprovação?')) {
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
            
            // Atualizar todos os dados do sistema
            await Promise.all([
                loadApprovals(),           // Atualizar lista de aprovações
                updateStats(currentApprovals), // Atualizar contadores
                refreshAuditLogs()         // Atualizar logs de auditoria se estiverem abertos
            ]);
            
            // Se o modal de auditoria estiver aberto, recarregar os logs
            const auditModal = document.getElementById('auditLogsModal');
            if (auditModal.classList.contains('show')) {
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

// Funções de busca
function filterApprovals(approvals, searchTerm) {
    console.log('filterApprovals chamada:', { searchTerm, approvalsCount: approvals.length });
    
    if (!searchTerm.trim()) {
        console.log('Termo de busca vazio, retornando todas as aprovações');
        return approvals;
    }
    
    const term = searchTerm.toLowerCase();
    console.log('Termo de busca normalizado:', term);
    
    const filtered = approvals.filter(approval => {
        // Buscar em todos os campos
        const matches = (
            // Campos básicos
            approval.type.toLowerCase().includes(term) ||
            approval.requester.toLowerCase().includes(term) ||
            approval.approver.toLowerCase().includes(term) ||
            approval.description.toLowerCase().includes(term) ||
            approval.status.toLowerCase().includes(term) ||
            
            // ID da aprovação
            approval.id.toLowerCase().includes(term) ||
            
            // Valor (como número e como string)
            (approval.amount && approval.amount.toString().includes(term)) ||
            (approval.amount && `R$ ${parseFloat(approval.amount).toFixed(2)}`.toLowerCase().includes(term)) ||
            
            // Data formatada
            formatDate(approval.createdAt).toLowerCase().includes(term) ||
            approval.createdAt.toLowerCase().includes(term) ||
            
            // Status em português
            getStatusLabel(approval.status).toLowerCase().includes(term) ||
            
            // Tipo em português
            getTypeLabel(approval.type).toLowerCase().includes(term) ||
            
            // Buscar por partes do email
            approval.requester.split('@')[0].toLowerCase().includes(term) ||
            approval.approver.split('@')[0].toLowerCase().includes(term) ||
            
            // Buscar por domínio do email
            approval.requester.split('@')[1]?.toLowerCase().includes(term) ||
            approval.approver.split('@')[1]?.toLowerCase().includes(term)
        );
        
        if (matches) {
            console.log('Aprovação encontrada:', approval.id, approval.type, approval.requester);
        }
        
        return matches;
    });
    
    console.log('Aprovações filtradas:', filtered.length);
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
    displayAuditLogs(filteredLogs);
} 

// Função para limpar backdrop e melhorar o fechamento do modal
function clearModalBackdrop() {
    console.log('Limpando backdrop do modal...');
    
    // Remover backdrop manualmente
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        console.log('Removendo backdrop:', backdrop);
        backdrop.remove();
    });
    
    // Limpar classes do body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Remover atributos aria-hidden dos modais
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.removeAttribute('aria-hidden');
        modal.style.display = 'none';
    });
    
    console.log('Backdrop limpo com sucesso');
}

// Função para corrigir problemas de acessibilidade dos modais
function fixModalAccessibility() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('shown.bs.modal', function() {
            this.removeAttribute('aria-hidden');
        });
        
        modal.addEventListener('hidden.bs.modal', function() {
            console.log('Modal fechado, limpando backdrop...');
            clearModalBackdrop();
        });
    });
} 

// Funções de export
async function exportAuditLogsCSV() {
    try {
        const response = await fetch(`${API_BASE_URL}/audit/export/csv`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_logs.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Sucesso', 'Logs exportados em CSV', 'success');
        } else {
            showToast('Erro', 'Erro ao exportar logs', 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        showToast('Erro', 'Erro ao exportar logs', 'error');
    }
}

async function exportAuditLogsPDF() {
    try {
        const response = await fetch(`${API_BASE_URL}/audit/export/pdf`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_logs.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Sucesso', 'Logs exportados em PDF', 'success');
        } else {
            showToast('Erro', 'Erro ao exportar logs', 'error');
        }
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        showToast('Erro', 'Erro ao exportar logs', 'error');
    }
} 