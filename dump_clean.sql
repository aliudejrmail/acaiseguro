--
-- PostgreSQL database dump
--

\restrict CobghJKkWgyoxYbywtINebjdp2ewLvSOtgwLdbi56UW6yqxadMBrLfUT5gQNAK7

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.selos DROP CONSTRAINT IF EXISTS selos_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.requisitos_selos DROP CONSTRAINT IF EXISTS requisitos_selos_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historico_gestor DROP CONSTRAINT IF EXISTS historico_gestor_gestor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historico_gestor DROP CONSTRAINT IF EXISTS historico_gestor_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_gestor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.calculos_cloracao DROP CONSTRAINT IF EXISTS calculos_cloracao_batedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.batedores DROP CONSTRAINT IF EXISTS batedores_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.batedores DROP CONSTRAINT IF EXISTS batedores_gestor_responsavel_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analises DROP CONSTRAINT IF EXISTS analises_gestor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analises DROP CONSTRAINT IF EXISTS analises_batedor_id_fkey;
DROP TRIGGER IF EXISTS update_batedores_updated_at ON public.batedores;
DROP TRIGGER IF EXISTS trg_update_analise_updated_at ON public.analises;
DROP TRIGGER IF EXISTS trg_registrar_analise ON public.analises;
DROP INDEX IF EXISTS public.idx_usuarios_role;
DROP INDEX IF EXISTS public.idx_selos_batedor;
DROP INDEX IF EXISTS public.idx_selos_ativo;
DROP INDEX IF EXISTS public.idx_requisitos_batedor;
DROP INDEX IF EXISTS public.idx_notificacoes_usuario;
DROP INDEX IF EXISTS public.idx_notificacoes_lida;
DROP INDEX IF EXISTS public.idx_notificacoes_batedor;
DROP INDEX IF EXISTS public.idx_historico_gestor;
DROP INDEX IF EXISTS public.idx_historico_data;
DROP INDEX IF EXISTS public.idx_historico_batedor;
DROP INDEX IF EXISTS public.idx_checklists_data;
DROP INDEX IF EXISTS public.idx_checklists_batedor;
DROP INDEX IF EXISTS public.idx_calculos_batedor;
DROP INDEX IF EXISTS public.idx_batedores_status;
DROP INDEX IF EXISTS public.idx_batedores_cpf;
DROP INDEX IF EXISTS public.idx_analises_resultado;
DROP INDEX IF EXISTS public.idx_analises_gestor;
DROP INDEX IF EXISTS public.idx_analises_data;
DROP INDEX IF EXISTS public.idx_analises_batedor;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE IF EXISTS ONLY public.selos DROP CONSTRAINT IF EXISTS selos_pkey;
ALTER TABLE IF EXISTS ONLY public.requisitos_selos DROP CONSTRAINT IF EXISTS requisitos_selos_pkey;
ALTER TABLE IF EXISTS ONLY public.requisitos_selos DROP CONSTRAINT IF EXISTS requisitos_selos_batedor_id_tipo_selo_numero_requisito_key;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_pkey;
ALTER TABLE IF EXISTS ONLY public.historico_gestor DROP CONSTRAINT IF EXISTS historico_gestor_pkey;
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS checklists_pkey;
ALTER TABLE IF EXISTS ONLY public.calculos_cloracao DROP CONSTRAINT IF EXISTS calculos_cloracao_pkey;
ALTER TABLE IF EXISTS ONLY public.batedores DROP CONSTRAINT IF EXISTS batedores_pkey;
ALTER TABLE IF EXISTS ONLY public.batedores DROP CONSTRAINT IF EXISTS batedores_cpf_key;
ALTER TABLE IF EXISTS ONLY public.analises DROP CONSTRAINT IF EXISTS analises_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.selos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.requisitos_selos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notificacoes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historico_gestor ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.checklists ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.calculos_cloracao ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.batedores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analises ALTER COLUMN id DROP DEFAULT;
DROP VIEW IF EXISTS public.v_progresso_selos;
DROP VIEW IF EXISTS public.v_estatisticas_conformidade;
DROP VIEW IF EXISTS public.v_dashboard_gestor;
DROP VIEW IF EXISTS public.v_batedores_resumo;
DROP VIEW IF EXISTS public.v_batedores_com_selo;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.selos_id_seq;
DROP TABLE IF EXISTS public.selos;
DROP SEQUENCE IF EXISTS public.requisitos_selos_id_seq;
DROP TABLE IF EXISTS public.requisitos_selos;
DROP SEQUENCE IF EXISTS public.notificacoes_id_seq;
DROP TABLE IF EXISTS public.notificacoes;
DROP SEQUENCE IF EXISTS public.historico_gestor_id_seq;
DROP TABLE IF EXISTS public.historico_gestor;
DROP SEQUENCE IF EXISTS public.checklists_id_seq;
DROP TABLE IF EXISTS public.checklists;
DROP SEQUENCE IF EXISTS public.calculos_cloracao_id_seq;
DROP TABLE IF EXISTS public.calculos_cloracao;
DROP SEQUENCE IF EXISTS public.batedores_id_seq;
DROP TABLE IF EXISTS public.batedores;
DROP SEQUENCE IF EXISTS public.analises_id_seq;
DROP TABLE IF EXISTS public.analises;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_analise_updated_at();
DROP FUNCTION IF EXISTS public.registrar_acao_gestor();
DROP FUNCTION IF EXISTS public.atualizar_status_selos();
--
-- Name: atualizar_status_selos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_status_selos() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE selos
    SET ativo = FALSE
    WHERE data_validade <= CURRENT_TIMESTAMP AND ativo = TRUE;
