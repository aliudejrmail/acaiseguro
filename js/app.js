// App.js - Lógica principal do aplicativo Açaí Seguro
import { db } from './database.js';
import { auth } from './modules/auth.js';
import { ui } from './modules/ui.js';
import { formatarCPF, formatarCNPJ, formatarTelefone } from './modules/utils.js';
import { calculadora } from './modules/calculadora.js';
import { cadastro } from './modules/cadastro.js';
import { bpf } from './modules/bpf.js';

// Expor funções para o escopo global (para suportar onclick no HTML)
window.showPage = showPage;
window.fazerLogout = fazerLogout;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.buscarCEP = buscarCEP;
window.getLocation = getLocation;
window.startTimer = startTimer;
window.buscarModulos = buscarModulos;
window.exportarPerfilPDF = exportarPerfilPDF;
window.updateDashboardEstatisticas = updateDashboardEstatisticas;
window.toggleEtapaConcluida = toggleEtapaConcluida;
window.updateProgresso = updateProgresso;
window.resetAllChecklists = resetAllChecklists;
window.toggleStepByStepMode = toggleStepByStepMode;
window.nextEtapa = nextEtapa;
window.previousEtapa = previousEtapa;
window.toggleTimer = toggleTimer;
window.closeTimer = closeTimer;
window.startTimerForEtapa = startTimerForEtapa;
window.resetTimer = resetTimer;
window.updateBPFProgress = updateBPFProgress;

function updateBPFProgress() {
    const categories = ['higiene', 'ambiente', 'pragas', 'agua', 'equipamentos'];
    let totalChecked = 0;
    let totalItens = 0;

    categories.forEach(cat => {
        const query = `input[name="${cat}"]`;
        const all = document.querySelectorAll(query);
        const checked = document.querySelectorAll(`${query}:checked`);

        const badge = document.getElementById(`badge-${cat}`);
        if (badge) {
            badge.textContent = `${checked.length}/${all.length}`;
            // Mudar cor do badge se completo
            if (checked.length === all.length && all.length > 0) {
                badge.style.background = 'var(--accent-color)';
                badge.style.color = 'white';
            } else {
                badge.style.background = '#F7FAFC';
                badge.style.color = '#4A5568';
            }
        }

        totalChecked += checked.length;
        totalItens += all.length;
    });

    const percent = totalItens > 0 ? ((totalChecked / totalItens) * 100).toFixed(0) : 0;

    // Atualizar Barra de Score
    const scoreValue = document.getElementById('bpfScoreValue');
    const scoreBar = document.getElementById('bpfScoreBar');
    const statusBadge = document.getElementById('bpfStatusBadge');

    if (scoreValue) scoreValue.textContent = `${percent}%`;
    if (scoreBar) scoreBar.style.width = `${percent}%`;

    if (statusBadge) {
        if (percent >= 100) {
            statusBadge.textContent = 'Excelente';
            statusBadge.style.background = 'var(--accent-color)';
            statusBadge.style.color = 'white';
        } else if (percent >= 80) {
            statusBadge.textContent = 'Bom';
            statusBadge.style.background = 'var(--warning-color)';
            statusBadge.style.color = 'white';
        } else if (percent > 0) {
            statusBadge.textContent = 'Em Andamento';
            statusBadge.style.background = 'var(--secondary-color)';
            statusBadge.style.color = 'white';
        } else {
            statusBadge.textContent = 'Pendente';
            statusBadge.style.background = '#F7FAFC';
            statusBadge.style.color = '#4A5568';
        }
    }
}

// Controle de navegação entre páginas
function showPage(pageId) {
    ui.showPage(pageId);

    // Lógica específica de carregamento por página
    if (pageId === 'home') {
        checkCadastroStatus();
        updateDashboardEstatisticas();
        if (typeof exibirDicaDoDia === 'function') exibirDicaDoDia();
    } else if (pageId === 'perfil') {
        loadPerfil();
    } else if (pageId === 'cadastro') {
        loadCadastroForm();
    } else if (pageId === 'checklist') {
        updateBPFProgress();
        verificarCadastroParaChecklist();
        if (typeof loadHistoricoChecklist === 'function') loadHistoricoChecklist();
    } else if (pageId === 'selos') {
        if (typeof updateSeloRequirements === 'function') {
            updateSeloRequirements().then(() => {
                if (typeof loadSelos === 'function') loadSelos();
            });
        }
    }
}

// Logout consolidado no topo
function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        auth.logout();
        window.location.href = 'apresentacao.html';
    }
}
function formatCPF(cpf) { return formatarCPF(cpf); }
function formatCNPJ(cnpj) { return formatarCNPJ(cnpj); }
function formatTelefone(tel) { return formatarTelefone(tel); }

// Solicitar permissão para notificações
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Permissão de notificação:', permission);
        });
    }
}

// Adicionar máscaras aos campos
document.addEventListener('DOMContentLoaded', function () {
    // Solicitar permissão para notificações
    requestNotificationPermission();

    const cpfInput = document.getElementById('cpf');
    const cnpjInput = document.getElementById('cnpj');
    const telefoneInput = document.getElementById('telefone');
    const form = document.querySelector('form');

    if (cpfInput) {
        cpfInput.addEventListener('input', function (e) {
            e.target.value = formatCPF(e.target.value);
        });
    }

    if (cnpjInput) {
        cnpjInput.addEventListener('input', function (e) {
            e.target.value = formatCNPJ(e.target.value);
        });
    }

    if (telefoneInput) {
        telefoneInput.addEventListener('input', function (e) {
            e.target.value = formatTelefone(e.target.value);
        });
    }

    // Validação do telefone no envio do formulário
    if (form && telefoneInput) {
        form.addEventListener('submit', function (e) {
            const telefoneVal = telefoneInput.value;
            const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
            if (!telefoneRegex.test(telefoneVal)) {
                e.preventDefault();
                telefoneInput.classList.add('input-error');
                alert('Telefone inválido! Use o formato (XX) XXXXX-XXXX.');
                return false;
            } else {
                telefoneInput.classList.remove('input-error');
            }
        });
    }
    // Carregar cadastro existente ao carregar a página
    loadCadastroForm();
});

// Obter geolocalização movida para o final do arquivo

// Carregar dados do cadastro no formulário
function preencherFormularioCadastro(cadastro) {
    if (!cadastro) return;
    // Suporta camelCase (localStorage) e snake_case (API PostgreSQL)
    document.getElementById('nome').value = cadastro.nome || '';
    document.getElementById('cpf').value = cadastro.cpf || '';
    document.getElementById('telefone').value = cadastro.telefone || '';
    document.getElementById('nomeFantasia').value = cadastro.nomeFantasia || cadastro.nome_fantasia || '';
    document.getElementById('cnpj').value = cadastro.cnpj || '';

    // Novos campos de endereço
    const cepInput = document.getElementById('cep');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');

    if (cepInput) cepInput.value = cadastro.cep || '';
    if (cidadeInput) cidadeInput.value = cadastro.cidade || '';
    if (estadoInput) estadoInput.value = cadastro.estado || '';

    document.getElementById('endereco').value = cadastro.endereco || '';
    document.getElementById('alvara').value = cadastro.alvara || '';

    const localizacaoSpan = document.getElementById('localizacao');
    const lat = cadastro.lat || cadastro.latitude;
    const lon = cadastro.lon || cadastro.longitude;
    if (lat && lon) {
        localizacaoSpan.textContent = cadastro.localizacao || `Latitude: ${parseFloat(lat).toFixed(6)}, Longitude: ${parseFloat(lon).toFixed(6)}`;
        localizacaoSpan.dataset.lat = lat;
        localizacaoSpan.dataset.lon = lon;

        // Exibir mapa se houver localização
        const mapaContainer = document.getElementById('mapaLocalizacao');
        if (mapaContainer) {
            mapaContainer.style.display = 'block';

            setTimeout(() => {
                if (!mapaLeaflet) {
                    mapaLeaflet = L.map('mapaLocalizacao').setView([lat, lon], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(mapaLeaflet);
                    marcadorMapa = L.marker([lat, lon]).addTo(mapaLeaflet)
                        .bindPopup('Seu estabelecimento');
                } else {
                    mapaLeaflet.setView([lat, lon], 15);
                    if (marcadorMapa) {
                        marcadorMapa.setLatLng([lat, lon]);
                    }
                }
                mapaLeaflet.invalidateSize();
            }, 100);
        }
    } else if (cadastro.localizacao) {
        localizacaoSpan.textContent = cadastro.localizacao;
    }

    // Carregar foto do alvará se existir
    if (cadastro.alvaraFoto) {
        alvaraFotoBase64 = cadastro.alvaraFoto;
        const alvaraPreview = document.getElementById('alvaraPreview');

        if (alvaraPreview) {
            let previewHTML = `
                <div class="preview-item">
            `;

            if (cadastro.alvaraFoto.startsWith('data:image')) {
                previewHTML += `
                    <img src="${cadastro.alvaraFoto}" alt="Preview do Alvará" class="preview-imagem">
                `;
            } else {
                previewHTML += `
                    <div style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 8px;">
                        <i class="fas fa-file-pdf" style="font-size: 3rem; color: #E74C3C;"></i>
                    </div>
                `;
            }

            previewHTML += `
                    <div class="preview-info">
                        <div class="preview-nome">Alvará anexado anteriormente</div>
                    </div>
                    <button type="button" class="btn-remover-preview" onclick="removerAlvaraFoto()">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            `;

            alvaraPreview.innerHTML = previewHTML;
        }
    }

    // Carregar fotos do estabelecimento se existirem
    if (cadastro.fotosEstabelecimento && Array.isArray(cadastro.fotosEstabelecimento)) {
        fotosEstabelecimento = cadastro.fotosEstabelecimento;
        renderizarFotos();
    }
}

async function loadCadastroForm() {
    // 1. Mostrar cache local imediatamente se existir
    const local = localStorage.getItem('cadastro');
    if (local) {
        try { preencherFormularioCadastro(JSON.parse(local)); } catch (_) { }
    }

    // 2. Buscar da API apenas se autenticado
    if (auth.isAuthenticated()) {
        try {
            const dados = await cadastro.carregar();
            if (dados) preencherFormularioCadastro(dados);
        } catch (e) {
            // silencioso — já preenchido pelo cache acima
        }
    }

    // 3. Inicializar funcionalidades do formulário
    if (typeof inicializarAutoSave === 'function') inicializarAutoSave();
    if (typeof carregarRascunho === 'function') carregarRascunho();
    if (typeof inicializarUploadFotos === 'function') inicializarUploadFotos();
}

// Salvar cadastro
document.addEventListener('DOMContentLoaded', function () {
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async function (e) {
            e.preventDefault();

            const localizacaoSpan = document.getElementById('localizacao');
            const cadastro = {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                telefone: document.getElementById('telefone').value,
                nomeFantasia: document.getElementById('nomeFantasia').value,
                cnpj: document.getElementById('cnpj').value || null,
                cep: document.getElementById('cep')?.value || null,
                endereco: document.getElementById('endereco').value,
                cidade: document.getElementById('cidade')?.value || null,
                estado: document.getElementById('estado')?.value || null,
                alvara: document.getElementById('alvara').value,
                alvaraFoto: alvaraFotoBase64,
                fotosEstabelecimento: fotosEstabelecimento,
                localizacao: localizacaoSpan.textContent,
                lat: localizacaoSpan.dataset.lat || null,
                lon: localizacaoSpan.dataset.lon || null,
                dataCadastro: new Date().toISOString()
            };

            try {
                await cadastro.salvar(cadastro);

                // Limpar rascunho após salvar
                localStorage.removeItem('cadastroRascunho');

                // Registrar no histórico
                if (typeof salvarHistoricoEdicao === 'function') {
                    await salvarHistoricoEdicao('Cadastro atualizado');
                }

                alert('Cadastro salvo com sucesso!');

                // Atualizar requisitos dos selos
                if (typeof updateSeloRequirements === 'function') {
                    await updateSeloRequirements();
                }

                // Voltar para home (checkCadastroStatus será chamado automaticamente)
                showPage('home');
            } catch (err) {
                alert('Erro ao salvar cadastro: ' + err.message);
            }
        });
    }
});

