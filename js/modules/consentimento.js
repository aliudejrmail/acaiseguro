/**
 * Módulo de Consentimento LGPD
 * Gerencia o banner de consentimento e armazenamento de preferências
 * em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)
 */

export const consentimento = {
    /**
     * Chaves usadas no localStorage
     */
    KEYS: {
        CONSENTIMENTO: 'lgpd_consentimento',
        DATA_CONSENTIMENTO: 'lgpd_data_consentimento',
        VERSAO_POLITICA: 'lgpd_versao_politica'
    },

    /**
     * Versão atual da política de privacidade
     * Atualizar este número quando houver mudanças significativas
     */
    VERSAO_ATUAL: '1.0.0',

    /**
     * Verifica se o usuário já aceitou os termos
     * @returns {boolean} true se consentimento foi dado
     */
    verificarConsentimento() {
        const consentimento = localStorage.getItem(this.KEYS.CONSENTIMENTO);
        const versao = localStorage.getItem(this.KEYS.VERSAO_POLITICA);
        
        // Consentimento só é válido se for verdadeiro e da versão atual
        return consentimento === 'true' && versao === this.VERSAO_ATUAL;
    },

    /**
     * Salva o consentimento do usuário
     * @param {boolean} aceitou - Se o usuário aceitou os termos
     */
    salvarConsentimento(aceitou = true) {
        localStorage.setItem(this.KEYS.CONSENTIMENTO, aceitou.toString());
        localStorage.setItem(this.KEYS.DATA_CONSENTIMENTO, new Date().toISOString());
        localStorage.setItem(this.KEYS.VERSAO_POLITICA, this.VERSAO_ATUAL);
        
        // Disparar evento personalizado para outras partes do sistema
        window.dispatchEvent(new CustomEvent('lgpd:consentimento', { 
            detail: { aceitou, data: new Date().toISOString() } 
        }));
    },

    /**
     * Remove o consentimento do usuário (para caso queira revogar)
     */
    revogarConsentimento() {
        localStorage.removeItem(this.KEYS.CONSENTIMENTO);
        localStorage.removeItem(this.KEYS.DATA_CONSENTIMENTO);
        localStorage.removeItem(this.KEYS.VERSAO_POLITICA);
        
        window.dispatchEvent(new CustomEvent('lgpd:revogacao', { 
            detail: { data: new Date().toISOString() } 
        }));
    },

    /**
     * Obtém informações sobre o consentimento
     * @returns {Object|null} Dados do consentimento ou null se não existir
     */
    obterInformacoesConsentimento() {
        const consentimento = localStorage.getItem(this.KEYS.CONSENTIMENTO);
        const data = localStorage.getItem(this.KEYS.DATA_CONSENTIMENTO);
        const versao = localStorage.getItem(this.KEYS.VERSAO_POLITICA);
        
        if (!consentimento) {
            return null;
        }
        
        return {
            aceitou: consentimento === 'true',
            data: data ? new Date(data) : null,
            versao: versao
        };
    },

    /**
     * Exibe o banner de consentimento LGPD
     */
    exibirBanner() {
        // Não exibir se já houver consentimento
        if (this.verificarConsentimento()) {
            return;
        }

        // Remover banner existente se houver
        const bannerExistente = document.getElementById('lgpdBanner');
        if (bannerExistente) {
            bannerExistente.remove();
        }

        // Criar elemento do banner
        const banner = document.createElement('div');
        banner.id = 'lgpdBanner';
        banner.setAttribute('role', 'alertdialog');
        banner.setAttribute('aria-labelledby', 'lgpdBannerTitle');
        banner.setAttribute('aria-describedby', 'lgpdBannerDesc');
        
        banner.innerHTML = `
            <div class="lgpd-banner-content">
                <div class="lgpd-banner-text">
                    <h4 id="lgpdBannerTitle">
                        <i class="fas fa-shield-alt"></i>
                        Proteção de Dados Pessoais
                    </h4>
                    <p id="lgpdBannerDesc">
                        Em conformidade com a LGPD (Lei 13.709/2018), informamos que 
                        utilizamos cookies e dados pessoais para garantir a conformidade 
                        sanitária e fornecer os serviços do sistema.
                    </p>
                    <p class="lgpd-banner-links">
                        <a href="politica-privacidade.html" target="_blank" class="lgpd-link">
                            <i class="fas fa-file-contract"></i>
                            Ler Política de Privacidade completa
                        </a>
                    </p>
                </div>
                <div class="lgpd-banner-actions">
                    <button type="button" class="lgpd-btn lgpd-btn-recusar" id="lgpdBtnRecusar">
                        <i class="fas fa-times"></i>
                        Recusar
                    </button>
                    <button type="button" class="lgpd-btn lgpd-btn-aceitar" id="lgpdBtnAceitar">
                        <i class="fas fa-check"></i>
                        Aceitar e Continuar
                    </button>
                </div>
            </div>
        `;

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #lgpdBanner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #7828c8 0%, #9333ea 100%);
                color: white;
                padding: 1.5rem;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                animation: lgpdSlideUp 0.3s ease-out;
            }
            
            @keyframes lgpdSlideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .lgpd-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
                flex-wrap: wrap;
            }
            
            .lgpd-banner-text {
                flex: 1;
                min-width: 300px;
            }
            
            .lgpd-banner-text h4 {
                margin: 0 0 0.75rem 0;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .lgpd-banner-text p {
                margin: 0 0 0.5rem 0;
                line-height: 1.5;
                opacity: 0.95;
            }
            
            .lgpd-banner-links {
                margin-top: 0.75rem !important;
            }
            
            .lgpd-banner-links a {
                color: #fbbf24;
                text-decoration: none;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }
            
            .lgpd-banner-links a:hover {
                text-decoration: underline;
                color: #fcd34d;
            }
            
            .lgpd-banner-actions {
                display: flex;
                gap: 1rem;
                flex-shrink: 0;
            }
            
            .lgpd-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }
            
            .lgpd-btn-aceitar {
                background: #22c55e;
                color: white;
            }
            
            .lgpd-btn-aceitar:hover {
                background: #16a34a;
                transform: translateY(-1px);
            }
            
            .lgpd-btn-recusar {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.4);
            }
            
            .lgpd-btn-recusar:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            @media (max-width: 768px) {
                #lgpdBanner {
                    padding: 1rem;
                }
                
                .lgpd-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .lgpd-banner-text h4 {
                    justify-content: center;
                }
                
                .lgpd-banner-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .lgpd-btn {
                    flex: 1;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Adicionar event listeners
        document.getElementById('lgpdBtnAceitar').addEventListener('click', () => {
            this.salvarConsentimento(true);
            this.ocultarBanner();
        });

        document.getElementById('lgpdBtnRecusar').addEventListener('click', () => {
            this.salvarConsentimento(false);
            this.ocultarBanner();
            // Opcional: Redirecionar ou exibir mensagem
            alert('Você recusou o consentimento. Algumas funcionalidades do sistema podem não estar disponíveis.');
        });
    },

    /**
     * Oculta o banner com animação
     */
    ocultarBanner() {
        const banner = document.getElementById('lgpdBanner');
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transition = 'opacity 0.3s';
            setTimeout(() => banner.remove(), 300);
        }
    },

    /**
     * Inicializa o módulo de consentimento
     * Deve ser chamado no carregamento da página
     */
    inicializar() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.exibirBanner();
            });
        } else {
            this.exibirBanner();
        }
    }
};

// Exportar função de inicialização rápida
export function initLGPD() {
    consentimento.inicializar();
}

// Exportar para escopo global (opcional, para uso em inline scripts)
if (typeof window !== 'undefined') {
    window.consentimentoLGPD = consentimento;
    window.initLGPD = initLGPD;
}
