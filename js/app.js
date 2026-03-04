// App.js - Lógica principal do aplicativo Açaí Seguro

// Controle de navegação entre páginas
function showPage(pageId) {
    // Ocultar todas as páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Mostrar página selecionada
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
        
        // Carregar dados específicos da página
        if (pageId === 'perfil') {
            loadPerfil();
        } else if (pageId === 'cadastro') {
            loadCadastroForm();
        } else if (pageId === 'checklist') {
            verificarCadastroParaChecklist();
            loadHistoricoChecklist();
        } else if (pageId === 'selos') {
            // Forçar recarregamento dos requisitos antes de exibir
            console.log('showPage(selos) - Iniciando updateSeloRequirements...');
            updateSeloRequirements().then(() => {
                console.log('showPage(selos) - updateSeloRequirements completo, chamando loadSelos em 100ms...');
                // Pequeno delay para garantir que requisitos foram salvos
                setTimeout(() => {
                    console.log('showPage(selos) - Executando loadSelos agora...');
                    loadSelos();
                }, 100);
            });
        } else if (pageId === 'home') {
            checkCadastroStatus();
        }
    }
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// ==================== MÓDULO 1: CADASTRO ====================

// Máscaras de formatação
function formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function formatCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    cnpj = cnpj.replace(/(\d{2})(\d)/, '$1.$2');
    cnpj = cnpj.replace(/(\d{3})(\d)/, '$1.$2');
    cnpj = cnpj.replace(/(\d{3})(\d)/, '$1/$2');
    cnpj = cnpj.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    return cnpj;
}

function formatTelefone(telefone) {
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length <= 10) {
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return telefone;
}