// Carregar perfil
async function loadPerfil() {
    const cadastro = await db.getCadastro();
    const perfilDisplay = document.getElementById('perfilDisplay');

    if (!cadastro) {
        perfilDisplay.innerHTML = `
            <p class="sem-cadastro">Você ainda não completou seu cadastro.</p>
            <button class="btn-primary" onclick="showPage('cadastro')">Completar Cadastro</button>
        `;
        return;
    }

    perfilDisplay.innerHTML = `
        <div class="perfil-campo">
            <strong>Nome:</strong>
            <span>${cadastro.nome}</span>
        </div>
        <div class="perfil-campo">
            <strong>CPF:</strong>
            <span>${cadastro.cpf}</span>
        </div>
        <div class="perfil-campo">
            <strong>Telefone:</strong>
            <span>${cadastro.telefone}</span>
        </div>
        <div class="perfil-campo">
            <strong>Estabelecimento:</strong>
            <span>${cadastro.nomeFantasia || cadastro.nome_fantasia || ''}</span>
        </div>
        ${cadastro.cnpj ? `
        <div class="perfil-campo">
            <strong>CNPJ:</strong>
            <span>${cadastro.cnpj}</span>
        </div>
        ` : ''}
        <div class="perfil-campo">
            <strong>Endereço:</strong>
            <span>${cadastro.endereco}</span>
        </div>
        <div class="perfil-campo">
            <strong>Alvará Sanitário:</strong>
            <span>${cadastro.alvara}</span>
        </div>
        ${cadastro.alvaraFoto ? `
        <div class="perfil-campo">
            <strong>Foto do Alvará:</strong>
            <div style="margin-top: 10px;">
                ${cadastro.alvaraFoto.startsWith('data:image') ?
                `<img src="${cadastro.alvaraFoto}" alt="Alvará Sanitário" style="max-width: 300px; border-radius: 8px; box-shadow: var(--shadow);">` :
                `<a href="${cadastro.alvaraFoto}" target="_blank" class="btn-secondary"><i class="fas fa-file-pdf"></i> Ver Alvará (PDF)</a>`
            }
            </div>
        </div>
        ` : ''}
        ${cadastro.localizacao ? `
        <div class="perfil-campo">
            <strong>Localização:</strong>
            <span>${cadastro.localizacao}</span>
            ${cadastro.lat && cadastro.lon ? `
                <div id="mapaPerfilContainer" style="width: 100%; height: 250px; margin-top: 10px; border-radius: 10px; overflow: hidden;"></div>
                <script>
                    setTimeout(() => {
                        const mapaPerfil = L.map('mapaPerfilContainer').setView([${cadastro.lat}, ${cadastro.lon}], 15);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors'
                        }).addTo(mapaPerfil);
                        L.marker([${cadastro.lat}, ${cadastro.lon}]).addTo(mapaPerfil)
                            .bindPopup('${cadastro.nomeFantasia || cadastro.nome_fantasia || cadastro.nome}')
                            .openPopup();
                    }, 100);
                </script>
            ` : ''}
        </div>
        ` : ''}
        <button class="btn-secondary" onclick="showPage('cadastro')" style="margin-top: 1rem;">
            <i class="fas fa-edit"></i> Editar Cadastro
        </button>
    `;

    // Carregar histórico de edições
    carregarHistoricoEdicoes();
}

// ==================== MÓDULO 2: CALCULADORA DE CLORAÇÃO ====================

// Estado do último cálculo para compartilhamento
let ultimoCalculo = null;