END;
$$;


--
-- Name: registrar_acao_gestor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_acao_gestor() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Registrar no histórico quando uma análise é criada
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'analises' THEN
        INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
        VALUES (NEW.gestor_id, NEW.batedor_id, 'analise_criada', 
                jsonb_build_object('tipo', NEW.tipo_analise, 'resultado', NEW.resultado));
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: update_analise_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_analise_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analises (
    id integer NOT NULL,
    batedor_id integer,
    gestor_id integer,
    tipo_analise character varying(50) NOT NULL,
    data_analise timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resultado character varying(20) NOT NULL,
    pontuacao numeric(5,2),
    pontos_criticos text[],
    pontos_positivos text[],
    laudo text NOT NULL,
    prazo_correcao date,
    anexos jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analises_resultado_check CHECK (((resultado)::text = ANY ((ARRAY['aprovado'::character varying, 'reprovado'::character varying, 'pendente_correcoes'::character varying])::text[])))
);


--
-- Name: TABLE analises; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.analises IS 'Análises e laudos realizados por gestores/autoridades sanitárias';


--
-- Name: analises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analises_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analises_id_seq OWNED BY public.analises.id;


--
-- Name: batedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batedores (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    telefone character varying(20) NOT NULL,
    nome_fantasia character varying(255) NOT NULL,
    cnpj character varying(18),
    endereco text NOT NULL,
    alvara character varying(100) NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_id integer,
    status_aprovacao character varying(20) DEFAULT 'pendente'::character varying,
    data_aprovacao timestamp without time zone,
    gestor_responsavel_id integer,
    CONSTRAINT batedores_status_aprovacao_check CHECK (((status_aprovacao)::text = ANY ((ARRAY['pendente'::character varying, 'aprovado'::character varying, 'reprovado'::character varying, 'em_analise'::character varying])::text[])))
);


--
-- Name: TABLE batedores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.batedores IS 'Cadastro completo dos batedores de aÃ§aÃ­';


--
-- Name: batedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batedores_id_seq OWNED BY public.batedores.id;


