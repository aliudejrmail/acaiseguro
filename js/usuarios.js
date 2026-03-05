import { auth } from './modules/auth.js';
import { debounce } from './modules/utils.js';
import { ui } from './modules/ui.js';

const hostname = window.location.hostname;
const API_URL = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '')
    ? 'http://localhost:3000/api'
    : '/api';

let usuariosCache = [];

// inicialização
window.addEventListener('DOMContentLoaded', () => {
    const usuarioData = auth.getGestor();
    if (!usuarioData || !auth.getToken()) {
        window.location.href = 'apresentacao.html?gestor=true';
        return;
    }
    // preencher nome do gestor no header para evitar botão vazio
    const gestorNomeEl = document.getElementById('gestorNome');
    if (gestorNomeEl) gestorNomeEl.textContent = usuarioData.nome || '';
    document.getElementById('btnLogout').addEventListener('click', () => {
        auth.logout();
        window.location.href = 'apresentacao.html';
    });

    carregarUsuarios();
    document.getElementById('filtroUsuarios').addEventListener('input', debounce(aplicarFiltros, 500));
    document.getElementById('filtroRole').addEventListener('change', aplicarFiltros);
    document.getElementById('btnNovoUsuario').addEventListener('click', abrirModalNovoUsuario);
    document.querySelector('.modal-close').addEventListener('click', fecharModalUsuario);
    // fechar ao clicar fora do modal
    document.getElementById('modalUsuario').addEventListener('click', (e) => {
        if (e.target.id === 'modalUsuario') fecharModalUsuario();
    });

    document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
});

async function carregarUsuarios() {
    try {
        const params = new URLSearchParams();
        const busca = document.getElementById('filtroUsuarios').value;
        const role = document.getElementById('filtroRole').value;
        if (busca) params.append('busca', busca);
        if (role) params.append('role', role);

        const response = await fetch(`${API_URL}/gestor/usuarios?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();
        if (result.success) {
            usuariosCache = result.data;
            renderizarTabelaUsuarios(usuariosCache);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        ui.mostrarNotificacao('Erro ao carregar usuários', 'erro');
    }
}

function aplicarFiltros() {
    // apenas recarregue da API para simplificar
    carregarUsuarios();
}

function renderizarTabelaUsuarios(usuarios) {
    const tbody = document.getElementById('tabelaUsuariosBody');
    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = usuarios.map(u => `
        <tr data-id="${u.id}">
            <td>${u.nome}</td>
            <td>${u.email}</td>
            <td>${u.role || 'batedor'}</td>
            <td>${new Date(u.criado_em).toLocaleString()}</td>
            <td class="table-actions">
                <button class="btn-icon btn-editar" data-action="editar" data-id="${u.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-deletar" data-action="deletar" data-id="${u.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // adicionar listeners para botões criados dinamicamente
    tbody.querySelectorAll('button').forEach(btn => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'editar') btn.addEventListener('click', () => abrirModalEditarUsuario(id));
        if (action === 'deletar') btn.addEventListener('click', () => confirmarExcluirUsuario(id));
    });
}

function abrirModalNovoUsuario() {
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioNome').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioRole').value = 'batedor';
    document.getElementById('usuarioSenha').value = '';
    document.getElementById('modalUsuarioTitulo').textContent = 'Novo Usuário';
    abrirModalUsuario();
}

async function abrirModalEditarUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/gestor/usuario/${id}`, {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();
        if (result.success) {
            const u = result.data;
            document.getElementById('usuarioId').value = u.id;
            document.getElementById('usuarioNome').value = u.nome;
            document.getElementById('usuarioEmail').value = u.email;
            document.getElementById('usuarioRole').value = u.role || 'batedor';
            document.getElementById('usuarioSenha').value = '';
            document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuário';
            abrirModalUsuario();
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        ui.mostrarNotificacao('Erro ao carregar dados do usuário', 'erro');
    }
}

function abrirModalUsuario() {
    const modal = document.getElementById('modalUsuario');
    modal.classList.add('active');
    modal.removeAttribute('aria-hidden');
    // focar no primeiro campo para melhor UX
    setTimeout(() => {
        const firstInput = document.getElementById('usuarioNome');
        if (firstInput) firstInput.focus();
    }, 100);
}

function fecharModalUsuario() {
    const modal = document.getElementById('modalUsuario');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

async function salvarUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const nome = document.getElementById('usuarioNome').value;
    const email = document.getElementById('usuarioEmail').value;
    const role = document.getElementById('usuarioRole').value;
    const senha = document.getElementById('usuarioSenha').value;

    const body = { nome, email, role };
    if (senha) body.senha = senha;

    try {
        let response;
        if (id) {
            response = await fetch(`${API_URL}/gestor/usuario/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.getToken()}` },
                body: JSON.stringify(body)
            });
        } else {
            body.senha = senha || '';
            response = await fetch(`${API_URL}/gestor/usuario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.getToken()}` },
                body: JSON.stringify(body)
            });
        }
        const result = await response.json();
        if (result.success) {
            ui.mostrarNotificacao('Usuário salvo com sucesso', 'sucesso');
            fecharModalUsuario();
            carregarUsuarios();
        } else {
            ui.mostrarNotificacao(result.error || 'Erro ao salvar usuário', 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        ui.mostrarNotificacao('Erro ao salvar usuário', 'erro');
    }
}

function confirmarExcluirUsuario(id) {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
        excluirUsuario(id);
    }
}

async function excluirUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/gestor/usuario/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();
        if (result.success) {
            ui.mostrarNotificacao('Usuário excluído', 'sucesso');
            carregarUsuarios();
        } else {
            ui.mostrarNotificacao(result.error || 'Erro ao excluir', 'erro');
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        ui.mostrarNotificacao('Erro ao excluir usuário', 'erro');
    }
}