document.addEventListener('DOMContentLoaded', function () {
    const formCalculadora = document.getElementById('formCalculadora');
    if (formCalculadora) {
        formCalculadora.addEventListener('submit', function (e) {
            e.preventDefault();

            const quantidadeAgua = parseFloat(document.getElementById('quantidadeAgua').value);
            const concentracaoCloro = parseFloat(document.getElementById('concentracaoCloro').value);

            // Verificar alerta de concentração
            verificarConcentracao(concentracaoCloro);

            const resultado = calculadora.calcular(quantidadeAgua, concentracaoCloro);

            // Guardar para compartilhamento
            ultimoCalculo = { quantidadeAgua, concentracaoCloro, resultado };

            // Exibir resultado
            const boxResultado = document.getElementById('resultadoCalculadora');
            boxResultado.style.display = 'block';
            document.getElementById('quantidadeCloro').innerHTML = `<span class="valor-num">${resultado}</span> ml`;
            document.getElementById('tempoImersao').textContent = calculadora.getTempoImersao();
            document.getElementById('resultadoAgua').innerHTML = `<i class="fas fa-tint"></i> ${quantidadeAgua} L de água`;
            document.getElementById('resultadoConc').innerHTML = `<i class="fas fa-flask"></i> Hipoclorito ${concentracaoCloro}%`;

            // Salvar no histórico local
            salvarHistoricoCalc(quantidadeAgua, concentracaoCloro, resultado);
            renderizarHistoricoCalc();

            // Salvar cálculo no banco (sem bloquear)
            calculadora.salvarCalculo(quantidadeAgua, concentracaoCloro, resultado);

            // Scroll suave para o resultado
            boxResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Carregar histórico ao entrar na página
    renderizarHistoricoCalc();

    // Inicializar modo escuro se ativo
    if (localStorage.getItem('darkModeCalc') === 'true') {
        aplicarDarkMode(true);
    }
});

// --- Alerta de concentração ---
function verificarConcentracao(valor) {
    const alerta = document.getElementById('alertaConcentracao');
    const msgEl = document.getElementById('alertaConcentracaoMsg');
    if (!alerta || !msgEl) return;

    const conc = parseFloat(valor);
    if (!conc) { alerta.style.display = 'none'; return; }

    if (conc < 2) {
        msgEl.textContent = '⚠️ Concentração abaixo de 2% pode ser insuficiente para higienização eficaz.';
        alerta.className = 'alerta-concentracao alerta-aviso';
        alerta.style.display = 'flex';
    } else if (conc > 12) {
        msgEl.textContent = '🚨 Concentração acima de 12% é perigosa e pode contaminar o alimento!';
        alerta.className = 'alerta-concentracao alerta-perigo';
        alerta.style.display = 'flex';
    } else {
        msgEl.textContent = '✅ Concentração dentro da faixa segura (2% – 12%).';
        alerta.className = 'alerta-concentracao alerta-ok';
        alerta.style.display = 'flex';
    }
}
window.verificarConcentracao = verificarConcentracao;

// --- Histórico local ---
const HIST_KEY = 'historicoCalcCloracao';

function salvarHistoricoCalc(agua, conc, resultado) {
    const historico = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    historico.unshift({
        data: new Date().toISOString(),
        agua,
        conc,
        resultado
    });
    // Manter no máximo 20 registros
    localStorage.setItem(HIST_KEY, JSON.stringify(historico.slice(0, 20)));
}

function renderizarHistoricoCalc() {
    const container = document.getElementById('historicoCalc');
    if (!container) return;

    const historico = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    if (historico.length === 0) {
        container.innerHTML = '<p class="vazio-hist"><i class="fas fa-inbox"></i> Nenhum cálculo salvo ainda.</p>';
        return;
    }

    container.innerHTML = historico.map((item, i) => {
        const data = new Date(item.data);
        const dataStr = `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        return `
            <div class="hist-item" onclick="reaplicarCalc(${i})">
                <div class="hist-item-info">
                    <span class="hist-resultado">${item.resultado} ml</span>
                    <span class="hist-detalhe">${item.agua} L · Hipoclorito ${item.conc}%</span>
                </div>
                <span class="hist-data">${dataStr}</span>
            </div>
        `;
    }).join('');
}

function reaplicarCalc(index) {
    const historico = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
    const item = historico[index];
    if (!item) return;
    const agua = document.getElementById('quantidadeAgua');
    const conc = document.getElementById('concentracaoCloro');
    if (agua) agua.value = item.agua;
    if (conc) conc.value = item.conc;
    verificarConcentracao(item.conc);
    document.getElementById('formCalculadora').requestSubmit?.() || document.getElementById('formCalculadora').dispatchEvent(new Event('submit'));
}
window.reaplicarCalc = reaplicarCalc;

function limparHistoricoCalc() {
    if (!confirm('Deseja apagar todo o histórico de cálculos?')) return;
    localStorage.removeItem(HIST_KEY);
    renderizarHistoricoCalc();
}
window.limparHistoricoCalc = limparHistoricoCalc;

// --- Modo escuro ---
function toggleDarkMode() {
    const ativo = document.body.classList.contains('dark-calc');
    aplicarDarkMode(!ativo);
    localStorage.setItem('darkModeCalc', String(!ativo));
}
window.toggleDarkMode = toggleDarkMode;

function aplicarDarkMode(ativo) {
    const icone = document.getElementById('darkModeIcon');
    if (ativo) {
        document.body.classList.add('dark-calc');
        if (icone) { icone.className = 'fas fa-sun'; }
    } else {
        document.body.classList.remove('dark-calc');
        if (icone) { icone.className = 'fas fa-moon'; }
    }
}

// --- Compartilhamento ---
function montarMensagemCalc() {
    if (!ultimoCalculo) return null;
    const { quantidadeAgua, concentracaoCloro, resultado } = ultimoCalculo;
    return `*Dosagem de Cloração — Açaí Seguro*\n\n` +
        `🌊 Água: ${quantidadeAgua} L\n` +
        `🧪 Hipoclorito ${concentracaoCloro}%\n` +
        `✅ Dosagem: *${resultado} ml*\n` +
        `⏱️ Tempo de imersão: ${calculadora.getTempoImersao()}\n\n` +
        `Calculado pelo app Açaí Seguro.`;
}

function compartilharWhatsApp() {
    const msg = montarMensagemCalc();
    if (!msg) { alert('Faça um cálculo primeiro.'); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
window.compartilharWhatsApp = compartilharWhatsApp;

function compartilharEmail() {
    const msg = montarMensagemCalc();
    if (!msg) { alert('Faça um cálculo primeiro.'); return; }
    const assunto = encodeURIComponent('Dosagem de Cloração — Açaí Seguro');
    const corpo = encodeURIComponent(msg);
    window.open(`mailto:?subject=${assunto}&body=${corpo}`, '_blank');
}
window.compartilharEmail = compartilharEmail;


// ==================== MÓDULO 3: CRONÔMETRO PARA BRANQUEAMENTO ====================

let timerInterval = null;
let timeLeft = 10;
let timerRunning = false;

// Timers específicos para cada etapa
let timers = {}; // { etapaId: { interval: null, timeLeft: number, running: boolean } }

function startTimer(seconds) {
    timeLeft = seconds;
    const timerDisplay = document.getElementById('timerDigital'); // ID correto no modal
    const btn = document.getElementById('timerBtn');
    const modal = document.getElementById('timerModal');

    if (modal) modal.style.display = 'block';
    if (timerDisplay) timerDisplay.textContent = timeLeft;

    clearInterval(timerInterval);
    timerRunning = true;
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pausar';

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerDisplay) timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Iniciar';

            // Feedback visual e sonoro
            const alertBox = document.getElementById('timerAlert');
            if (alertBox) alertBox.style.display = 'block';
            playTimerCompleteSound();
        }
    }, 1000);
}

function toggleTimer() {
    const btn = document.getElementById('timerBtn');
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i> Iniciar';
    } else {
        if (timeLeft <= 0) timeLeft = 10;
        startTimer(timeLeft);
    }
}
window.toggleTimer = toggleTimer;

/**
 * Inicia cronômetro para uma etapa específica
 * @param {number} etapaId - ID da etapa
 * @param {number} seconds - Tempo em segundos
 */
function startTimerForEtapa(etapaId, seconds) {
    const timerDisplay = document.getElementById(`timer-display-${etapaId}`);
    const etapaElement = document.querySelector(`[data-etapa="${etapaId}"]`);

    if (!timerDisplay) return;

    // Limpa timer anterior se existir
    if (timers[etapaId] && timers[etapaId].interval) {
        clearInterval(timers[etapaId].interval);
    }

    // Inicializa o timer
    timers[etapaId] = {
        interval: null,
        timeLeft: seconds,
        totalTime: seconds,
        running: true
    };

    // Remove classes de estado
    timerDisplay.parentElement.classList.remove('timer-completed');
    timerDisplay.parentElement.classList.add('timer-running');

    // Atualiza display
    updateTimerDisplay(etapaId);

    // Inicia contagem
    timers[etapaId].interval = setInterval(() => {
        timers[etapaId].timeLeft--;
        updateTimerDisplay(etapaId);

        if (timers[etapaId].timeLeft <= 0) {
            completeTimer(etapaId);
        }
    }, 1000);
}

/**
 * Atualiza o display do timer no formato MM:SS ou SS
 */
function updateTimerDisplay(etapaId) {
    const timerDisplay = document.getElementById(`timer-display-${etapaId}`);
    if (!timerDisplay || !timers[etapaId]) return;

    const timeLeft = timers[etapaId].timeLeft;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Formata baseado no tempo total
    if (timers[etapaId].totalTime >= 60) {
        // MM:SS para tempos longos
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        // SS para tempos curtos
        timerDisplay.textContent = `${String(seconds).padStart(2, '0')}s`;
    }

    // Alerta visual quando tempo está acabando
    if (timeLeft <= 3 && timeLeft > 0) {
        timerDisplay.style.color = '#E74C3C';
    } else if (timers[etapaId].totalTime >= 60) {
        timerDisplay.style.color = 'var(--primary-color)';
    } else {
        timerDisplay.style.color = 'var(--danger-color)';
    }
}

/**
 * Completa o timer com feedback visual e sonoro
 */
function completeTimer(etapaId) {
    if (!timers[etapaId]) return;

    clearInterval(timers[etapaId].interval);
    timers[etapaId].running = false;

    const timerDisplay = document.getElementById(`timer-display-${etapaId}`);
    const timerContainer = timerDisplay.parentElement;

    timerContainer.classList.remove('timer-running');
    timerContainer.classList.add('timer-completed');
    timerDisplay.style.color = 'var(--accent-color)';

    // Feedback sonoro
    playTimerCompleteSound();

    // Notificação
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Tempo Concluído!', {
            body: `Etapa ${etapaId}: Tempo de processamento finalizado!`,
            icon: 'favicon.ico'
        });
    } else {
        alert(`⏰ Tempo concluído para a etapa ${etapaId}!`);
    }
}

/**
 * Reseta o timer para o valor original
 */
function resetTimer(etapaId) {
    const etapaElement = document.querySelector(`[data-etapa="${etapaId}"]`);
    if (!etapaElement) return;

    const seconds = parseInt(etapaElement.getAttribute('data-tempo')) || 10;

    // Para timer atual
    if (timers[etapaId] && timers[etapaId].interval) {
        clearInterval(timers[etapaId].interval);
    }

    // Reseta estado
    timers[etapaId] = {
        interval: null,
        timeLeft: seconds,
        totalTime: seconds,
        running: false
    };

    // Atualiza display
    const timerDisplay = document.getElementById(`timer-display-${etapaId}`);
    if (timerDisplay) {
        timerDisplay.parentElement.classList.remove('timer-running', 'timer-completed');
        updateTimerDisplay(etapaId);
        timerDisplay.style.color = '';
    }
}

/**
 * Toca som de conclusão do timer
 */
function playTimerCompleteSound() {
    // Cria beep usando Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function closeTimer() {
    clearInterval(timerInterval);
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) timerDisplay.style.display = 'none';
    if (document.getElementById('timerModal')) {
        document.getElementById('timerModal').style.display = 'none';
    }
    timerRunning = false;
    timeLeft = 10;
}

// Expor para o global (caso precise)
window.startTimerForEtapa = startTimerForEtapa;
window.resetTimer = resetTimer;
window.closeTimer = closeTimer;

// ==================== MÓDULO 5: CHECK-LIST BPF ====================

async function verificarCadastroParaChecklist() {
    const cpf = db.getUserCPF();
    const formChecklist = document.getElementById('formChecklist');
    const avisoChecklistDiario = document.getElementById('avisoChecklistDiario');

    if (!cpf || cpf === 'null') {
        // Cadastro incompleto - desabilitar formulário
        if (formChecklist) {
            formChecklist.style.display = 'none';
        }
        if (avisoChecklistDiario) {
            avisoChecklistDiario.style.display = 'block';
            avisoChecklistDiario.className = 'alert alert-warning';
            avisoChecklistDiario.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Cadastro incompleto!</strong>
                <p>Você precisa completar seu cadastro antes de preencher o check-list.</p>
                <button class="btn btn-primary" onclick="showPage('cadastro')" style="margin-top: 10px;">
                    <i class="fas fa-user-edit"></i> Ir para Meu Cadastro
                </button>
            `;
        }
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    const formChecklist = document.getElementById('formChecklist');
    if (formChecklist) {
        formChecklist.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Coletar dados do checklist
            const higiene = Array.from(document.querySelectorAll('input[name="higiene"]:checked')).map(el => el.value);
            const ambiente = Array.from(document.querySelectorAll('input[name="ambiente"]:checked')).map(el => el.value);
            const pragas = Array.from(document.querySelectorAll('input[name="pragas"]:checked')).map(el => el.value);
            const agua = Array.from(document.querySelectorAll('input[name="agua"]:checked')).map(el => el.value);
            const equipamentos = Array.from(document.querySelectorAll('input[name="equipamentos"]:checked')).map(el => el.value);
            const observacoes = document.getElementById('observacoes').value;

            // Calcular conformidade
            const totalItens = 5 + 6 + 4 + 3 + 4; // Total de itens do checklist
            const itensConformes = higiene.length + ambiente.length + pragas.length + agua.length + equipamentos.length;
            const percentualConformidade = ((itensConformes / totalItens) * 100).toFixed(1);

            const checklist = {
                data: new Date().toISOString(),
                higiene: higiene,
                ambiente: ambiente,
                pragas: pragas,
                agua: agua,
                equipamentos: equipamentos,
                observacoes: observacoes,
                itensConformes: itensConformes,
                totalItens: totalItens,
                percentualConformidade: percentualConformidade,
                conforme: percentualConformidade >= 80
            };

            try {
                await db.saveChecklist(checklist);
                alert(`Check-list salvo com sucesso!\nConformidade: ${percentualConformidade}%`);

                // Limpar formulário
                formChecklist.reset();
                updateBPFProgress();

                // Atualizar histórico
                await loadHistoricoChecklist();

                // Atualizar requisitos dos selos
                updateSeloRequirements();

                // Atualizar status resumido
                updateDashboardEstatisticas();

                // Scroll para o histórico
                document.querySelector('.historico-checklist').scrollIntoView({ behavior: 'smooth' });
            } catch (error) {
                console.error('Erro ao salvar check-list:', error);

                if (error.codigo === 'CHECKLIST_DIARIO_JA_PREENCHIDO') {
                    alert('Você já preencheu o check-list de hoje!\n\nO check-list deve ser preenchido uma vez por dia durante 7 dias consecutivos.\n\nVolte amanhã para preencher o próximo check-list.');
                    // Recarregar histórico para atualizar status
                    await loadHistoricoChecklist();
                } else if (error.message && error.message.includes('CPF não encontrado')) {
                    alert('⚠️ Cadastro incompleto!\n\n' + error.message + '\n\nVá para "Meu Cadastro" e complete seus dados antes de preencher o check-list.');
                    showPage('cadastro');
                } else {
                    alert('Erro ao salvar check-list: ' + (error.message || 'Erro desconhecido') + '\n\nPor favor, tente novamente.');
                }
            }
        });
    }
});

async function loadHistoricoChecklist() {
    console.log('loadHistoricoChecklist() - Iniciando...');
    const checklists = await db.getChecklists();
    console.log('loadHistoricoChecklist() - Checklists carregados:', checklists);
    console.log('loadHistoricoChecklist() - Tipo:', typeof checklists);
    console.log('loadHistoricoChecklist() - checklists.data:', checklists.data);
    console.log('loadHistoricoChecklist() - checklists.data.length:', checklists.data ? checklists.data.length : 'N/A');
    console.log('loadHistoricoChecklist() - preenchidoHoje:', checklists.preenchidoHoje);

    const historicoLista = document.getElementById('historicoLista');
    const formChecklist = document.getElementById('formChecklist');
    const avisoChecklistDiario = document.getElementById('avisoChecklistDiario');

    if (!historicoLista) {
        console.log('loadHistoricoChecklist() - Elemento historicoLista não encontrado!');
        return;
    }

    // Verificar se já preencheu hoje (retornado pela API)
    const preenchidoHoje = checklists.preenchidoHoje || false;

    // Controlar visibilidade do formulário e aviso
    if (preenchidoHoje && formChecklist && avisoChecklistDiario) {
        formChecklist.style.display = 'none';
        avisoChecklistDiario.style.display = 'block';
    } else if (formChecklist && avisoChecklistDiario) {
        formChecklist.style.display = 'block';
        avisoChecklistDiario.style.display = 'none';
    }

    const checklistsArray = checklists.data || checklists || [];

    if (checklistsArray.length === 0) {
        historicoLista.innerHTML = '<p class="text-muted">Nenhum check-list salvo ainda.</p>';
        return;
    }

    // Ordenar por data (mais recente primeiro)
    checklistsArray.sort((a, b) => new Date(b.data || b.data_checklist) - new Date(a.data || a.data_checklist));

    // Mostrar últimos 10
    const recent = checklistsArray.slice(0, 10);

    historicoLista.innerHTML = recent.map(check => {
        const data = new Date(check.data || check.data_checklist);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="historico-item ${check.conforme ? 'conforme' : 'nao-conforme'}">
                <strong>${dataFormatada} às ${horaFormatada}</strong>
                <p>Conformidade: ${check.percentualConformidade || check.percentual_conformidade}% (${check.itensConformes || check.itens_conformes}/${check.totalItens || check.total_itens} itens)</p>
                ${check.observacoes ? `<p><em>Obs: ${check.observacoes}</em></p>` : ''}
            </div>
        `;
    }).join('');
}

// ==================== MÓDULO 6: SISTEMA DE SELOS ====================

async function updateSeloRequirements() {
    // Não executar se CPF não estiver definido (usuário sem batedor cadastrado)
    const cpf = db.getUserCPF();
    if (!cpf || cpf === 'null') return;

    const cadastro = await db.getCadastro();
    const checklists7days = await db.getRecentChecklists(7);
    const checklists30days = await db.getRecentChecklists(30);

    console.log('=== Debug Requisitos do Selo ===');
    console.log('CPF:', cpf);
    console.log('Cadastro:', cadastro);
    console.log('Checklists 7 dias:', checklists7days);
    console.log('Checklists 30 dias:', checklists30days);

    // Requisitos Selo Prata
    db.saveRequisitoStatus('prata', 1, !!cadastro);
    db.saveRequisitoStatus('prata', 2, !!(cadastro && cadastro.alvara && cadastro.alvaraFoto));
    db.saveRequisitoStatus('prata', 3, !!(cadastro && cadastro.endereco));
    db.saveRequisitoStatus('prata', 4, checklists7days.length >= 7);
    // Novo requisito: processamento correto
    const processamentoCorreto = db.checkProcessamentoCorreto ? db.checkProcessamentoCorreto() : true;
    db.saveRequisitoStatus('prata', 5, processamentoCorreto);
    db.saveRequisitoStatus('prata', 6, !!(cadastro && cadastro.status_aprovacao === 'aprovado'));

    console.log('Requisito 4 (7 dias):', checklists7days.length >= 7, '(total:', checklists7days.length, ')');

    // Requisitos Selo Ouro
    const prataCompleto = db.getRequisitoStatus('prata', 1) &&
        db.getRequisitoStatus('prata', 2) &&
        db.getRequisitoStatus('prata', 3) &&
        db.getRequisitoStatus('prata', 4) &&
        db.getRequisitoStatus('prata', 5) &&
        db.getRequisitoStatus('prata', 6);

    db.saveRequisitoStatus('ouro', 1, prataCompleto);
    db.saveRequisitoStatus('ouro', 4, checklists30days.length >= 30);

}

async function loadSelos() {
    // Buscar requisitos atualizados da API
    console.log('loadSelos() - Iniciando...');
    await db.getRequisitosFromAPI();
    console.log('loadSelos() - Requisitos atualizados da API');

    // Calcular progresso Selo Prata
    let prataCompletos = 0;
    let prataTotalItens = 5;
    for (let i = 1; i <= prataTotalItens; i++) {
        const status = db.getRequisitoStatus('prata', i);
        console.log(`Requisito Prata ${i}: ${status}`);

        const elemento = document.querySelector(`#requisitosPrata li:nth-child(${i})`);
        if (elemento) {
            elemento.setAttribute('data-completo', status);
            console.log(`→ Elemento Prata ${i} encontrado, data-completo definido: ${status}`);

            // Forçar atualização visual do ícone
            const icone = elemento.querySelector('i');
            if (icone) {
                console.log(`→ Ícone Prata ${i} encontrado, atualizando...`);
                if (status) {
                    icone.className = 'fas fa-check-circle';
                    icone.style.color = '#4CAF50';
                    elemento.style.background = '#E8F5E9';
                    console.log(`→ Prata ${i} VERDE: className="${icone.className}", color="${icone.style.color}"`);
                } else {
                    icone.className = 'fas fa-circle';
                    icone.style.color = '#CCC';
                    elemento.style.background = '#F9F9F9';
                    console.log(`→ Prata ${i} CINZA: className="${icone.className}", color="${icone.style.color}"`);
                }
                console.log(`Requisito ${i} - Status: ${status}, Ícone: ${icone.className}`);
            } else {
                console.log(`→ ERRO: Ícone não encontrado para Prata ${i}`);
            }
        } else {
            console.log(`→ ERRO: Elemento não encontrado para Prata ${i}`);
        }
        if (status) prataCompletos++;
    }

    console.log('Selo Prata - Requisitos completos:', prataCompletos, 'de', prataTotalItens);

    const prataPercent = (prataCompletos / prataTotalItens * 100).toFixed(0);
    console.log('Selo Prata - Calculando porcentagem:', prataCompletos, '/', prataTotalItens, '*', 100, '=', prataPercent);

    const progressoPrataEl = document.getElementById('progressoPrata');
    const textoPrataEl = document.getElementById('textoPrata');

    if (progressoPrataEl) {
        progressoPrataEl.style.width = prataPercent + '%';
        console.log('Selo Prata - Progresso visual atualizado:', prataPercent + '%');
    }

    if (textoPrataEl) {
        textoPrataEl.textContent = `${prataPercent}% completo`;
        console.log('Selo Prata - Texto atualizado:', textoPrataEl.textContent);
    }

    // Calcular progresso Selo Ouro
    let ouroCompletos = 0;
    let ouroTotalItens = 8;
    for (let i = 1; i <= ouroTotalItens; i++) {
        const status = db.getRequisitoStatus('ouro', i);
        const elemento = document.querySelector(`#requisitosOuro li:nth-child(${i})`);
        if (elemento) {
            elemento.setAttribute('data-completo', status);

            // Forçar atualização visual do ícone
            const icone = elemento.querySelector('i');
            if (icone) {
                if (status) {
                    icone.className = 'fas fa-check-circle';
                    icone.style.color = '#4CAF50';
                    elemento.style.background = '#E8F5E9';
                } else {
                    icone.className = 'fas fa-circle';
                    icone.style.color = '#CCC';
                    elemento.style.background = '#F9F9F9';
                }
            }
        }
        if (status) ouroCompletos++;
    }

    console.log('Selo Ouro - Requisitos completos:', ouroCompletos, 'de', ouroTotalItens);

    const ouroPercent = (ouroCompletos / ouroTotalItens * 100).toFixed(0);
    document.getElementById('progressoOuro').style.width = ouroPercent + '%';
    document.getElementById('textoOuro').textContent = `${ouroPercent}% completo`;

    // Verificar se tem selo ativo
    const meuSeloDisplay = document.getElementById('meuSeloDisplay');
    const seloAtual = db.getSelo();

    if (seloAtual && new Date(seloAtual.validade) > new Date()) {
        // Tem selo ativo
        const validadeFormatada = new Date(seloAtual.validade).toLocaleDateString('pt-BR');
        meuSeloDisplay.innerHTML = `
            <div class="selo-badge ${seloAtual.tipo}">
                <i class="fas fa-certificate"></i>
            </div>
            <div class="selo-info">
                <h3>Selo ${seloAtual.tipo === 'prata' ? 'Prata' : 'Ouro'}</h3>
                <p class="selo-validade">Válido até: ${validadeFormatada}</p>
            </div>
        `;
    } else if (prataPercent >= 100) {
        // Pode obter selo prata
        meuSeloDisplay.innerHTML = `
            <p>Parabéns! Você completou todos os requisitos para o Selo Prata!</p>
            <button class="btn-primary" onclick="obterSelo('prata')">
                <i class="fas fa-trophy"></i> Solicitar Selo Prata
            </button>
        `;
    } else if (ouroPercent >= 100) {
        // Pode obter selo ouro
        meuSeloDisplay.innerHTML = `
            <p>Parabéns! Você completou todos os requisitos para o Selo Ouro!</p>
            <button class="btn-primary" onclick="obterSelo('ouro')">
                <i class="fas fa-trophy"></i> Solicitar Selo Ouro
            </button>
        `;
    } else {
        meuSeloDisplay.innerHTML = `
            <p class="text-muted">Complete os requisitos abaixo para obter sua certificação</p>
        `;
    }

    console.log('loadSelos() - CONCLUÍDO!');
}

function obterSelo(tipo) {
    const validadeDate = new Date();
    validadeDate.setFullYear(validadeDate.getFullYear() + 1);

    const selo = {
        tipo: tipo,
        dataEmissao: new Date().toISOString(),
        validade: validadeDate.toISOString()
    };

    db.saveSelo(selo);
    alert(`Parabéns! Seu Selo ${tipo === 'prata' ? 'Prata' : 'Ouro'} foi emitido!\n\nVálido até: ${validadeDate.toLocaleDateString('pt-BR')}\n\nEste selo certifica seu comprometimento com a segurança alimentar e boas práticas de fabricação.`);
    loadSelos();
}

// Invalidar cache automaticamente ao detectar troca de usuário
function verificarTrocaUsuario() {
    const usuarioAtual = localStorage.getItem('usuario');
    const ultimoUsuario = localStorage.getItem('_last_user');

    if (usuarioAtual && ultimoUsuario && usuarioAtual !== ultimoUsuario) {
        // Usuário diferente detectado - limpar dados do usuário anterior
        const keysToKeep = ['usuario'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key) && !key.startsWith('_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🔄 Troca de usuário detectada - cache limpo');
    }

    // Atualizar marcador do último usuário
    if (usuarioAtual) {
        localStorage.setItem('_last_user', usuarioAtual);
    }
}

// Verificar cadastro e exibir banner na home
async function checkCadastroStatus() {
    const banner = document.getElementById('banner-cadastro');
    const cardIcon = document.getElementById('card-cadastro-icon');
    const cardTitulo = document.getElementById('card-cadastro-titulo');
    const cardDesc = document.getElementById('card-cadastro-desc');

    const cpf = db.getUserCPF();
    let temCadastro = false;
    if (cpf && cpf !== 'null') {
        const cadastro = await db.getCadastro();
        temCadastro = !!cadastro;
    }

    if (banner) banner.style.display = temCadastro ? 'none' : 'flex';

    // Atualizar card dinamicamente
    if (cardIcon && cardTitulo && cardDesc) {
        if (temCadastro) {
            cardIcon.className = 'fas fa-user-edit';
            cardTitulo.textContent = 'Editar Cadastro';
            cardDesc.textContent = 'Atualize seus dados e estabelecimento';
        } else {
            cardIcon.className = 'fas fa-user-plus';
            cardTitulo.textContent = 'Completar Cadastro';
            cardDesc.textContent = 'Registre seus dados e estabelecimento';
        }
    }
}

// ==================== FUNCIONALIDADES ADICIONAIS ====================

// Busca rápida de módulos
function buscarModulos() {
    const input = document.getElementById('buscaModulos');
    const filtro = input.value.toLowerCase();
    const cards = document.querySelectorAll('.modulo-card');

    cards.forEach(card => {
        const titulo = card.querySelector('h3').textContent.toLowerCase();
        const descricao = card.querySelector('p').textContent.toLowerCase();

        if (titulo.includes(filtro) || descricao.includes(filtro)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// Atualizar status resumido na home
async function updateDashboardEstatisticas() {
    const statusDiv = document.getElementById('statusResumo');
    const cpf = db.getUserCPF();

    if (!cpf || cpf === 'null') {
        if (statusDiv) statusDiv.style.display = 'none';
        return;
    }

    try {
        // Buscar checklists dos últimos 7 dias
        const checklists7dias = await db.getRecentChecklists(7);
        const checklists30dias = await db.getRecentChecklists(30);

        // Atualizar check-lists
        const statusChecklists = document.getElementById('statusChecklists');
        if (statusChecklists) {
            const diasConsecutivos = calcularDiasConsecutivos(checklists7dias);
            statusChecklists.textContent = `${diasConsecutivos}/7 dias`;

            // Mudar cor baseado no progresso
            const statusItem = statusChecklists.closest('.status-item');
            if (diasConsecutivos >= 7) {
                statusItem.style.borderLeft = '4px solid #27AE60';
            } else if (diasConsecutivos >= 4) {
                statusItem.style.borderLeft = '4px solid #F39C12';
            } else {
                statusItem.style.borderLeft = '4px solid #E74C3C';
            }
        }

        // Atualizar selo atual
        const seloAtual = db.getSelo();
        const statusSelo = document.getElementById('statusSelo');
        const statusSeloDesc = document.getElementById('statusSeloDesc');

        if (seloAtual && new Date(seloAtual.validade) > new Date()) {
            const tipoNome = seloAtual.tipo === 'prata' ? 'Prata' : 'Ouro';
            if (statusSelo) statusSelo.textContent = `Selo ${tipoNome}`;
            if (statusSeloDesc) {
                const validade = new Date(seloAtual.validade);
                const diasRestantes = Math.ceil((validade - new Date()) / (1000 * 60 * 60 * 24));
                statusSeloDesc.textContent = `Válido por ${diasRestantes} dias`;
            }
        } else {
            if (statusSelo) statusSelo.textContent = 'Nenhum';
            if (statusSeloDesc) statusSeloDesc.textContent = 'Complete os requisitos';
        }

        // Atualizar progresso
        const prataCompletos = [1, 2, 3, 4, 5].filter(i => db.getRequisitoStatus('prata', i)).length;
        const prataPercent = Math.round((prataCompletos / 5) * 100);

        const statusProgresso = document.getElementById('statusProgresso');
        if (statusProgresso) {
            statusProgresso.textContent = `${prataPercent}%`;
        }

        // Mostrar status resumido
        if (statusDiv) statusDiv.style.display = 'block';

        // Verificar notificações de selo
        verificarNotificacaoSelo(seloAtual);

    } catch (error) {
        console.error('Erro ao atualizar status resumido:', error);
    }
}

// Calcular dias consecutivos de check-lists
function calcularDiasConsecutivos(checklists) {
    if (!checklists || checklists.length === 0) return 0;

    // Ordenar por data decrescente
    const ordenados = checklists.sort((a, b) => {
        const dataA = new Date(a.data_checklist || a.data);
        const dataB = new Date(b.data_checklist || b.data);
        return dataB - dataA;
    });

    let consecutivos = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (let i = 0; i < ordenados.length; i++) {
        const dataCheck = new Date(ordenados[i].data_checklist || ordenados[i].data);
        dataCheck.setHours(0, 0, 0, 0);

        const diferencaDias = Math.floor((hoje - dataCheck) / (1000 * 60 * 60 * 24));

        if (diferencaDias === consecutivos) {
            consecutivos++;
        } else {
            break;
        }
    }

    return consecutivos;
}

// Verificar e exibir notificação de selo próximo de vencer
function verificarNotificacaoSelo(seloAtual) {
    const notificacaoDiv = document.getElementById('notificacaoSelo');
    const notificacaoTexto = document.getElementById('notificacaoTexto');

    if (!seloAtual || !notificacaoDiv || !notificacaoTexto) return;

    const validade = new Date(seloAtual.validade);
    const hoje = new Date();
    const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes <= 30 && diasRestantes > 0) {
        const tipoNome = seloAtual.tipo === 'prata' ? 'Prata' : 'Ouro';
        notificacaoTexto.textContent = `Seu Selo ${tipoNome} vence em ${diasRestantes} dias. Renove para manter sua certificação!`;
        notificacaoDiv.style.display = 'flex';
    } else if (diasRestantes <= 0) {
        const tipoNome = seloAtual.tipo === 'prata' ? 'Prata' : 'Ouro';
        notificacaoTexto.textContent = `Seu Selo ${tipoNome} expirou! Solicite uma renovação.`;
        notificacaoDiv.style.display = 'flex';
    } else {
        notificacaoDiv.style.display = 'none';
    }
}

// Sistema de dicas do dia
const dicasDoDia = [
    "Sempre lave as mãos antes de iniciar o processamento do açaí.",
    "Utilize apenas água potável em todas as etapas do processo.",
    "Mantenha os utensílios limpos e desinfetados diariamente.",
    "Armazene o açaí congelado em temperaturas abaixo de -18°C.",
    "Separe utensílios para açaí cru e processado para evitar contaminação cruzada.",
    "Verifique sempre a procedência dos frutos de açaí antes de comprar.",
    "Use luvas descartáveis durante todo o processo de manipulação.",
    "Limpe e desinfete as superfícies de trabalho antes e depois do uso.",
    "Descarte imediatamente frutos com sinais de deterioração ou insetos.",
    "Mantenha o ambiente de trabalho bem ventilado e iluminado.",
    "Faça a sanitização do batedor diariamente com solução clorada.",
    "Armazene os ingredientes em recipientes fechados e identificados.",
    "Controle a temperatura do açaí durante todo o processamento.",
    "Use água clorada na lavagem dos frutos (mínimo 50 ppm de cloro residual livre).",
    "Complete o check-list de BPF todos os dias para manter seu selo ativo."
];

function exibirDicaDoDia() {
    const dicaTexto = document.getElementById('dicaTexto');
    if (!dicaTexto) return;

    // Usar o dia do ano para ter uma dica diferente por dia
    const hoje = new Date();
    const inicioDonAno = new Date(hoje.getFullYear(), 0, 0);
    const diff = hoje - inicioDonAno;
    const diaDoAno = Math.floor(diff / (1000 * 60 * 60 * 24));

    const indiceDica = diaDoAno % dicasDoDia.length;
    dicaTexto.textContent = dicasDoDia[indiceDica];
}

// Inicializar aplicativo
document.addEventListener('DOMContentLoaded', function () {
    // Verificar troca de usuário e invalidar cache se necessário
    verificarTrocaUsuario();

    // Só atualiza requisitos se houver CPF cadastrado
    const cpf = db.getUserCPF();
    if (cpf && cpf !== 'null') {
        updateSeloRequirements();
        updateDashboardEstatisticas();
    }

    checkCadastroStatus();
    exibirDicaDoDia();

    // Inicializar validações e eventos dos novos campos
    inicializarValidacoes();
    inicializarUploadAlvara();
});

// ==================== VALIDAÇÃO DE CPF/CNPJ EM TEMPO REAL ====================

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
}

function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Validar primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    // Validar segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
}

// Formatação via utils.js

function inicializarValidacoes() {
    const cpfInput = document.getElementById('cpf');
    const cnpjInput = document.getElementById('cnpj');
    const cpfFeedback = document.getElementById('cpfFeedback');
    const cnpjFeedback = document.getElementById('cnpjFeedback');

    if (cpfInput && cpfFeedback) {
        cpfInput.addEventListener('input', function (e) {
            // Formatar CPF
            e.target.value = formatarCPF(e.target.value);

            const cpf = e.target.value.replace(/\D/g, '');

            if (cpf.length === 0) {
                cpfFeedback.textContent = '';
                cpfFeedback.className = 'validacao-feedback';
                e.target.classList.remove('valido', 'invalido');
                e.target.setCustomValidity('');
            } else if (cpf.length === 11) {
                if (validarCPF(cpf)) {
                    cpfFeedback.textContent = '✓ CPF válido';
                    cpfFeedback.className = 'validacao-feedback valido';
                    e.target.classList.add('valido');
                    e.target.classList.remove('invalido');
                    e.target.setCustomValidity('');
                } else {
                    cpfFeedback.textContent = '✗ CPF inválido';
                    cpfFeedback.className = 'validacao-feedback invalido';
                    e.target.classList.add('invalido');
                    e.target.classList.remove('valido');
                    e.target.setCustomValidity('CPF inválido');
                }
            } else {
                cpfFeedback.textContent = 'Digite 11 dígitos';
                cpfFeedback.className = 'validacao-feedback';
                e.target.classList.remove('valido', 'invalido');
                e.target.setCustomValidity('');
            }
        });
    }

    if (cnpjInput && cnpjFeedback) {
        cnpjInput.addEventListener('input', function (e) {
            // Formatar CNPJ
            e.target.value = formatarCNPJ(e.target.value);

            const cnpj = e.target.value.replace(/\D/g, '');

            if (cnpj.length === 0) {
                cnpjFeedback.textContent = '';
                cnpjFeedback.className = 'validacao-feedback';
                e.target.classList.remove('valido', 'invalido');
                e.target.setCustomValidity('');
            } else if (cnpj.length === 14) {
                if (validarCNPJ(cnpj)) {
                    cnpjFeedback.textContent = '✓ CNPJ válido';
                    cnpjFeedback.className = 'validacao-feedback valido';
                    e.target.classList.add('valido');
                    e.target.classList.remove('invalido');
                    e.target.setCustomValidity('');
                } else {
                    cnpjFeedback.textContent = '✗ CNPJ inválido';
                    cnpjFeedback.className = 'validacao-feedback invalido';
                    e.target.classList.add('invalido');
                    e.target.classList.remove('valido');
                    e.target.setCustomValidity('CNPJ inválido');
                }
            } else {
                cnpjFeedback.textContent = 'Digite 14 dígitos';
                cnpjFeedback.className = 'validacao-feedback';
                e.target.classList.remove('valido', 'invalido');
                e.target.setCustomValidity('');
            }
        });
    }
}

// ==================== UPLOAD DE FOTO DO ALVARÁ COM PREVIEW ====================

let alvaraFotoBase64 = null;

function inicializarUploadAlvara() {
    const alvaraFotoInput = document.getElementById('alvaraFoto');
    const alvaraPreview = document.getElementById('alvaraPreview');

    if (alvaraFotoInput && alvaraPreview) {
        alvaraFotoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];

            if (!file) {
                alvaraPreview.innerHTML = '';
                alvaraFotoBase64 = null;
                return;
            }

            // Verificar tipo de arquivo
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!tiposPermitidos.includes(file.type)) {
                alert('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.');
                e.target.value = '';
                return;
            }

            // Verificar tamanho (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande. O tamanho máximo é 5MB.');
                e.target.value = '';
                return;
            }

            // Converter para Base64
            const reader = new FileReader();
            reader.onload = function (event) {
                alvaraFotoBase64 = event.target.result;

                // Exibir preview
                const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);

                let previewHTML = `
                    <div class="preview-item">
                `;

                if (file.type.startsWith('image/')) {
                    previewHTML += `
                        <img src="${alvaraFotoBase64}" alt="Preview do Alvará" class="preview-imagem">
                    `;
                } else {
                    previewHTML += `
                        <div style="width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 8px;">
                            <i class="fas fa-file-pdf" style="font-size: 3rem; color: #E74C3C;"></i>
                        </div>
                    `;
                }

                previewHTML += `
                        <div class="preview-info">
                            <div class="preview-nome">${file.name}</div>
                            <div class="preview-tamanho">${tamanhoMB} MB</div>
                        </div>
                        <button type="button" class="btn-remover-preview" onclick="removerAlvaraFoto()">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                `;

                alvaraPreview.innerHTML = previewHTML;
            };

            reader.readAsDataURL(file);
        });
    }
}