// Adicionar máscaras aos campos
document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    const cnpjInput = document.getElementById('cnpj');
    const telefoneInput = document.getElementById('telefone');
    const form = document.querySelector('form');
    
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            e.target.value = formatCPF(e.target.value);
        });
    }
    
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            e.target.value = formatCNPJ(e.target.value);
        });
    }
    
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            e.target.value = formatTelefone(e.target.value);
        });
    }

    // Validação do telefone no envio do formulário
    if (form && telefoneInput) {
        form.addEventListener('submit', function(e) {
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

// Obter geolocalização
function getLocation() {
    if (navigator.geolocation) {
        const localizacaoSpan = document.getElementById('localizacao');
        localizacaoSpan.textContent = 'Obtendo localização...';
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                localizacaoSpan.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`;
                localizacaoSpan.dataset.lat = lat;
                localizacaoSpan.dataset.lon = lon;
            },
            function(error) {
                localizacaoSpan.textContent = 'Erro ao obter localização';
                console.error(error);
            }
        );
    } else {
        alert('Geolocalização não é suportada pelo seu navegador.');
    }
}

// Carregar dados do cadastro no formulário
function preencherFormularioCadastro(cadastro) {
    if (!cadastro) return;
    // Suporta camelCase (localStorage) e snake_case (API PostgreSQL)
    document.getElementById('nome').value = cadastro.nome || '';
    document.getElementById('cpf').value = cadastro.cpf || '';
    document.getElementById('telefone').value = cadastro.telefone || '';
    document.getElementById('nomeFantasia').value = cadastro.nomeFantasia || cadastro.nome_fantasia || '';
    document.getElementById('cnpj').value = cadastro.cnpj || '';
    document.getElementById('endereco').value = cadastro.endereco || '';
    document.getElementById('alvara').value = cadastro.alvara || '';

    const localizacaoSpan = document.getElementById('localizacao');
    const lat = cadastro.lat || cadastro.latitude;
    const lon = cadastro.lon || cadastro.longitude;
    if (lat && lon) {
        localizacaoSpan.textContent = cadastro.localizacao || `Latitude: ${parseFloat(lat).toFixed(6)}, Longitude: ${parseFloat(lon).toFixed(6)}`;
        localizacaoSpan.dataset.lat = lat;
        localizacaoSpan.dataset.lon = lon;
    } else if (cadastro.localizacao) {
        localizacaoSpan.textContent = cadastro.localizacao;
    }
}

async function loadCadastroForm() {
    // 1. Preencher imediatamente com cache localStorage (sem aguardar API)
    const cacheLocal = localStorage.getItem('cadastro');
    if (cacheLocal) {
        preencherFormularioCadastro(JSON.parse(cacheLocal));
    } else {
        // Se não tem cadastro de batedor, pré-preencher nome do usuário logado
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
            try {
                const dadosUsuario = JSON.parse(usuario);
                if (dadosUsuario.nome) {
                    document.getElementById('nome').value = dadosUsuario.nome;
                }
            } catch (e) { /* ignora erro JSON */ }
        }
    }

    // 2. Atualizar com dados frescos da API em segundo plano
    try {
        const cadastro = await db.getCadastro();
        if (cadastro) preencherFormularioCadastro(cadastro);
    } catch (e) {
        // já preenchido pelo cache acima
    }
}

// Salvar cadastro
document.addEventListener('DOMContentLoaded', function() {
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const localizacaoSpan = document.getElementById('localizacao');
            const cadastro = {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                telefone: document.getElementById('telefone').value,
                nomeFantasia: document.getElementById('nomeFantasia').value,
                cnpj: document.getElementById('cnpj').value,
                endereco: document.getElementById('endereco').value,
                alvara: document.getElementById('alvara').value,
                localizacao: localizacaoSpan.textContent,
                lat: localizacaoSpan.dataset.lat || null,
                lon: localizacaoSpan.dataset.lon || null,
                dataCadastro: new Date().toISOString()
            };
            
            await db.saveCadastro(cadastro);
            alert('Cadastro salvo com sucesso!');
            
            // Atualizar requisitos dos selos
            await updateSeloRequirements();
            
            // Voltar para home (checkCadastroStatus será chamado automaticamente)
            showPage('home');
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
        ${cadastro.localizacao ? `
        <div class="perfil-campo">
            <strong>Localização:</strong>
            <span>${cadastro.localizacao}</span>
        </div>
        ` : ''}
        <button class="btn-secondary" onclick="showPage('cadastro')" style="margin-top: 1rem;">
            <i class="fas fa-edit"></i> Editar Cadastro
        </button>
    `;
}

// ==================== MÓDULO 2: CALCULADORA DE CLORAÇÃO ====================

document.addEventListener('DOMContentLoaded', function() {
    const formCalculadora = document.getElementById('formCalculadora');
    if (formCalculadora) {
        formCalculadora.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const quantidadeAgua = parseFloat(document.getElementById('quantidadeAgua').value);
            const concentracaoCloro = parseFloat(document.getElementById('concentracaoCloro').value);
            
            // Cálculo para obter 100-200 ppm de cloro livre
            // Fórmula: (Volume água em L × Concentração desejada em ppm) / (Concentração do produto em % × 10000)
            // Usando 150 ppm como valor médio
            const ppmDesejado = 150;
            const mlNecessario = (quantidadeAgua * ppmDesejado) / (concentracaoCloro * 10000);
            
            // Arredondar para 2 casas decimais
            const resultado = mlNecessario.toFixed(2);
            
            // Exibir resultado
            document.getElementById('quantidadeCloro').textContent = `${resultado} ml`;
            document.getElementById('tempoImersao').textContent = '15 minutos de imersão completa dos frutos';
            document.getElementById('resultadoCalculadora').style.display = 'block';
            
            // Salvar cálculo
            const calculation = {
                data: new Date().toISOString(),
                quantidadeAgua: quantidadeAgua,
                concentracaoCloro: concentracaoCloro,
                resultado: resultado
            };
            db.saveCalculation(calculation);
            
            // Scroll para o resultado
            document.getElementById('resultadoCalculadora').scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// ==================== MÓDULO 3: CRONÔMETRO PARA BRANQUEAMENTO ====================

let timerInterval = null;
let timeLeft = 10;
let timerRunning = false;

function startTimer(seconds) {
    timeLeft = seconds;
    document.getElementById('timerModal').style.display = 'block';
    document.getElementById('timerDigital').textContent = timeLeft;
    document.getElementById('timerAlert').style.display = 'none';
    document.getElementById('timerBtn').innerHTML = '<i class="fas fa-play"></i> Iniciar';
    timerRunning = false;
}

function toggleTimer() {
    if (timerRunning) {
        // Pausar
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timerBtn').innerHTML = '<i class="fas fa-play"></i> Continuar';
    } else {
        // Iniciar/Continuar
        timerRunning = true;
        document.getElementById('timerBtn').innerHTML = '<i class="fas fa-pause"></i> Pausar';
        
        timerInterval = setInterval(function() {
            timeLeft--;
            document.getElementById('timerDigital').textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                document.getElementById('timerAlert').style.display = 'block';
                document.getElementById('timerBtn').innerHTML = '<i class="fas fa-redo"></i> Reiniciar';
                timerRunning = false;
                
                // Tocar som de alerta (se suportado)
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.3;
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 500);
                } catch (e) {
                    console.log('Áudio não suportado');
                }
                
                // Reiniciar para novo uso
                timeLeft = 10;
            }
        }, 1000);
    }
}

function closeTimer() {
    clearInterval(timerInterval);
    document.getElementById('timerModal').style.display = 'none';
    timerRunning = false;
    timeLeft = 10;
}

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

document.addEventListener('DOMContentLoaded', function() {
    const formChecklist = document.getElementById('formChecklist');
    if (formChecklist) {
        formChecklist.addEventListener('submit', async function(e) {
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
                
                // Atualizar histórico
                await loadHistoricoChecklist();
                
                // Atualizar requisitos dos selos
                updateSeloRequirements();
                
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
    db.saveRequisitoStatus('prata', 2, !!(cadastro && cadastro.alvara));
    db.saveRequisitoStatus('prata', 3, !!(cadastro && cadastro.endereco));
    db.saveRequisitoStatus('prata', 4, checklists7days.length >= 7);
    // Novo requisito: processamento correto
    const processamentoCorreto = db.checkProcessamentoCorreto ? db.checkProcessamentoCorreto() : true;
    db.saveRequisitoStatus('prata', 5, processamentoCorreto);
    
    console.log('Requisito 4 (7 dias):', checklists7days.length >= 7, '(total:', checklists7days.length, ')');
    
    // Requisitos Selo Ouro
    const pratoCompleto = db.getRequisitoStatus('prata', 1) && 
                          db.getRequisitoStatus('prata', 2) && 
                          db.getRequisitoStatus('prata', 3) && 
                          db.getRequisitoStatus('prata', 4);
    
    db.saveRequisitoStatus('ouro', 1, pratoCompleto);
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

// Logout seguro - limpa dados sensíveis
function fazerLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        // Limpar apenas dados sensíveis do usuário atual
        localStorage.removeItem('usuario');
        localStorage.removeItem('userCPF');
        localStorage.removeItem('cadastro');
        localStorage.removeItem('checklists');
        localStorage.removeItem('selo');
        
        // Limpar todos os requisitos de selo
        for (let i = 1; i <= 5; i++) {
            localStorage.removeItem(`requisito_prata_${i}`);
        }
        for (let i = 1; i <= 4; i++) {
            localStorage.removeItem(`requisito_ouro_${i}`);
        }
        
        // Manter _last_user para detecção de troca
        window.location.href = 'apresentacao.html';
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

// Inicializar aplicativo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar troca de usuário e invalidar cache se necessário
    verificarTrocaUsuario();
    
    // Só atualiza requisitos se houver CPF cadastrado
    const cpf = db.getUserCPF();
    if (cpf && cpf !== 'null') {
        updateSeloRequirements();
    }
    checkCadastroStatus();
});
