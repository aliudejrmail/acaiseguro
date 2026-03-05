import { auth } from './modules/auth.js';
import { formatarData, formatarDataHora, debounce } from './modules/utils.js';
import { ui } from './modules/ui.js';

const hostname = window.location.hostname;
const API_URL = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '')
    ? 'http://localhost:3000/api'
    : '/api';

// Estado global
let gestorLogado = null;
let batedoresCache = [];
let batedorSelecionado = null;
let pontosCriticos = [];
let pontosPositivos = [];

// Mapa de rótulos para o checklist
const MAPA_CHECKLIST = {
    'Higiene': {
        '1': 'Unhas curtas, limpas e sem esmalte',
        '2': 'Ausência de adornos (anéis, pulseiras, relógios)',
        '3': 'Uniformizado com avental limpo e touca',
        '4': 'Mãos lavadas e sanitizadas',
        '5': 'Ausência de ferimentos ou doenças'
    },
    'Ambiente': {
        '1': 'Piso limpo e seco',
        '2': 'Paredes e teto sem sujidades',
        '3': 'Bancadas e superfícies sanitizadas',
        '4': 'Lixeiras com tampa e saco plástico',
        '5': 'Iluminação adequada',
        '6': 'Ventilação adequada'
    },
    'Pragas': {
        '1': 'Ausência de insetos voadores',
        '2': 'Ausência de roedores',
        '3': 'Telas em janelas e aberturas',
        '4': 'Ralos com tampas ou telas'
    },
    'Água': {
        '1': 'Água potável disponível',
        '2': 'Reservatório limpo (se houver)',
        '3': 'Análise da água em dia (últimos 6 meses)'
    },
    'Equipamentos': {
        '1': 'Equipamentos limpos e sanitizados',
        '2': 'Equipamentos em bom estado de funcionamento',
        '3': 'Freezer na temperatura adequada (-18°C)',
        '4': 'Utensílios organizados e protegidos'
    }
};

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', function () {
    // Verificar se está autenticado
    const gestorData = auth.getGestor();
    if (!gestorData || !auth.getToken()) {
        window.location.href = 'apresentacao.html?gestor=true';
        return;
    }

    gestorLogado = gestorData;
    document.getElementById('gestorNome').textContent = gestorLogado.nome;

    // Carregar dashboard
    carregarDashboard();
    carregarBatedores();

    // Event listeners principais
    document.getElementById('filtroBusca').addEventListener('input', debounce(aplicarFiltros, 500));
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroOrdenar').addEventListener('change', aplicarFiltros);
    document.getElementById('formNovaAnalise').addEventListener('submit', salvarAnalise);

    // Event listeners para botões (substituindo onclick)
    setupEventListeners();

    // Aplicar filtros ao clicar Enter na busca
    document.getElementById('filtroBusca').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') aplicarFiltros();
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalDetalhes');
            if (modal.classList.contains('active')) {
                fecharModal();
            }
        }
    });

    // Fechar modal ao clicar fora
    document.getElementById('modalDetalhes')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalDetalhes') {
            fecharModal();
        }
    });
});

// ==================== DASHBOARD ====================