function removerAlvaraFoto() {
    const alvaraFotoInput = document.getElementById('alvaraFoto');
    const alvaraPreview = document.getElementById('alvaraPreview');

    alvaraFotoInput.value = '';
    alvaraPreview.innerHTML = '';
    alvaraFotoBase64 = null;
}

// ==================== HISTÓRICO DE EDIÇÕES ====================

async function salvarHistoricoEdicao(acao) {
    const historico = JSON.parse(localStorage.getItem('historicoEdicoes') || '[]');

    const novaEdicao = {
        data: new Date().toISOString(),
        acao: acao,
        usuario: db.getUserCPF()
    };

    historico.unshift(novaEdicao); // Adicionar no início

    // Manter apenas as últimas 20 edições
    if (historico.length > 20) {
        historico.splice(20);
    }

    localStorage.setItem('historicoEdicoes', JSON.stringify(historico));
}

function carregarHistoricoEdicoes() {
    const historico = JSON.parse(localStorage.getItem('historicoEdicoes') || '[]');
    const historicoSecao = document.getElementById('historicoEdicoes');
    const historicoLista = document.getElementById('historicoLista');

    if (historico.length === 0) {
        historicoSecao.style.display = 'none';
        return;
    }

    historicoSecao.style.display = 'block';

    historicoLista.innerHTML = historico.map(item => {
        const data = new Date(item.data);
        const dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR');

        return `
            <div class="historico-item">
                <div class="historico-data">${dataFormatada}</div>
                <div class="historico-acao">${item.acao}</div>
            </div>
        `;
    }).join('');
}