--
-- Name: calculos_cloracao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calculos_cloracao (
    id integer NOT NULL,
    batedor_id integer,
    data_calculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantidade_agua numeric(10,2) NOT NULL,
    concentracao_cloro numeric(5,2) NOT NULL,
    resultado_ml numeric(10,2) NOT NULL
);


--
-- Name: TABLE calculos_cloracao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.calculos_cloracao IS 'HistÃ³rico de cÃ¡lculos de cloraÃ§Ã£o realizados';


--
-- Name: calculos_cloracao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calculos_cloracao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calculos_cloracao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calculos_cloracao_id_seq OWNED BY public.calculos_cloracao.id;


--
-- Name: checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists (
    id integer NOT NULL,
    batedor_id integer,
    data_checklist timestamp without time zone NOT NULL,
    higiene_manipulador jsonb NOT NULL,
    limpeza_ambiente jsonb NOT NULL,
    controle_pragas jsonb NOT NULL,
    qualidade_agua jsonb NOT NULL,
    manutencao_equipamentos jsonb NOT NULL,
    observacoes text,
    itens_conformes integer NOT NULL,
    total_itens integer NOT NULL,
    percentual_conformidade numeric(5,2) NOT NULL,
    conforme boolean NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    editado_por_gestor boolean DEFAULT false,
    gestor_id integer,
    observacoes_gestor text,
    data_edicao_gestor timestamp without time zone
);


--
-- Name: TABLE checklists; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.checklists IS 'HistÃ³rico de check-lists de Boas PrÃ¡ticas de FabricaÃ§Ã£o';


--
-- Name: checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.checklists_id_seq OWNED BY public.checklists.id;


--
-- Name: historico_gestor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_gestor (
    id integer NOT NULL,
    gestor_id integer,
    batedor_id integer,
    acao character varying(100) NOT NULL,
    detalhes jsonb,
    data_acao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE historico_gestor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.historico_gestor IS 'Histórico de todas as ações realizadas por gestores (auditoria)';


--
-- Name: historico_gestor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historico_gestor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historico_gestor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_gestor_id_seq OWNED BY public.historico_gestor.id;


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    batedor_id integer,
    usuario_id integer,
    tipo character varying(50) NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    lida boolean DEFAULT false,
    criada_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE notificacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notificacoes IS 'Notificações enviadas aos batedores sobre status e pendências';


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: requisitos_selos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requisitos_selos (
    id integer NOT NULL,
    batedor_id integer,
    tipo_selo character varying(20) NOT NULL,
    numero_requisito integer NOT NULL,
    status boolean DEFAULT false,
    data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT requisitos_selos_tipo_selo_check CHECK (((tipo_selo)::text = ANY ((ARRAY['prata'::character varying, 'ouro'::character varying])::text[])))
);


--
-- Name: TABLE requisitos_selos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.requisitos_selos IS 'Progresso dos requisitos para obtenÃ§Ã£o de selos';


--
-- Name: requisitos_selos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.requisitos_selos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: requisitos_selos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.requisitos_selos_id_seq OWNED BY public.requisitos_selos.id;


--
-- Name: selos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.selos (
    id integer NOT NULL,
    batedor_id integer,
    tipo character varying(20) NOT NULL,
    data_emissao timestamp without time zone NOT NULL,
    data_validade timestamp without time zone NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT selos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['prata'::character varying, 'ouro'::character varying])::text[])))
);


--
-- Name: TABLE selos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.selos IS 'Selos de certificaÃ§Ã£o emitidos para os batedores';