async function carregarDashboard() {
    try {
        const response = await fetch(`${API_URL}/gestor/dashboard`, {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();

        if (result.success) {
            const { resumo, pendencias } = result.data;

            document.getElementById('totalEstabelecimentos').textContent = resumo.total_estabelecimentos || 0;
            document.getElementById('totalAprovados').textContent = resumo.aprovados || 0;
            document.getElementById('totalPendentes').textContent = resumo.pendentes || 0;
            document.getElementById('totalEmAnalise').textContent = resumo.em_analise || 0;
            document.getElementById('totalReprovados').textContent = resumo.reprovados || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarNotificacao('Erro ao carregar estatísticas', 'erro');
    }
}

// ==================== LISTAGEM DE BATEDORES ====================

async function carregarBatedores() {
    try {
        const response = await fetch(`${API_URL}/gestor/batedores`, {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();

        if (result.success) {
            batedoresCache = result.data;
            renderizarTabelaBatedores(batedoresCache);
        }
    } catch (error) {
        console.error('Erro ao carregar batedores:', error);
        document.getElementById('tabelaBatedoresBody').innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar estabelecimentos. Tente novamente.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderizarTabelaBatedores(batedores) {
    const tbody = document.getElementById('tabelaBatedoresBody');

    // Atualizar contador
    const totalRegistros = document.getElementById('totalRegistros');
    if (totalRegistros) {
        totalRegistros.textContent = `${batedores.length} ${batedores.length === 1 ? 'registro' : 'registros'}`;
    }

    if (batedores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Nenhum estabelecimento encontrado.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = batedores.map(b => {
        const statusClass = `status-${b.status_aprovacao}`;
        const statusText = {
            'pendente': 'Pendente',
            'em_analise': 'Em Análise',
            'aprovado': 'Aprovado',
            'reprovado': 'Reprovado'
        }[b.status_aprovacao] || 'Desconhecido';

        const conformidade = b.media_conformidade ? parseFloat(b.media_conformidade).toFixed(1) : 'N/A';
        const seloIcon = b.tipo_selo_ativo ?
            `<i class="fas fa-certificate" style="color: ${b.tipo_selo_ativo === 'ouro' ? '#FFD700' : '#C0C0C0'};"></i>` :
            '<span style="color: #ccc;">-</span>';

        return `
            <tr data-id="${b.id}">
                <td><strong>${b.nome_fantasia}</strong></td>
                <td>${b.nome}</td>
                <td>${b.cpf}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${b.total_checklists > 0 ?
                `<strong>${conformidade}%</strong>` :
                '<span style="color: #999;">Sem dados</span>'}
                </td>
                <td>${b.total_checklists || 0}</td>
                <td style="font-size: 1.5rem; text-align: center;">${seloIcon}</td>
                <td>
                    <div class="btn-acoes">
                        <button class="btn-icon btn-visualizar" data-action="detalhes" data-id="${b.id}" title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${b.status_aprovacao === 'pendente' || b.status_aprovacao === 'em_analise' ? `
                            <button class="btn-icon btn-aprovar" data-action="aprovar" data-id="${b.id}" title="Aprovar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-reprovar" data-action="reprovar" data-id="${b.id}" title="Reprovar">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== FILTROS ====================

function aplicarFiltros() {
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const ordenar = document.getElementById('filtroOrdenar').value;

    let filtrados = [...batedoresCache];

    // Filtrar por busca
    if (busca) {
        filtrados = filtrados.filter(b =>
            b.nome.toLowerCase().includes(busca) ||
            b.cpf.includes(busca) ||
            b.nome_fantasia.toLowerCase().includes(busca)
        );
    }

    // Filtrar por status
    if (status !== 'todos') {
        filtrados = filtrados.filter(b => b.status_aprovacao === status);
    }

    // Ordenar
    if (ordenar === 'nome') {
        filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenar === 'conformidade') {
        filtrados.sort((a, b) => (b.media_conformidade || 0) - (a.media_conformidade || 0));
    } else {
        // Manter ordenação padrão (data)
    }

    renderizarTabelaBatedores(filtrados);
}

// ==================== MODAL DE DETALHES ====================

async function abrirDetalhes(batedorId) {
    try {
        const response = await fetch(`${API_URL}/gestor/batedor/${batedorId}`, {
            headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        const result = await response.json();

        if (result.success) {
            batedorSelecionado = result.data;
            document.getElementById('modalTitulo').textContent = batedorSelecionado.batedor.nome_fantasia;
            document.getElementById('analiseIdBatedor').value = batedorId;

            renderizarTabInfo();
            renderizarTabChecklists();
            renderizarTabAnalises();

            const modal = document.getElementById('modalDetalhes');
            modal.classList.add('active');
            modal.removeAttribute('aria-hidden');

            trocarTab('info');
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mostrarNotificacao('Erro ao carregar detalhes do estabelecimento', 'erro');
    }
}
window.abrirDetalhes = abrirDetalhes;

function fecharModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
    batedorSelecionado = null;
    limparFormAnalise();
}
window.fecharModal = fecharModal;

function trocarTab(tabId) {
    // Atualizar tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
    });
    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.remove('active');
        content.hidden = true;
    });

    // Ativar tab selecionada
    const tabBtn = document.querySelector(`[aria-controls="tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}"]`);
    const tabContent = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);

    if (tabBtn && tabContent) {
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');
        tabBtn.setAttribute('tabindex', '0');
        tabContent.classList.add('active');
        tabContent.hidden = false;
    }
}
window.trocarTab = trocarTab;

function renderizarTabInfo() {
    const b = batedorSelecionado.batedor;

    const statusClass = `status-${b.status_aprovacao}`;
    const statusText = {
        'pendente': 'Pendente',
        'em_analise': 'Em Análise',
        'aprovado': 'Aprovado',
        'reprovado': 'Reprovado'
    }[b.status_aprovacao] || 'Desconhecido';

    document.getElementById('tabInfo').innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <label>Nome do Responsável</label>
                <div class="value">${b.nome}</div>
            </div>
            <div class="info-item">
                <label>CPF</label>
                <div class="value">${b.cpf}</div>
            </div>
            <div class="info-item">
                <label>Nome Fantasia</label>
                <div class="value">${b.nome_fantasia}</div>
            </div>
            <div class="info-item">
                <label>CNPJ</label>
                <div class="value">${b.cnpj || 'Não informado'}</div>
            </div>
            <div class="info-item">
                <label>Telefone</label>
                <div class="value">${b.telefone}</div>
            </div>
            <div class="info-item">
                <label>Alvará</label>
                <div class="value">${b.alvara}</div>
                ${b.alvara_foto ? `
                    <div class="document-preview" data-action="visualizar-documento" data-base64="${b.alvara_foto}">
                        <img src="${b.alvara_foto}" alt="Miniatura do Alvará" style="max-width: 100px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">
                        <p style="font-size: 0.75rem; color: #666;"><i class="fas fa-search-plus"></i> Ver documento</p>
                    </div>
                ` : '<p class="text-error" style="font-size: 0.75rem;"><i class="fas fa-times"></i> Foto não cadastrada</p>'}
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <label>Endereço</label>
                <div class="value">${b.endereco}</div>
            </div>
            <div class="info-item">
                <label>Status de Aprovação</label>
                <div class="value">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="info-item">
                <label>Data de Cadastro</label>
                <div class="value">${formatarDataHora(b.data_cadastro)}</div>
            </div>
        </div>

        <div style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;">Alterar Status</h3>

            ${(!b.alvara || !b.alvara_foto) ? `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Este estabelecimento não pode ser aprovado pois o Número ou a Foto do Alvará não foram registrados.</span>
                </div>
            ` : ''}

            <div style="display: flex; gap: 1rem;">
                <button data-action="alterar-status" data-id="${b.id}" data-status="em_analise" class="btn-secundario">
                    <i class="fas fa-search"></i> Em Análise
                </button>
                <button data-action="alterar-status" data-id="${b.id}" data-status="aprovado" 
                        class="btn-primario" 
                        style="background: ${(!b.alvara || !b.alvara_foto) ? '#94a3b8' : '#16a34a'}; cursor: ${(!b.alvara || !b.alvara_foto) ? 'not-allowed' : 'pointer'};"
                        ${(!b.alvara || !b.alvara_foto) ? 'disabled title="Requisitos de alvará pendentes"' : ''}>
                    <i class="fas fa-check"></i> Aprovar
                </button>
                <button data-action="alterar-status" data-id="${b.id}" data-status="reprovado" class="btn-primario" style="background: #dc2626;">
                    <i class="fas fa-times"></i> Reprovar
                </button>
            </div>
        </div>
    `;
}


// Adiciona cliques aos itens de checklist exibidos na aba
function attachChecklistListeners() {
    const container = document.getElementById('tabChecklists');
    if (!container) return;
    container.querySelectorAll('.checklist-item').forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.category || 'Categoria';
            let vals = {};
            try { vals = JSON.parse(item.dataset.values); } catch (_) { }

            // formatar para exibição amigável usando o mapa
            const mapaCategoria = MAPA_CHECKLIST[cat] || {};
            const allKeys = Object.keys(mapaCategoria);

            let htmlLabels = '';

            if (allKeys.length === 0) {
                htmlLabels = `<span class="text-muted">Sem mapa de rótulos para ${cat}</span>`;
            } else {
                // Normalizar valores para um conjunto de IDs marcados
                let marcados = new Set();
                if (Array.isArray(vals)) {
                    vals.forEach(id => marcados.add(String(id)));
                } else if (vals && typeof vals === 'object') {
                    Object.keys(vals).forEach(k => {
                        if (vals[k] === true || vals[k] === 'true') marcados.add(String(k));
                    });
                }

                htmlLabels = allKeys.map(id => {
                    const isMarcado = marcados.has(id);
                    const label = mapaCategoria[id] || id;
                    return `
                        <div class="detail-item ${isMarcado ? 'is-ok' : 'is-error'}">
                            <i class="fas ${isMarcado ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            <span>${label}</span>
                        </div>
                    `;
                }).join('');
            }

            // mostrar em área dentro do card
            const card = item.closest('.checklist-card');
            const output = card.querySelector('.checklist-values');
            output.innerHTML = `<strong>${cat}:</strong><div class="details-grid">${htmlLabels}</div>`;
            output.classList.add('visible');
        });
    });
}

function renderizarTabChecklists() {
    const checklists = Array.isArray(batedorSelecionado.checklists) ? batedorSelecionado.checklists : [];

    if (checklists.length === 0) {
        document.getElementById('tabChecklists').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhum check-list registrado ainda.</p>
            </div>
        `;
        return;
    }

    // helper para decodificar JSON sem quebrar
    const safeParse = (val) => {
        // já é tipo primitivo/objeto? retorne direto
        if (val === null || val === undefined) return {};
        if (typeof val !== 'string') return val; // array/object/number etc
        try {
            if (val.trim() !== '') return JSON.parse(val);
        } catch (err) {
            console.warn('safeParse falhou para string:', val);
        }
        return {};
    };

    const container = document.getElementById('tabChecklists');
    container.innerHTML = checklists.map(c => {
        const higiene = safeParse(c.higiene_manipulador);
        const ambiente = safeParse(c.limpeza_ambiente);
        const pragas = safeParse(c.controle_pragas);
        const agua = safeParse(c.qualidade_agua);
        const equipamentos = safeParse(c.manutencao_equipamentos);

        // determina classe de cada categoria (ok, nok, unknown)
        // aceita arrays (múltiplas respostas) ou objetos com campos booleanos
        const buildClass = (val) => {
            if (Array.isArray(val)) {
                return val.length > 0 ? 'ok' : 'unknown';
            }
            if (val && typeof val === 'object') {
                let hasAny = false;
                for (const key in val) {
                    if (Object.prototype.hasOwnProperty.call(val, key)) {
                        hasAny = true;
                        if (!val[key]) return 'nok';
                    }
                }
                return hasAny ? 'ok' : 'unknown';
            }
            return 'unknown';
        };

        const clsHigiene = buildClass(higiene);
        const clsAmbiente = buildClass(ambiente);
        const clsPragas = buildClass(pragas);
        const clsAgua = buildClass(agua);
        const clsEquip = buildClass(equipamentos);

        return `
            <div class="checklist-card">
                <div class="checklist-header">
                    <div>
                        <div class="checklist-date">
                            <i class="fas fa-calendar"></i>
                            ${formatarDataHora(c.data_checklist)}
                        </div>
                        ${c.editado_por_gestor ?
                '<span style="font-size: 0.8rem; color: #ca8a04;"><i class="fas fa-edit"></i> Editado por gestor</span>' :
                ''}
                    </div>
                    <div class="checklist-score" style="color: ${c.conforme ? '#16a34a' : '#dc2626'};">
                        ${!isNaN(parseFloat(c.percentual_conformidade)) ? parseFloat(c.percentual_conformidade).toFixed(1) : '—'}%
                    </div>
                </div>

                <div class="checklist-values" id="checklist-values-${c.id}"></div>

                <div class="checklist-details">
                    <div class="checklist-item ${clsHigiene}" data-category="Higiene" data-values='${JSON.stringify(higiene)}'>
                        <div class="icon"><i class="fas fa-user-nurse"></i></div>
                        <div class="label">Higiene</div>
                    </div>
                    <div class="checklist-item ${clsAmbiente}" data-category="Ambiente" data-values='${JSON.stringify(ambiente)}'>
                        <div class="icon"><i class="fas fa-broom"></i></div>
                        <div class="label">Ambiente</div>
                    </div>
                    <div class="checklist-item ${clsPragas}" data-category="Pragas" data-values='${JSON.stringify(pragas)}'>
                        <div class="icon"><i class="fas fa-bug"></i></div>
                        <div class="label">Pragas</div>
                    </div>
                    <div class="checklist-item ${clsAgua}" data-category="Água" data-values='${JSON.stringify(agua)}'>
                        <div class="icon"><i class="fas fa-tint"></i></div>
                        <div class="label">Água</div>
                    </div>
                    <div class="checklist-item ${clsEquip}" data-category="Equipamentos" data-values='${JSON.stringify(equipamentos)}'>
                        <div class="icon"><i class="fas fa-tools"></i></div>
                        <div class="label">Equipamentos</div>
                    </div>
                </div>

                ${c.observacoes ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid #7828c8;">
                        <strong>Observações:</strong>
                        <p style="margin-top: 0.5rem; color: #666;">${c.observacoes}</p>
                    </div>
                ` : ''}

                ${c.observacoes_gestor ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #fff9e6; border-radius: 8px; border-left: 4px solid #ca8a04;">
                        <strong>Observações do Gestor:</strong>
                        <p style="margin-top: 0.5rem; color: #666;">${c.observacoes_gestor}</p>
                    </div>
                ` : ''}

                <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                    <button data-action="editar-checklist" data-id="${c.id}" class="btn-secundario">
                        <i class="fas fa-edit"></i> Editar Check-list
                    </button>
                </div>
            </div>
        `;
    }).join('');
    attachChecklistListeners();
}

function renderizarTabAnalises() {
    const analises = batedorSelecionado.analises;

    if (analises.length === 0) {
        document.getElementById('tabAnalises').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Nenhuma análise registrada ainda.</p>
            </div>
        `;
        return;
    }

    document.getElementById('tabAnalises').innerHTML = analises.map(a => {
        const resultadoClass = `status-${a.resultado === 'aprovado' ? 'aprovado' : a.resultado === 'reprovado' ? 'reprovado' : 'pendente'}`;
        const resultadoText = {
            'aprovado': 'Aprovado',
            'reprovado': 'Reprovado',
            'pendente_correcoes': 'Pendente Correções'
        }[a.resultado];

        const pontosCriticos = a.pontos_criticos || [];
        const pontosPositivos = a.pontos_positivos || [];

        return `
            <div class="checklist-card">
                <div class="checklist-header">
                    <div>
                        <div class="checklist-date">
                            <i class="fas fa-calendar"></i>
                            ${formatarDataHora(a.data_analise)}
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <span style="font-size: 0.85rem; color: #666;">
                                <i class="fas fa-user"></i> ${a.gestor_nome || 'Gestor'}
                            </span>
                            <span style="margin-left: 1rem; font-size: 0.85rem; color: #666;">
                                <i class="fas fa-clipboard"></i> ${a.tipo_analise}
                            </span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-badge ${resultadoClass}">${resultadoText}</span>
                        ${a.pontuacao ? `<div class="checklist-score">${a.pontuacao}/100</div>` : ''}
                    </div>
                </div>

                <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 8px;">
                    <strong>Laudo:</strong>
                    <p style="margin-top: 0.5rem; color: #666; white-space: pre-wrap;">${a.laudo}</p>
                </div>

                ${pontosCriticos.length > 0 ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #fee; border-radius: 8px; border-left: 4px solid #dc2626;">
                        <strong style="color: #dc2626;"><i class="fas fa-exclamation-triangle"></i> Pontos Críticos:</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                            ${pontosCriticos.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${pontosPositivos.length > 0 ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #efe; border-radius: 8px; border-left: 4px solid #16a34a;">
                        <strong style="color: #16a34a;"><i class="fas fa-check-circle"></i> Pontos Positivos:</strong>
                        <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                            ${pontosPositivos.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${a.prazo_correcao ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #fff9e6; border-radius: 8px;">
                        <strong><i class="fas fa-clock"></i> Prazo para Correções:</strong>
                        <span style="margin-left: 0.5rem; color: #666;">${formatarData(a.prazo_correcao)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ==================== ANÁLISES ====================

let pontosCriticosTemp = [];
let pontosPositivosTemp = [];

function adicionarPontoCritico() {
    const input = document.getElementById('novoPontoCritico');
    const valor = input.value.trim();

    if (valor) {
        pontosCriticosTemp.push(valor);
        input.value = '';

        const lista = document.getElementById('pontosCriticosList');
        lista.innerHTML = pontosCriticosTemp.map((p, i) => `
            <div class="item-lista">
                <input type="text" value="${p}" readonly style="background: #f9fafb;">
                <button type="button" class="btn-remover-ponto" data-type="critico" data-index="${i}" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

function removerPontoCritico(index) {
    pontosCriticosTemp.splice(index, 1);
    document.getElementById('pontosCriticosList').innerHTML = pontosCriticosTemp.map((p, i) => `
        <div class="item-lista">
            <input type="text" value="${p}" readonly style="background: #f9fafb;">
            <button type="button" class="btn-remover-ponto" data-type="critico" data-index="${i}" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function adicionarPontoPositivo() {
    const input = document.getElementById('novoPontoPositivo');
    const valor = input.value.trim();

    if (valor) {
        pontosPositivosTemp.push(valor);
        input.value = '';

        const lista = document.getElementById('pontosPositivosList');
        lista.innerHTML = pontosPositivosTemp.map((p, i) => `
            <div class="item-lista">
                <input type="text" value="${p}" readonly style="background: #f9fafb;">
                <button type="button" class="btn-remover-ponto" data-type="positivo" data-index="${i}" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

function removerPontoPositivo(index) {
    pontosPositivosTemp.splice(index, 1);
    document.getElementById('pontosPositivosList').innerHTML = pontosPositivosTemp.map((p, i) => `
        <div class="item-lista">
            <input type="text" value="${p}" readonly style="background: #f9fafb;">
            <button type="button" class="btn-remover-ponto" data-type="positivo" data-index="${i}" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function salvarAnalise(e) {
    e.preventDefault();

    const batedorId = document.getElementById('analiseIdBatedor').value;
    const tipoAnalise = document.getElementById('analiseTipo').value;
    const resultado = document.getElementById('analiseResultado').value;
    const pontuacao = document.getElementById('analisePontuacao').value;
    const laudo = document.getElementById('analiseLaudo').value;
    const prazoCorrecao = document.getElementById('analisePrazoCorrecao').value;

    const dados = {
        gestorId: gestorLogado.id,
        batedorId: parseInt(batedorId),
        tipoAnalise,
        resultado,
        pontuacao: pontuacao ? parseFloat(pontuacao) : null,
        laudo,
        pontosCriticos: pontosCriticosTemp,
        pontosPositivos: pontosPositivosTemp,
        prazoCorrecao: prazoCorrecao || null
    };

    try {
        const response = await fetch(`${API_URL}/gestor/analise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.success) {
            mostrarNotificacao('Análise salva com sucesso!', 'sucesso');
            limparFormAnalise();

            // Recarregar dados
            await abrirDetalhes(batedorId);
            await carregarDashboard();
            await carregarBatedores();

            trocarTab('analises');
        } else {
            mostrarNotificacao(result.error || 'Erro ao salvar análise', 'erro');
        }
    } catch (error) {
        console.error('Erro ao salvar análise:', error);
        mostrarNotificacao('Erro ao salvar análise', 'erro');
    }
}

function limparFormAnalise() {
    document.getElementById('formNovaAnalise').reset();
    pontosCriticosTemp = [];
    pontosPositivosTemp = [];
    document.getElementById('pontosCriticosList').innerHTML = '';
    document.getElementById('pontosPositivosList').innerHTML = '';
}

// ==================== ALTERAR STATUS ====================

async function alterarStatus(batedorId, novoStatus) {
    const statusText = {
        'pendente': 'Pendente',
        'em_analise': 'Em Análise',
        'aprovado': 'Aprovado',
        'reprovado': 'Reprovado'
    }[novoStatus];
    const b = batedorSelecionado?.batedor;

    if (novoStatus === 'aprovado') {
        if (!b?.alvara || !b?.alvara_foto) {
            mostrarNotificacao('Não é possível aprovar sem o número e a foto do alvará registrados.', 'erro');
            return;
        }
    }

    let motivoReprovacao = null;
    if (novoStatus === 'reprovado') {
        motivoReprovacao = prompt('Motivo da reprovação:');
        if (!motivoReprovacao) return;
    }

    if (!confirm(`Confirma alterar status para "${statusText}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/gestor/batedor/${batedorId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify({
                gestorId: gestorLogado.id,
                status: novoStatus,
                motivoReprovacao
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarNotificacao(`Status alterado para ${statusText}`, 'sucesso');

            // Recarregar dados
            await carregarDashboard();
            await carregarBatedores();

            // Se modal estiver aberto, recarregar
            if (batedorSelecionado) {
                await abrirDetalhes(batedorId);
            }
        } else {
            mostrarNotificacao(result.error || 'Erro ao alterar status', 'erro');
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarNotificacao('Erro ao alterar status', 'erro');
    }
}

// ==================== EDITAR CHECKLIST ====================

function editarChecklist(checklistId) {
    alert('Funcionalidade de edição de checklist em desenvolvimento.\n\nEm breve você poderá editar os dados do checklist diretamente.');
    // TODO: Implementar modal de edição de checklist
}

// ==================== LOGOUT movido para o final ====================

// ==================== UTILITÁRIOS ====================

// Removendo utilitários agora importados via modules/utils.js

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'sucesso' ? '#16a34a' : tipo === 'erro' ? '#dc2626' : '#2563eb'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;

    const icon = tipo === 'sucesso' ? '✓' : tipo === 'erro' ? '✗' : 'i';
    notif.innerHTML = `<strong>${icon}</strong> ${mensagem}`;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
// ==================== SETUP EVENT LISTENERS ====================

function setupEventListeners() {
    // Event delegation para botões dinâmicos na tabela (usa data-action)
    document.getElementById('tabelaBatedoresBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!action) return;

        switch (action) {
            case 'detalhes':
                abrirDetalhes(id);
                break;
            case 'aprovar':
                alterarStatus(id, 'aprovado');
                break;
            case 'reprovar':
                alterarStatus(id, 'reprovado');
                break;
        }
    });

    // Event delegation para o modal (tabInfo, tabChecklists, etc)
    document.querySelector('.modal')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');

        if (!btn) {
            // Caso especial para remoção de pontos que não usam data-action no padrão switch
            const btnRemover = e.target.closest('.btn-remover-ponto');
            if (btnRemover) {
                const index = parseInt(btnRemover.dataset.index);
                const type = btnRemover.dataset.type;
                if (type === 'critico') removerPontoCritico(index);
                else removerPontoPositivo(index);
            }
            return;
        }

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        switch (action) {
            case 'visualizar-documento':
                visualizarDocumento(btn.getAttribute('data-base64'));
                break;
            case 'alterar-status':
                alterarStatus(id, btn.getAttribute('data-status'));
                break;
            case 'editar-checklist':
                editarChecklist(id);
                break;
        }
    });

    // Botão de logout
    document.querySelectorAll('[aria-label="Sair do sistema"]').forEach(btn => {
        btn.addEventListener('click', logout);
    });

    // Botão aplicar filtros
    document.querySelectorAll('[aria-label="Aplicar filtros de busca"]').forEach(btn => {
        btn.addEventListener('click', aplicarFiltros);
    });

    // Botões de fechar modal
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    // Tabs do modal
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('aria-controls')?.replace('tab', '').toLowerCase();
            if (tabId) trocarTab(tabId);
        });
    });

    // Botões adicionar pontos
    document.querySelectorAll('[aria-label="Adicionar ponto crítico"]').forEach(btn => {
        btn.addEventListener('click', adicionarPontoCritico);
    });

    document.querySelectorAll('[aria-label="Adicionar ponto positivo"]').forEach(btn => {
        btn.addEventListener('click', adicionarPontoPositivo);
    });

    // Botão cancelar análise
    document.querySelectorAll('.btn-cancelar-analise').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    // Event delegation para botões de remover item
    document.getElementById('pontosCriticosList')?.addEventListener('click', (e) => {
        const btnRemover = e.target.closest('.btn-reprovar');
        if (btnRemover) {
            btnRemover.closest('.item-lista')?.remove();
        }
    });

    document.getElementById('pontosPositivosList')?.addEventListener('click', (e) => {
        const btnRemover = e.target.closest('.btn-reprovar');
        if (btnRemover) {
            btnRemover.closest('.item-lista')?.remove();
        }
    });
}

// Funções de Modal e Tabs migradas para o topo para melhor organização

// ==================== FUNÇÕES DE FORMULÁRIO ====================

window.adicionarPontoCritico = function () {
    const input = document.getElementById('novoPontoCritico');
    const valor = input?.value.trim();

    if (!valor) {
        mostrarNotificacao('Digite um ponto crítico para adicionar', 'erro');
        input?.focus();
        return;
    }

    const lista = document.getElementById('pontosCriticosList');
    const item = document.createElement('div');
    item.className = 'item-lista';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
        <input type="text" value="${escapeHtml(valor)}" readonly style="background: #f0f0f0;">
        <button type="button" class="btn-icon btn-reprovar" aria-label="Remover item">
            <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
    `;
    lista.appendChild(item);
    input.value = '';
    input.focus();
}

window.adicionarPontoPositivo = function () {
    const input = document.getElementById('novoPontoPositivo');
    const valor = input?.value.trim();

    if (!valor) {
        mostrarNotificacao('Digite um ponto positivo para adicionar', 'erro');
        input?.focus();
        return;
    }

    const lista = document.getElementById('pontosPositivosList');
    const item = document.createElement('div');
    item.className = 'item-lista';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
        <input type="text" value="${escapeHtml(valor)}" readonly style="background: #f0f0f0;">
        <button type="button" class="btn-icon btn-reprovar" aria-label="Remover item">
            <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
    `;
    lista.appendChild(item);
    input.value = '';
    input.focus();
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        auth.logout();
        window.location.href = 'apresentacao.html';
    }
}

window.logout = logout;

function visualizarDocumento(base64) {
    if (!base64) return;
    const win = window.open();
    if (!win) {
        alert('Por favor, permita pop-ups para visualizar o documento');
        return;
    }
    const typeMatch = base64.match(/^data:([^;]+);/);
    const type = typeMatch ? typeMatch[1] : 'image/png';

    if (type.includes('image')) {
        win.document.write(`<html><body style="margin:0; background: #333; display: flex; align-items: center; justify-content: center;"><img src="${base64}" style="max-width: 100%; max-height: 100%;"></body></html>`);
    } else {
        win.document.write(`<embed width="100%" height="100%" src="${base64}" type="${type}">`);
    }
    win.document.title = "Visualização de Documento";
}
window.visualizarDocumento = visualizarDocumento;