// ==================== MAPA INTERATIVO ====================

let mapaLeaflet = null;
let marcadorMapa = null;

function getLocation() {
    const localizacaoSpan = document.getElementById('localizacao');
    const mapaContainer = document.getElementById('mapaLocalizacao');

    if (navigator.geolocation) {
        localizacaoSpan.textContent = 'Obtendo localização...';

        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                localizacaoSpan.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
                localizacaoSpan.dataset.lat = lat;
                localizacaoSpan.dataset.lon = lon;

                // Exibir mapa
                mapaContainer.style.display = 'block';

                // Inicializar mapa se ainda não foi criado
                if (!mapaLeaflet) {
                    mapaLeaflet = L.map('mapaLocalizacao').setView([lat, lon], 15);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(mapaLeaflet);

                    marcadorMapa = L.marker([lat, lon]).addTo(mapaLeaflet)
                        .bindPopup('Seu estabelecimento')
                        .openPopup();
                } else {
                    // Atualizar posição
                    mapaLeaflet.setView([lat, lon], 15);
                    if (marcadorMapa) {
                        marcadorMapa.setLatLng([lat, lon]);
                    } else {
                        marcadorMapa = L.marker([lat, lon]).addTo(mapaLeaflet)
                            .bindPopup('Seu estabelecimento')
                            .openPopup();
                    }
                }

                // Forçar o mapa a renderizar corretamente
                setTimeout(() => {
                    mapaLeaflet.invalidateSize();
                }, 100);
            },
            function (error) {
                localizacaoSpan.textContent = 'Erro ao obter localização: ' + error.message;
            }
        );
    } else {
        localizacaoSpan.textContent = 'Geolocalização não suportada pelo navegador';
    }
}