--
-- Name: selos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.selos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: selos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.selos_id_seq OWNED BY public.selos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(120) NOT NULL,
    senha character varying(255) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'batedor'::character varying,
    CONSTRAINT usuarios_role_check CHECK (((role)::text = ANY ((ARRAY['batedor'::character varying, 'gestor'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: v_batedores_com_selo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_batedores_com_selo AS
 SELECT b.id,
    b.nome,
    b.nome_fantasia,
    b.cpf,
    s.tipo AS tipo_selo,
    s.data_emissao,
    s.data_validade
   FROM (public.batedores b
     JOIN public.selos s ON ((b.id = s.batedor_id)))
  WHERE ((s.ativo = true) AND (s.data_validade > CURRENT_TIMESTAMP));


--
-- Name: v_batedores_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_batedores_resumo AS
 SELECT b.id,
    b.nome,
    b.cpf,
    b.nome_fantasia,
    b.endereco,
    b.telefone,
    b.status_aprovacao,
    b.data_cadastro,
    b.data_aprovacao,
    count(DISTINCT c.id) AS total_checklists,
    max(c.data_checklist) AS ultimo_checklist,
    avg(c.percentual_conformidade) AS media_conformidade,
    s.tipo AS tipo_selo_ativo,
    s.data_validade AS validade_selo,
    ( SELECT count(*) AS count
           FROM public.analises a
          WHERE (a.batedor_id = b.id)) AS total_analises,
    ( SELECT max(a.data_analise) AS max
           FROM public.analises a
          WHERE (a.batedor_id = b.id)) AS ultima_analise
   FROM ((public.batedores b
     LEFT JOIN public.checklists c ON ((b.id = c.batedor_id)))
     LEFT JOIN public.selos s ON (((b.id = s.batedor_id) AND (s.ativo = true) AND (s.data_validade > CURRENT_TIMESTAMP))))
  GROUP BY b.id, b.nome, b.cpf, b.nome_fantasia, b.endereco, b.telefone, b.status_aprovacao, b.data_cadastro, b.data_aprovacao, s.tipo, s.data_validade
  ORDER BY b.data_cadastro DESC;


--
-- Name: VIEW v_batedores_resumo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_batedores_resumo IS 'Lista resumida de batedores com informações relevantes';


--
-- Name: v_dashboard_gestor; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_dashboard_gestor AS
 SELECT count(DISTINCT b.id) AS total_estabelecimentos,
    count(DISTINCT
        CASE
            WHEN ((b.status_aprovacao)::text = 'aprovado'::text) THEN b.id
            ELSE NULL::integer
        END) AS aprovados,
    count(DISTINCT
        CASE
            WHEN ((b.status_aprovacao)::text = 'pendente'::text) THEN b.id
            ELSE NULL::integer
        END) AS pendentes,
    count(DISTINCT
        CASE
            WHEN ((b.status_aprovacao)::text = 'em_analise'::text) THEN b.id
            ELSE NULL::integer
        END) AS em_analise,
    count(DISTINCT
        CASE
            WHEN ((b.status_aprovacao)::text = 'reprovado'::text) THEN b.id
            ELSE NULL::integer
        END) AS reprovados,
    count(c.id) AS total_checklists,
    count(DISTINCT
        CASE
            WHEN (c.data_checklist >= (CURRENT_TIMESTAMP - '30 days'::interval)) THEN c.id
            ELSE NULL::integer
        END) AS checklists_30dias,
    avg(c.percentual_conformidade) AS media_geral_conformidade,
    count(DISTINCT s.id) AS selos_ativos
   FROM ((public.batedores b
     LEFT JOIN public.checklists c ON ((b.id = c.batedor_id)))
     LEFT JOIN public.selos s ON (((b.id = s.batedor_id) AND (s.ativo = true) AND (s.data_validade > CURRENT_TIMESTAMP))));


--
-- Name: VIEW v_dashboard_gestor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_dashboard_gestor IS 'Resumo geral para dashboard do gestor';


--
-- Name: v_estatisticas_conformidade; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_estatisticas_conformidade AS
 SELECT b.id,
    b.nome,
    b.nome_fantasia,
    count(c.id) AS total_checklists,
    avg(c.percentual_conformidade) AS media_conformidade,
    count(
        CASE
            WHEN c.conforme THEN 1
            ELSE NULL::integer
        END) AS checklists_conformes,
    count(
        CASE
            WHEN (NOT c.conforme) THEN 1
            ELSE NULL::integer
        END) AS checklists_nao_conformes,
    max(c.data_checklist) AS ultimo_checklist
   FROM (public.batedores b
     LEFT JOIN public.checklists c ON ((b.id = c.batedor_id)))
  GROUP BY b.id, b.nome, b.nome_fantasia;


--
-- Name: v_progresso_selos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_progresso_selos AS
 SELECT b.id AS batedor_id,
    b.nome,
    rs.tipo_selo,
    count(*) FILTER (WHERE (rs.status = true)) AS requisitos_completos,
    count(*) AS total_requisitos,
    round((((count(*) FILTER (WHERE (rs.status = true)))::numeric / (count(*))::numeric) * (100)::numeric), 2) AS percentual_completo
   FROM (public.batedores b
     LEFT JOIN public.requisitos_selos rs ON ((b.id = rs.batedor_id)))
  GROUP BY b.id, b.nome, rs.tipo_selo;


--
-- Name: analises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analises ALTER COLUMN id SET DEFAULT nextval('public.analises_id_seq'::regclass);


--
-- Name: batedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batedores ALTER COLUMN id SET DEFAULT nextval('public.batedores_id_seq'::regclass);


--
-- Name: calculos_cloracao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculos_cloracao ALTER COLUMN id SET DEFAULT nextval('public.calculos_cloracao_id_seq'::regclass);


--
-- Name: checklists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists ALTER COLUMN id SET DEFAULT nextval('public.checklists_id_seq'::regclass);


--
-- Name: historico_gestor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_gestor ALTER COLUMN id SET DEFAULT nextval('public.historico_gestor_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: requisitos_selos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisitos_selos ALTER COLUMN id SET DEFAULT nextval('public.requisitos_selos_id_seq'::regclass);


--
-- Name: selos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selos ALTER COLUMN id SET DEFAULT nextval('public.selos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: analises; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: batedores; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.batedores (id, nome, cpf, telefone, nome_fantasia, cnpj, endereco, alvara, latitude, longitude, data_cadastro, data_atualizacao, usuario_id, status_aprovacao, data_aprovacao, gestor_responsavel_id) VALUES (1, 'Batedor Teste', '123.654.987-45', '(94) 91234-5678', 'Açaí Grosso', '', 'Rua Igapó', '12345678', NULL, NULL, '2026-03-03 22:23:04.959531', '2026-03-03 23:36:24.035635', NULL, 'pendente', NULL, NULL);
INSERT INTO public.batedores (id, nome, cpf, telefone, nome_fantasia, cnpj, endereco, alvara, latitude, longitude, data_cadastro, data_atualizacao, usuario_id, status_aprovacao, data_aprovacao, gestor_responsavel_id) VALUES (2, 'Açaí do Grosso', '987.654.321-11', '(94) 91234-5678', 'Açaí do Grosso', '', 'Rua Igapororo', '123456789', NULL, NULL, '2026-03-03 23:48:36.847793', '2026-03-03 23:48:36.847793', 1, 'pendente', NULL, NULL);
INSERT INTO public.batedores (id, nome, cpf, telefone, nome_fantasia, cnpj, endereco, alvara, latitude, longitude, data_cadastro, data_atualizacao, usuario_id, status_aprovacao, data_aprovacao, gestor_responsavel_id) VALUES (3, 'Teste Açaí', '928.673.322-49', '(94) 98765-4321', 'Teste Açaí', '', 'Rua Igarapé', '131313132123', NULL, NULL, '2026-03-04 00:20:30.862241', '2026-03-05 00:06:14.132353', 3, 'pendente', NULL, NULL);


--
-- Data for Name: calculos_cloracao; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: checklists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.checklists (id, batedor_id, data_checklist, higiene_manipulador, limpeza_ambiente, controle_pragas, qualidade_agua, manutencao_equipamentos, observacoes, itens_conformes, total_itens, percentual_conformidade, conforme, criado_em, editado_por_gestor, gestor_id, observacoes_gestor, data_edicao_gestor) VALUES (1, 1, '2026-03-03 22:33:35.76133', '["1", "2", "3", "4", "5"]', '["1", "2", "3", "4", "5", "6"]', '["1", "2", "3", "4"]', '["1"]', '["1", "2", "3", "4"]', '', 20, 22, 90.90, true, '2026-03-03 22:33:35.76133', false, NULL, NULL, NULL);
INSERT INTO public.checklists (id, batedor_id, data_checklist, higiene_manipulador, limpeza_ambiente, controle_pragas, qualidade_agua, manutencao_equipamentos, observacoes, itens_conformes, total_itens, percentual_conformidade, conforme, criado_em, editado_por_gestor, gestor_id, observacoes_gestor, data_edicao_gestor) VALUES (2, 1, '2026-03-03 22:34:26.05751', '["1", "2", "3", "4", "5"]', '["1", "2", "3", "4", "5", "6"]', '["1", "2", "3", "4"]', '["1", "2", "3"]', '["1", "2", "3", "4"]', '', 22, 22, 100.00, true, '2026-03-03 22:34:26.05751', false, NULL, NULL, NULL);
INSERT INTO public.checklists (id, batedor_id, data_checklist, higiene_manipulador, limpeza_ambiente, controle_pragas, qualidade_agua, manutencao_equipamentos, observacoes, itens_conformes, total_itens, percentual_conformidade, conforme, criado_em, editado_por_gestor, gestor_id, observacoes_gestor, data_edicao_gestor) VALUES (3, 3, '2026-03-04 00:59:17.228655', '["1", "2", "3", "4", "5"]', '["1", "2", "3", "4", "5", "6"]', '[]', '["1", "2", "3"]', '["1", "2", "3", "4"]', '', 18, 22, 81.80, true, '2026-03-04 00:59:17.228655', false, NULL, NULL, NULL);


--
-- Data for Name: historico_gestor; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.historico_gestor (id, gestor_id, batedor_id, acao, detalhes, data_acao) VALUES (1, 5, 3, 'status_alterado', '{"motivo": null, "novo_status": "aprovado"}', '2026-03-05 00:03:43.302574');


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notificacoes (id, batedor_id, usuario_id, tipo, titulo, mensagem, lida, criada_em) VALUES (1, 3, 3, 'status_alterado', '✅ Status Atualizado: Aprovado', 'Seu estabelecimento foi aprovado pela autoridade sanitária.', false, '2026-03-05 00:03:43.302574');


--
-- Data for Name: requisitos_selos; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5678, 2, 'prata', 1, true, '2026-03-04 00:19:14.293142');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5679, 2, 'prata', 2, true, '2026-03-04 00:19:14.293865');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5680, 2, 'prata', 3, true, '2026-03-04 00:19:14.306087');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5684, 2, 'prata', 4, false, '2026-03-04 00:19:14.307688');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5683, 2, 'prata', 5, true, '2026-03-04 00:19:14.308643');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5682, 2, 'ouro', 1, false, '2026-03-04 00:19:14.309897');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5681, 2, 'ouro', 4, false, '2026-03-04 00:19:14.371516');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (1, 1, 'prata', 1, true, '2026-03-03 23:36:31.130414');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (4, 1, 'prata', 2, true, '2026-03-03 23:36:31.130999');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (11, 1, 'ouro', 4, false, '2026-03-03 23:36:31.208148');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (3, 1, 'prata', 3, true, '2026-03-03 23:36:31.280853');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (2, 1, 'ouro', 1, false, '2026-03-03 23:36:31.283448');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (7, 1, 'prata', 4, false, '2026-03-03 23:36:31.290102');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (1852, 1, 'prata', 5, true, '2026-03-03 23:36:31.294229');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5720, 3, 'prata', 1, true, '2026-03-04 17:52:06.857884');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5723, 3, 'prata', 2, true, '2026-03-04 17:52:06.858505');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5722, 3, 'prata', 3, true, '2026-03-04 17:52:06.859337');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5725, 3, 'prata', 4, false, '2026-03-04 17:52:06.862672');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5721, 3, 'ouro', 4, false, '2026-03-04 17:52:06.897167');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5724, 3, 'ouro', 1, false, '2026-03-04 17:52:06.944265');
INSERT INTO public.requisitos_selos (id, batedor_id, tipo_selo, numero_requisito, status, data_atualizacao) VALUES (5726, 3, 'prata', 5, true, '2026-03-04 17:52:06.962016');