// ==================== EXPORTAR PERFIL EM PDF ====================

async function exportarPerfilPDF() {
    const cadastro = await db.getCadastro();

    if (!cadastro) {
        alert('Você precisa completar seu cadastro primeiro.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFillColor(107, 35, 142);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Açaí Seguro', 20, 20);

    doc.setFontSize(12);
    doc.text('Sistema de Gestão para Batedores de Açaí Artesanal', 20, 30);

    // Conteúdo
    doc.setTextColor(0, 0, 0);
    let y = 55;

    doc.setFontSize(16);
    doc.setTextColor(107, 35, 142);
    doc.text('Perfil do Batedor', 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Dados Pessoais
    doc.setFont(undefined, 'bold');
    doc.text('Dados Pessoais', 20, y);
    y += 7;
    doc.setFont(undefined, 'normal');

    doc.text(`Nome: ${cadastro.nome}`, 25, y);
    y += 7;
    doc.text(`CPF: ${cadastro.cpf}`, 25, y);
    y += 7;
    doc.text(`Telefone: ${cadastro.telefone}`, 25, y);
    y += 10;

    // Dados do Estabelecimento
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Estabelecimento', 20, y);
    y += 7;
    doc.setFont(undefined, 'normal');

    doc.text(`Nome Fantasia: ${cadastro.nomeFantasia || cadastro.nome_fantasia || ''}`, 25, y);
    y += 7;

    if (cadastro.cnpj) {
        doc.text(`CNPJ: ${cadastro.cnpj}`, 25, y);
        y += 7;
    }

    doc.text(`Endereço: ${cadastro.endereco}`, 25, y);
    y += 7;
    doc.text(`Alvará Sanitário: ${cadastro.alvara}`, 25, y);
    y += 7;

    if (cadastro.localizacao) {
        doc.text(`Localização: ${cadastro.localizacao}`, 25, y);
        y += 7;
    }

    // Buscar informações de selos
    try {
        const cpfLimpo = cadastro.cpf.replace(/\D/g, '');
        const response = await fetch(`http://localhost:3000/api/requisitos/${cpfLimpo}`);

        if (response.ok) {
            const data = await response.json();

            y += 5;
            doc.setFont(undefined, 'bold');
            doc.text('Status dos Selos', 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');

            const selos = ['prata', 'ouro', 'diamante'];
            const nomeSelos = { 'prata': 'Prata', 'ouro': 'Ouro', 'diamante': 'Diamante' };

            selos.forEach(selo => {
                const status = data[`selo_${selo}`] ? 'Conquistado' : 'Não conquistado';
                doc.text(`Selo ${nomeSelos[selo]}: ${status}`, 25, y);
                y += 7;
            });
        }
    } catch (error) {
        console.error('Erro ao buscar informações de selos:', error);
    }

    // Rodapé
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 280);

    // Salvar PDF
    doc.save(`perfil_acai_seguro_${cadastro.cpf.replace(/\D/g, '')}.pdf`);

    // Registrar no histórico
    await salvarHistoricoEdicao('Perfil exportado em PDF');
}
// ==================== NAVEGAÇÃO ENTRE STEPS DO FORMULÁRIO ====================

let currentStep = 1;

function nextStep(stepNumber) {
    // Validar campos obrigatórios do step atual
    const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredInputs = currentFormStep.querySelectorAll('input[required], select[required]');

    let allValid = true;
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger-color)';
            allValid = false;
        } else {
            input.style.borderColor = '';
        }
    });

    if (!allValid) {
        alert('Por favor, preencha todos os campos obrigatórios antes de continuar.');
        return;
    }

    // Ocultar step atual
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Mostrar próximo step
    const nextFormStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (nextFormStep) {
        nextFormStep.classList.add('active');
    }

    // Atualizar indicadores de progresso
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNum === stepNumber) {
            step.classList.add('active');
        } else if (stepNum < stepNumber) {
            step.classList.add('completed');
        }
    });

    currentStep = stepNumber;

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(stepNumber) {
    nextStep(stepNumber);
}