--
-- Data for Name: selos; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuarios (id, nome, email, senha, criado_em, role) VALUES (1, 'Açaí do Grosso', 'acaigrosso@acai.coom', '$2b$10$l4sUC.HyS5CelrDPl05fwe/.KxJBgGyoha.NMLzo7H1JNd9v2k.uS', '2026-03-03 23:02:50.956204', 'batedor');
INSERT INTO public.usuarios (id, nome, email, senha, criado_em, role) VALUES (3, 'Teste Açaí', 'testeacai@teste.com', '$2b$10$wjtQM2rED3YGNgQrS8dEdOVigsTNcI.ukk0ET.qNUwU2N4MX.1tK.', '2026-03-03 23:32:15.050713', 'batedor');
INSERT INTO public.usuarios (id, nome, email, senha, criado_em, role) VALUES (5, 'Gestor Padrão', 'gestor@acaiseguro.com', '$2b$10$NETXZ9zwCu/vsym4UVUGke8zDS69e1fbjiXamWHU2b/tlos4J5pYK', '2026-03-04 18:01:07.793837', 'gestor');
INSERT INTO public.usuarios (id, nome, email, senha, criado_em, role) VALUES (6, 'Açaí Legal', 'acailegal@acai.com', '$2b$10$Xsu0FOB6qoVAdQOFejF8B.0FICotm9c.jrZY2rsfoRVqjwhN0a2Em', '2026-03-04 21:20:14.466585', 'batedor');