// ==================== SALVAMENTO AUTOMÁTICO COM DEBOUNCE ====================

let autoSaveTimeout;
let dadosFormulario = {};

function inicializarAutoSave() {
    const campos = [
        'nome', 'cpf', 'telefone', 'nomeFantasia', 'cnpj',
        'cep', 'endereco', 'cidade', 'estado', 'alvara'
    ];

    campos.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('input', function () {
                clearTimeout(autoSaveTimeout);

                const indicator = document.getElementById('autoSaveIndicator');
                if (indicator) {
                    indicator.style.display = 'flex';
                }

                autoSaveTimeout = setTimeout(async () => {
                    await salvarRascunho();

                    if (indicator) {
                        indicator.innerHTML = '<i class="fas fa-check"></i> Salvo automaticamente';
                        setTimeout(() => {
                            indicator.style.display = 'none';
                            indicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Salvando automaticamente...';
                        }, 2000);
                    }
                }, 2000); // 2 segundos de debounce
            });
        }
    });
}

async function salvarRascunho() {
    const rascunho = {
        nome: document.getElementById('nome')?.value || '',
        cpf: document.getElementById('cpf')?.value || '',
        telefone: document.getElementById('telefone')?.value || '',
        nomeFantasia: document.getElementById('nomeFantasia')?.value || '',
        cnpj: document.getElementById('cnpj')?.value || '',
        cep: document.getElementById('cep')?.value || '',
        endereco: document.getElementById('endereco')?.value || '',
        cidade: document.getElementById('cidade')?.value || '',
        estado: document.getElementById('estado')?.value || '',
        alvara: document.getElementById('alvara')?.value || '',
        ultimaAtualizacao: new Date().toISOString()
    };

    localStorage.setItem('cadastroRascunho', JSON.stringify(rascunho));
}

function carregarRascunho() {
    const rascunho = localStorage.getItem('cadastroRascunho');

    if (rascunho) {
        const dados = JSON.parse(rascunho);

        // Verificar se o rascunho é recente (menos de 7 dias)
        const dataRascunho = new Date(dados.ultimaAtualizacao);
        const diasDiferenca = (new Date() - dataRascunho) / (1000 * 60 * 60 * 24);

        if (diasDiferenca < 7) {
            // Perguntar ao usuário se deseja carregar o rascunho
            if (confirm('Encontramos um rascunho salvo automaticamente. Deseja continuar de onde parou?')) {
                Object.keys(dados).forEach(key => {
                    if (key !== 'ultimaAtualizacao') {
                        const input = document.getElementById(key);
                        if (input && dados[key]) {
                            input.value = dados[key];
                        }
                    }
                });
            }
        } else {
            // Remover rascunho antigo
            localStorage.removeItem('cadastroRascunho');
        }
    }
}

// ==================== INTEGRAÇÃO COM API VIACEP ====================

function formatarCEP(valor) {
    valor = valor.replace(/\D/g, '');
    valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
    return valor;
}

async function buscarCEP() {
    const cepInput = document.getElementById('cep');
    const cepFeedback = document.getElementById('cepFeedback');
    const enderecoInput = document.getElementById('endereco');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');

    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        cepFeedback.textContent = 'CEP deve ter 8 dígitos';
        cepFeedback.className = 'validacao-feedback invalido';
        return;
    }

    cepFeedback.textContent = 'Buscando CEP...';
    cepFeedback.className = 'validacao-feedback';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            cepFeedback.textContent = '✗ CEP não encontrado';
            cepFeedback.className = 'validacao-feedback invalido';
            return;
        }

        // Preencher campos automaticamente
        enderecoInput.value = `${data.logradouro}, ${data.bairro}`;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;

        cepFeedback.textContent = '✓ CEP encontrado';
        cepFeedback.className = 'validacao-feedback valido';

        // Focar no campo de número/complemento
        enderecoInput.focus();

    } catch (error) {
        cepFeedback.textContent = '✗ Erro ao buscar CEP. Tente novamente.';
        cepFeedback.className = 'validacao-feedback invalido';
        console.error('Erro ao buscar CEP:', error);
    }
}

// Formatação automática do CEP
document.addEventListener('DOMContentLoaded', function () {
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function (e) {
            e.target.value = formatarCEP(e.target.value);
        });

        // Buscar automaticamente ao digitar 8 dígitos
        cepInput.addEventListener('blur', function () {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarCEP();
            }
        });
    }
});

// ==================== UPLOAD DE MÚLTIPLAS FOTOS DO ESTABELECIMENTO ====================

let fotosEstabelecimento = [];