--
-- Name: analises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.analises_id_seq', 1, false);


--
-- Name: batedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.batedores_id_seq', 3, true);


--
-- Name: calculos_cloracao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calculos_cloracao_id_seq', 1, false);


--
-- Name: checklists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.checklists_id_seq', 3, true);


--
-- Name: historico_gestor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_gestor_id_seq', 1, true);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 1, true);


--
-- Name: requisitos_selos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.requisitos_selos_id_seq', 6181, true);


--
-- Name: selos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.selos_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- Name: analises analises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analises
    ADD CONSTRAINT analises_pkey PRIMARY KEY (id);


--
-- Name: batedores batedores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batedores
    ADD CONSTRAINT batedores_cpf_key UNIQUE (cpf);


--
-- Name: batedores batedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batedores
    ADD CONSTRAINT batedores_pkey PRIMARY KEY (id);


--
-- Name: calculos_cloracao calculos_cloracao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculos_cloracao
    ADD CONSTRAINT calculos_cloracao_pkey PRIMARY KEY (id);


--
-- Name: checklists checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_pkey PRIMARY KEY (id);


--
-- Name: historico_gestor historico_gestor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_gestor
    ADD CONSTRAINT historico_gestor_pkey PRIMARY KEY (id);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: requisitos_selos requisitos_selos_batedor_id_tipo_selo_numero_requisito_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisitos_selos
    ADD CONSTRAINT requisitos_selos_batedor_id_tipo_selo_numero_requisito_key UNIQUE (batedor_id, tipo_selo, numero_requisito);


--
-- Name: requisitos_selos requisitos_selos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisitos_selos
    ADD CONSTRAINT requisitos_selos_pkey PRIMARY KEY (id);


--
-- Name: selos selos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selos
    ADD CONSTRAINT selos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_analises_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analises_batedor ON public.analises USING btree (batedor_id);


--
-- Name: idx_analises_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analises_data ON public.analises USING btree (data_analise);


--
-- Name: idx_analises_gestor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analises_gestor ON public.analises USING btree (gestor_id);


--
-- Name: idx_analises_resultado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analises_resultado ON public.analises USING btree (resultado);


--
-- Name: idx_batedores_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batedores_cpf ON public.batedores USING btree (cpf);


--
-- Name: idx_batedores_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batedores_status ON public.batedores USING btree (status_aprovacao);


--
-- Name: idx_calculos_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calculos_batedor ON public.calculos_cloracao USING btree (batedor_id);


--
-- Name: idx_checklists_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_batedor ON public.checklists USING btree (batedor_id);


--
-- Name: idx_checklists_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checklists_data ON public.checklists USING btree (data_checklist);


--
-- Name: idx_historico_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_batedor ON public.historico_gestor USING btree (batedor_id);


--
-- Name: idx_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_data ON public.historico_gestor USING btree (data_acao);