function inicializarUploadFotos() {
    const fotosInput = document.getElementById('fotosEstabelecimento');
    const fotosPreview = document.getElementById('fotosPreview');

    if (fotosInput && fotosPreview) {
        fotosInput.addEventListener('change', function (e) {
            const files = Array.from(e.target.files);

            // Limitar a 5 fotos
            if (fotosEstabelecimento.length + files.length > 5) {
                alert('Você pode adicionar no máximo 5 fotos do estabelecimento.');
                return;
            }

            files.forEach(file => {
                // Verificar tipo
                if (!file.type.startsWith('image/')) {
                    alert('Apenas imagens são permitidas.');
                    return;
                }

                // Verificar tamanho (máximo 3MB por foto)
                if (file.size > 3 * 1024 * 1024) {
                    alert(`A foto ${file.name} é muito grande. Tamanho máximo: 3MB.`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    const fotoData = {
                        nome: file.name,
                        base64: event.target.result,
                        tamanho: file.size
                    };

                    fotosEstabelecimento.push(fotoData);
                    renderizarFotos();
                };

                reader.readAsDataURL(file);
            });

            // Limpar input
            e.target.value = '';
        });
    }
}

function renderizarFotos() {
    const fotosPreview = document.getElementById('fotosPreview');

    if (!fotosPreview) return;

    fotosPreview.innerHTML = fotosEstabelecimento.map((foto, index) => `
        <div class="foto-item">
            <img src="${foto.base64}" alt="${foto.nome}">
            <button type="button" class="foto-item-remove" onclick="removerFoto(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removerFoto(index) {
    fotosEstabelecimento.splice(index, 1);
    renderizarFotos();
}

// Chamar renderização inicial
renderizarFotos();

// Adicionar inicializações quando a página de cadastro for carregada
// (as funções inicializarAutoSave, carregarRascunho e inicializarUploadFotos serão chamadas em loadCadastroForm)
// Adicionar inicializações quando a página de cadastro for carregada
// (as funções inicializarAutoSave, carregarRascunho e inicializarUploadFotos serão chamadas em loadCadastroForm)

// ==================== MÓDULO ETAPAS: CHECKLIST E MODO PASSO A PASSO ====================

// Estado do modo passo a passo
let stepByStepMode = false;
let currentEtapa = 1;
const totalEtapas = 8;

// Estado dos checklists (armazenado em localStorage)
let checklistState = {};

/**
 * Inicializa o estado dos checklists do localStorage
 */
function initChecklistState() {
    const saved = localStorage.getItem('etapasChecklistState');
    if (saved) {
        try {
            checklistState = JSON.parse(saved);
        } catch (e) {
            checklistState = {};
        }
    }

    // Restaura checkboxes salvos
    restoreChecklistState();
}

/**
 * Restaura o estado dos checkboxes
 */
function restoreChecklistState() {
    // Restaura checklists individuais
    for (let i = 1; i <= totalEtapas; i++) {
        for (let j = 1; j <= 10; j++) {
            const checkbox = document.getElementById(`check-${i}-${j}`);
            if (checkbox) {
                const key = `etapa-${i}-${j}`;
                checkbox.checked = checklistState[key] || false;
            }
        }
    }

    // Restaura conclusão das etapas
    for (let i = 1; i <= totalEtapas; i++) {
        const checkbox = document.getElementById(`check-etapa-${i}`);
        if (checkbox) {
            const key = `etapa-concluida-${i}`;
            checkbox.checked = checklistState[key] || false;
            updateEtapaStyle(i);
        }
    }

    updateProgresso();
}

/**
 * Salva o estado atual no localStorage
 */
function saveChecklistState() {
    localStorage.setItem('etapasChecklistState', JSON.stringify(checklistState));
}

/**
 * Atualiza o estado de um item do checklist
 */
function updateChecklistItem(etapaId, itemId, checked) {
    const key = `etapa-${etapaId}-${itemId}`;
    checklistState[key] = checked;

    // Verifica se todos os itens da etapa estão marcados
    checkAllItemsInEtapa(etapaId);

    saveChecklistState();
    updateProgresso();
}

/**
 * Verifica se todos os itens de uma etapa estão marcados
 */
function checkAllItemsInEtapa(etapaId) {
    let allChecked = true;
    let hasItems = false;

    for (let j = 1; j <= 10; j++) {
        const checkbox = document.getElementById(`check-${etapaId}-${j}`);
        if (checkbox) {
            hasItems = true;
            if (!checkbox.checked) {
                allChecked = false;
            }
        }
    }

    // Marca automaticamente a etapa como concluída se todos os itens estiverem marcados
    if (hasItems && allChecked) {
        const etapaCheckbox = document.getElementById(`check-etapa-${etapaId}`);
        if (etapaCheckbox) {
            etapaCheckbox.checked = true;
            checklistState[`etapa-concluida-${etapaId}`] = true;
            updateEtapaStyle(etapaId);
        }
    }
}

/**
 * Alterna o estado de conclusão de uma etapa
 */
function toggleEtapaConcluida(etapaId) {
    const checkbox = document.getElementById(`check-etapa-${etapaId}`);
    const key = `etapa-concluida-${etapaId}`;
    checklistState[key] = checkbox.checked;

    updateEtapaStyle(etapaId);
    saveChecklistState();
    updateProgresso();

    // Atualiza indicador no modo passo a passo
    if (stepByStepMode) {
        updateStepIndicators();
    }
}

/**
 * Atualiza o estilo visual da etapa
 */
function updateEtapaStyle(etapaId) {
    const etapaElement = document.querySelector(`[data-etapa="${etapaId}"]`);
    const checkbox = document.getElementById(`check-etapa-${etapaId}`);

    if (etapaElement && checkbox) {
        if (checkbox.checked) {
            etapaElement.classList.add('etapa-concluida');
        } else {
            etapaElement.classList.remove('etapa-concluida');
        }
    }
}

/**
 * Atualiza a barra de progresso geral
 */
function updateProgresso() {
    let totalChecks = 0;
    let checkedCount = 0;

    // Conta todos os checkboxes de checklist
    for (let i = 1; i <= totalEtapas; i++) {
        for (let j = 1; j <= 10; j++) {
            const checkbox = document.getElementById(`check-${i}-${j}`);
            if (checkbox) {
                totalChecks++;
                if (checkbox.checked) {
                    checkedCount++;
                }
            }
        }
    }

    // Calcula porcentagem
    const percentage = totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;

    // Atualiza display
    const progressoFill = document.getElementById('progressoFill');
    const progressoPercentual = document.getElementById('progressoPercentual');

    if (progressoFill) {
        progressoFill.style.width = `${percentage}%`;
    }

    if (progressoPercentual) {
        progressoPercentual.textContent = `${percentage}%`;
    }
}

/**
 * Reinicia todos os checklists
 */
function resetAllChecklists() {
    if (!confirm('Tem certeza que deseja reiniciar todos os checklists?')) {
        return;
    }

    // Limpa estado
    checklistState = {};
    localStorage.removeItem('etapasChecklistState');

    // Reseta checkboxes
    document.querySelectorAll('.checklist-check').forEach(cb => {
        cb.checked = false;
    });

    document.querySelectorAll('.check-etapa-concluida').forEach(cb => {
        cb.checked = false;
    });

    // Reseta estilos
    document.querySelectorAll('.etapa').forEach(etapa => {
        etapa.classList.remove('etapa-concluida');
    });

    // Reseta timers
    for (let i = 1; i <= totalEtapas; i++) {
        resetTimer(i);
    }

    // Reseta checkboxes de BPF
    const bpfForm = document.getElementById('formChecklist');
    if (bpfForm) bpfForm.reset();

    updateProgresso();
    updateBPFProgress();

    if (stepByStepMode) {
        goToEtapa(1);
    }
}

/**
 * Alterna o modo passo a passo
 */
function toggleStepByStepMode() {
    stepByStepMode = !stepByStepMode;

    const nav = document.getElementById('stepByStepNav');
    const stepModeText = document.getElementById('stepModeText');
    const etapasContainer = document.getElementById('etapasContainer');

    if (stepByStepMode) {
        // Ativa modo passo a passo
        if (nav) nav.style.display = 'flex';
        if (stepModeText) stepModeText.textContent = 'Sair do Modo Passo a Passo';

        // Inicializa indicadores
        initStepIndicators();

        // Vai para primeira etapa não concluída
        goToFirstIncompleteEtapa();

        // Adiciona padding ao container para não ficar escondido atrás da nav
        if (etapasContainer) {
            etapasContainer.style.paddingBottom = '100px';
        }
    } else {
        // Desativa modo passo a passo
        if (nav) nav.style.display = 'none';
        if (stepModeText) stepModeText.textContent = 'Modo Passo a Passo';

        // Remove destaque de todas as etapas
        document.querySelectorAll('.etapa').forEach(etapa => {
            etapa.classList.remove('etapa-ativa');
            etapa.style.opacity = '';
            etapa.style.pointerEvents = '';
        });

        // Remove padding
        if (etapasContainer) {
            etapasContainer.style.paddingBottom = '';
        }
    }
}

/**
 * Inicializa os indicadores de etapa
 */
function initStepIndicators() {
    const indicatorsContainer = document.getElementById('stepIndicators');
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

    for (let i = 1; i <= totalEtapas; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'step-indicator';
        indicator.dataset.etapa = i;
        indicator.onclick = () => goToEtapa(i);
        indicatorsContainer.appendChild(indicator);
    }

    updateStepIndicators();
}

/**
 * Atualiza os indicadores de etapa
 */
function updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator');

    indicators.forEach(indicator => {
        const etapaId = parseInt(indicator.dataset.etapa);
        const checkbox = document.getElementById(`check-etapa-${etapaId}`);

        indicator.classList.remove('active', 'completed');

        if (etapaId === currentEtapa) {
            indicator.classList.add('active');
        }

        if (checkbox && checkbox.checked) {
            indicator.classList.add('completed');
        }
    });
}

/**
 * Vai para uma etapa específica
 */
function goToEtapa(etapaId) {
    currentEtapa = etapaId;

    // Remove destaque de todas
    document.querySelectorAll('.etapa').forEach(etapa => {
        etapa.classList.remove('etapa-ativa');
    });

    // Adiciona destaque na etapa atual
    const etapaElement = document.querySelector(`[data-etapa="${etapaId}"]`);
    if (etapaElement) {
        etapaElement.classList.add('etapa-ativa');

        // Scroll suave até a etapa
        etapaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Atualiza indicadores
    updateStepIndicators();

    // Atualiza estado dos botões
    updateStepNavButtons();
}

/**
 * Vai para a primeira etapa incompleta
 */
function goToFirstIncompleteEtapa() {
    for (let i = 1; i <= totalEtapas; i++) {
        const checkbox = document.getElementById(`check-etapa-${i}`);
        if (!checkbox || !checkbox.checked) {
            goToEtapa(i);
            return;
        }
    }
    // Todas completas, vai para a última
    goToEtapa(totalEtapas);
}

/**
 * Vai para a próxima etapa
 */
function nextEtapa() {
    if (currentEtapa < totalEtapas) {
        goToEtapa(currentEtapa + 1);
    }
}

/**
 * Vai para a etapa anterior
 */
function previousEtapa() {
    if (currentEtapa > 1) {
        goToEtapa(currentEtapa - 1);
    }
}

/**
 * Atualiza o estado dos botões de navegação
 */
function updateStepNavButtons() {
    const btnPrev = document.getElementById('btnPrevEtapa');
    const btnNext = document.getElementById('btnNextEtapa');

    if (btnPrev) {
        btnPrev.disabled = currentEtapa <= 1;
    }

    if (btnNext) {
        btnNext.disabled = currentEtapa >= totalEtapas;
    }
}

// Funções globais expostas no topo do arquivo

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    initChecklistState();
});