--
-- Name: idx_historico_gestor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_gestor ON public.historico_gestor USING btree (gestor_id);


--
-- Name: idx_notificacoes_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_batedor ON public.notificacoes USING btree (batedor_id);


--
-- Name: idx_notificacoes_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_lida ON public.notificacoes USING btree (lida);


--
-- Name: idx_notificacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_id);


--
-- Name: idx_requisitos_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requisitos_batedor ON public.requisitos_selos USING btree (batedor_id);


--
-- Name: idx_selos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selos_ativo ON public.selos USING btree (ativo);


--
-- Name: idx_selos_batedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_selos_batedor ON public.selos USING btree (batedor_id);


--
-- Name: idx_usuarios_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);


--
-- Name: analises trg_registrar_analise; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_registrar_analise AFTER INSERT ON public.analises FOR EACH ROW EXECUTE FUNCTION public.registrar_acao_gestor();


--
-- Name: analises trg_update_analise_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_analise_updated_at BEFORE UPDATE ON public.analises FOR EACH ROW EXECUTE FUNCTION public.update_analise_updated_at();


--
-- Name: batedores update_batedores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_batedores_updated_at BEFORE UPDATE ON public.batedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analises analises_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analises
    ADD CONSTRAINT analises_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: analises analises_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analises
    ADD CONSTRAINT analises_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: batedores batedores_gestor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batedores
    ADD CONSTRAINT batedores_gestor_responsavel_id_fkey FOREIGN KEY (gestor_responsavel_id) REFERENCES public.usuarios(id);


--
-- Name: batedores batedores_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batedores
    ADD CONSTRAINT batedores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: calculos_cloracao calculos_cloracao_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculos_cloracao
    ADD CONSTRAINT calculos_cloracao_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: checklists checklists_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: checklists checklists_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT checklists_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id);


--
-- Name: historico_gestor historico_gestor_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_gestor
    ADD CONSTRAINT historico_gestor_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: historico_gestor historico_gestor_gestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_gestor
    ADD CONSTRAINT historico_gestor_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: notificacoes notificacoes_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: requisitos_selos requisitos_selos_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requisitos_selos
    ADD CONSTRAINT requisitos_selos_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- Name: selos selos_batedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.selos
    ADD CONSTRAINT selos_batedor_id_fkey FOREIGN KEY (batedor_id) REFERENCES public.batedores(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict CobghJKkWgyoxYbywtINebjdp2ewLvSOtgwLdbi56UW6yqxadMBrLfUT5gQNAK7

