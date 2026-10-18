--
-- PostgreSQL database dump
--

\restrict ER1KZge10Q1wms96dSOHj5AhToWmcqxQoPfqCqzMUrnC372GocXwxvCdjhjBwgo

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

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

--
-- Name: claim_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.claim_status AS ENUM (
    'PENDENTE',
    'APROVADA',
    'REJEITADA'
);


ALTER TYPE public.claim_status OWNER TO postgres;

--
-- Name: item_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.item_status AS ENUM (
    'PERDIDO',
    'ENCONTRADO',
    'EM_NEGOCIACAO',
    'DEVOLVIDO',
    'CANCELADO'
);


ALTER TYPE public.item_status OWNER TO postgres;

--
-- Name: item_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.item_type AS ENUM (
    'PERDIDO',
    'ENCONTRADO'
);


ALTER TYPE public.item_type OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'MATCH_FOUND',
    'CLAIM_RECEIVED',
    'CLAIM_UPDATED',
    'NEW_MESSAGE'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claims (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    requester_id uuid NOT NULL,
    proof_description text NOT NULL,
    status public.claim_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    lost_item_id uuid
);


ALTER TABLE public.claims OWNER TO postgres;

--
-- Name: item_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_images (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    image_url character varying(500) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.item_images OWNER TO postgres;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    category_id integer NOT NULL,
    type public.item_type NOT NULL,
    title character varying(150) NOT NULL,
    description text NOT NULL,
    secret_details text,
    location_name character varying(255) NOT NULL,
    event_date timestamp with time zone NOT NULL,
    status public.item_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    height_cm numeric(8,2),
    width_cm numeric(8,2)
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    item_id uuid,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    type public.notification_type NOT NULL,
    is_read boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reported_user_id uuid,
    reported_item_id uuid,
    reason text NOT NULL,
    is_resolved boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolution_action character varying(30),
    resolution_notes text,
    resolved_at timestamp with time zone,
    resolved_by uuid
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: return_signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.return_signatures (
    id uuid NOT NULL,
    claim_id uuid NOT NULL,
    signer_id uuid NOT NULL,
    signer_name character varying(150) NOT NULL,
    signer_cpf character varying(11) NOT NULL,
    signer_email character varying(150) NOT NULL,
    document text NOT NULL,
    document_hash character varying(64) NOT NULL,
    method character varying(30) NOT NULL,
    code_hash character varying(64),
    expires_at timestamp with time zone,
    sent_at timestamp with time zone,
    attempts integer NOT NULL,
    send_count integer NOT NULL,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.return_signatures OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewed_user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_reviews_rating_range CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status_history (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    changed_by uuid,
    previous_status public.item_status,
    new_status public.item_status NOT NULL,
    note character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.status_history OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cpf character varying(11)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
b47d03e916a2
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, created_at, updated_at) FROM stdin;
1	Eletrônicos	Celulares, fones, notebooks, carregadores e outros eletrônicos	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
2	Documentos	RG, CPF, CNH, cartões e documentos pessoais	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
3	Acessórios	Relógios, óculos, pulseiras e acessórios pessoais	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
5	Chaves	Chaves residenciais, veículos e chaveiros	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
6	Bolsas e mochilas	Bolsas, mochilas, estojos e similares	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
7	Material acadêmico	Cadernos, livros, apostilas e materiais escolares	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
8	Outros	Objetos que não se encaixam nas demais categorias	2026-09-12 19:06:20.251013+00	2026-09-12 19:06:20.251013+00
9	eletrodomesticos	fogão , mesa , sala	2026-10-10 21:59:44.27169+00	2026-10-10 21:59:44.27169+00
\.


--
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.claims (id, item_id, requester_id, proof_description, status, created_at, updated_at, lost_item_id) FROM stdin;
f9dfe161-0820-4299-a785-c86fc473593d	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	o objeto começa com a letra p	APROVADA	2026-10-03 21:36:44.674651+00	2026-10-03 21:40:43.865524+00	9da0214f-efe1-4319-80a0-972d391de51d
\.


--
-- Data for Name: item_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_images (id, item_id, image_url, created_at, updated_at) FROM stdin;
f9cbfe8b-3ee5-4fe7-8037-49ea1f749fdf	c2687aea-5904-49eb-8b00-7f0e4dcd3e68	/uploads/items/c2687aea-5904-49eb-8b00-7f0e4dcd3e68/7c0ee6c6-88fb-4fcb-b6d6-ad2b422d2cda.webp	2026-09-13 00:09:11.89523+00	2026-09-13 00:09:11.89523+00
e29e3564-6727-4bc3-b1f4-98bc2e889ecd	c2687aea-5904-49eb-8b00-7f0e4dcd3e68	/uploads/items/c2687aea-5904-49eb-8b00-7f0e4dcd3e68/a03fb9a9-abee-4612-86db-d256c1ceaadb.jpeg	2026-09-13 00:09:11.89523+00	2026-09-13 00:09:11.89523+00
fbc6d3d2-cf9a-461c-93f6-dabd2510c7e0	c2687aea-5904-49eb-8b00-7f0e4dcd3e68	/uploads/items/c2687aea-5904-49eb-8b00-7f0e4dcd3e68/19a36006-8311-413f-b631-d817d5174cd5.jpg	2026-09-13 00:09:11.89523+00	2026-09-13 00:09:11.89523+00
c68d82e4-9fab-43ac-9dea-53104a719002	e6ea4091-faf5-4aeb-a529-bb4f23ac118b	/uploads/items/e6ea4091-faf5-4aeb-a529-bb4f23ac118b/1e55b546-2729-4151-82f8-f8e0998c7333.jpg	2026-09-13 00:17:54.04206+00	2026-09-13 00:17:54.04206+00
25719ffc-b3d6-4b05-b496-e8d0e0e9d8c5	e6ea4091-faf5-4aeb-a529-bb4f23ac118b	/uploads/items/e6ea4091-faf5-4aeb-a529-bb4f23ac118b/613c9591-2c1f-4701-92a3-0ee630bbe1d8.jpeg	2026-09-13 00:17:54.04206+00	2026-09-13 00:17:54.04206+00
2a46e592-fb5f-45b8-bbca-ad766463bf72	e6ea4091-faf5-4aeb-a529-bb4f23ac118b	/uploads/items/e6ea4091-faf5-4aeb-a529-bb4f23ac118b/9fa24392-48e9-4b6e-a74b-1564b035eb03.webp	2026-09-13 00:17:54.04206+00	2026-09-13 00:17:54.04206+00
0242f361-2a78-44d1-9750-baab1762edb1	af9f1418-be03-4766-b052-d68094de6c90	/uploads/items/af9f1418-be03-4766-b052-d68094de6c90/414ee63e-b1e5-4d63-a664-75eb20755d57.jpg	2026-09-13 00:20:33.051389+00	2026-09-13 00:20:33.051389+00
08a57b43-826e-41dd-88ba-e3c96123a2ef	af9f1418-be03-4766-b052-d68094de6c90	/uploads/items/af9f1418-be03-4766-b052-d68094de6c90/61d64177-9841-41f1-b9a2-6dfd44c67e08.webp	2026-09-13 00:20:33.051389+00	2026-09-13 00:20:33.051389+00
d7401b8a-1d71-40d4-abcd-56b942bb63e7	cbe43bbd-af06-42ff-b3b3-ad69f32c27a9	/uploads/items/cbe43bbd-af06-42ff-b3b3-ad69f32c27a9/dc1d0464-e02b-4b1a-979c-89596db5b3e5.jpeg	2026-09-25 01:42:04.180309+00	2026-09-25 01:42:04.180309+00
4763299c-302f-4b40-bfdd-53059fb18957	cbe43bbd-af06-42ff-b3b3-ad69f32c27a9	/uploads/items/cbe43bbd-af06-42ff-b3b3-ad69f32c27a9/9c72fe04-4099-424b-ac80-b3c920bd08a6.jpg	2026-09-25 01:42:04.180309+00	2026-09-25 01:42:04.180309+00
81e39bb0-61e1-4cb0-aec0-e3c300a5d2e9	cdd574eb-cd18-407b-9dc0-f926a7d362de	/uploads/items/cdd574eb-cd18-407b-9dc0-f926a7d362de/3a4e2e4f-de5a-41c3-b607-b937f2cd16bb.jpeg	2026-10-17 03:23:41.769206+00	2026-10-17 03:23:41.769206+00
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, user_id, category_id, type, title, description, secret_details, location_name, event_date, status, created_at, updated_at, height_cm, width_cm) FROM stdin;
c2687aea-5904-49eb-8b00-7f0e4dcd3e68	285c4066-e193-41cd-8831-2a068196cfd9	1	PERDIDO	Iphone 12	Iphone 12 Branco com 256 gigas de memoria interna o iphone é da cor branca possui uma capinha vermelha e uma foto de perfil de um cachorro	ele possui um adesivo na parte de tras de um relampago e possui um trincado na tela	estacionamento	2026-09-11 15:00:00+00	PERDIDO	2026-09-13 00:09:11.813594+00	2026-09-13 00:09:11.813594+00	\N	\N
e6ea4091-faf5-4aeb-a529-bb4f23ac118b	8c6bcd38-ca7d-4d7d-9ea6-7bc72ad4cc86	1	PERDIDO	iphone	Iphone 12 o pionhe é da cor branca e foi perdido com uma capinha vermelha	o iphone tem uma foto de perfil de um cachorro e possui um tricando na tela	estacionamento	2026-09-09 15:20:00+00	PERDIDO	2026-09-13 00:17:54.003799+00	2026-09-13 00:17:54.003799+00	\N	\N
af9f1418-be03-4766-b052-d68094de6c90	8c6bcd38-ca7d-4d7d-9ea6-7bc72ad4cc86	6	PERDIDO	Mochila nike	Mochila de costas da nike com a cor preta e a mochila possui 4 zipers/bolsos	a mochila posui 1 adsivo em cada alsa da nike e a cor dos simbolos são brancas alem da cor do simbolo principal ser branca tabem	blibioteca	2026-09-08 19:20:00+00	PERDIDO	2026-09-13 00:20:32.981412+00	2026-09-13 00:20:32.981412+00	50.00	50.00
d3ec878d-9bbc-4b0f-aa07-9f2ba2c4b15b	6e1611ec-9651-4e17-b651-984d64fe23da	3	PERDIDO	efef	fefe3r3rfef	fefefef	estacionamento	2026-09-09 00:21:00+00	PERDIDO	2026-09-13 22:19:11.771468+00	2026-09-13 22:19:11.771468+00	\N	\N
44c3c66b-29c9-4e3a-abf7-eb43020b013c	a78ecf46-6afa-467c-af92-cb726a987c73	6	PERDIDO	ewrewr2eqw	rewfwefewfew3	fq2er2e	fewq	2026-09-21 22:19:00+00	PERDIDO	2026-09-13 22:19:55.06567+00	2026-09-13 22:19:55.06567+00	\N	\N
5c9738b6-9896-48b0-b224-d777c27e43ec	a78ecf46-6afa-467c-af92-cb726a987c73	5	PERDIDO	2erf2egf	fewf2eq24rer2eqr2qe	g3wgr3gr3g	fewq	2026-09-17 01:20:00+00	PERDIDO	2026-09-13 22:20:17.24053+00	2026-09-13 22:20:17.24053+00	\N	\N
cbe43bbd-af06-42ff-b3b3-ad69f32c27a9	9afc8b4e-be92-4e72-b119-cc6dd1954df8	1	PERDIDO	Celular	Iphone 15 pro max cor branca capinha transparente	ele tem a tela tricanda na parte superior e possui um adesivo na capinha	laboratorio	2026-09-23 15:00:00+00	PERDIDO	2026-09-25 01:42:04.062505+00	2026-09-25 01:42:04.062505+00	\N	\N
19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	3	ENCONTRADO	ppp	pppppppppppppppppppppppppppppppppppppppppppppppppppppp	ppp	estacionamento	2026-10-15 23:51:00+00	EM_NEGOCIACAO	2026-10-03 20:51:54.842621+00	2026-10-03 21:40:43.865524+00	\N	\N
9da0214f-efe1-4319-80a0-972d391de51d	a78ecf46-6afa-467c-af92-cb726a987c73	3	PERDIDO	ppp	ppppppppppppppppppppppppppppp	ppp	estacionamento	2026-10-16 22:50:00+00	EM_NEGOCIACAO	2026-10-03 20:50:19.743198+00	2026-10-03 21:40:43.865524+00	\N	\N
c32e7b55-0ab9-402d-93e8-54a05afe9526	bf843dfb-2c0c-41f4-9b3f-6aa7236f724f	3	PERDIDO	fone	fone de ouvido branco	fone de ouvido branco	estacionamento	2026-10-16 00:53:00+00	PERDIDO	2026-10-10 21:50:26.641874+00	2026-10-10 21:50:26.641874+00	\N	\N
6d4b8209-7f44-4e3f-ba75-72a50b364c29	d8cb3d2d-ecca-460e-a4f9-217f014d3534	3	ENCONTRADO	fone	fone de ouvido branco	fone de ouvido branco	fone de ouvido branco	2026-10-29 01:00:00+00	ENCONTRADO	2026-10-10 21:56:26.938349+00	2026-10-10 21:56:26.938349+00	\N	\N
d8fcba76-f5bf-4b68-a4a1-ae1e5278707c	d8cb3d2d-ecca-460e-a4f9-217f014d3534	3	ENCONTRADO	fdgsgfdgaad	gfdhdahgfdh	gfsjfgjfhdjjhgd	dsfsdgfdsg	2026-10-07 23:25:00+00	ENCONTRADO	2026-10-12 20:25:27.196395+00	2026-10-12 20:25:27.196395+00	\N	\N
89519379-18e1-46a5-b6bd-2e778934968b	d8cb3d2d-ecca-460e-a4f9-217f014d3534	3	ENCONTRADO	celular	celular branco	tem um risco na tela 	estacionamento	2026-10-20 03:28:00+00	ENCONTRADO	2026-10-17 03:25:22.296308+00	2026-10-17 03:25:22.296308+00	\N	\N
cdd574eb-cd18-407b-9dc0-f926a7d362de	6352201b-3a62-4480-bd2a-2582e9a9a062	1	PERDIDO	celular	celular branco	tem um risco na tela	estacionamento	2026-10-21 06:23:00+00	ENCONTRADO	2026-10-17 03:23:41.64645+00	2026-10-17 03:33:11.886939+00	\N	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, item_id, sender_id, receiver_id, content, created_at, updated_at) FROM stdin;
cc327912-50e2-4993-997c-de73fdbce7a2	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	cca340d9-8559-4110-b4a2-f8c0b5cf81f0	ola acho que esse item seja meu	2026-10-14 02:45:33.504512+00	2026-10-14 02:45:33.504512+00
33fd7274-4973-48e7-9a16-ecd0309a213b	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	cca340d9-8559-4110-b4a2-f8c0b5cf81f0	ola acho que esse item seja meu	2026-10-14 02:47:25.42642+00	2026-10-14 02:47:25.42642+00
ba63e52e-1580-480f-8bea-ce43e493476a	19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	a78ecf46-6afa-467c-af92-cb726a987c73	opa tudo bem ??	2026-10-14 02:47:55.623731+00	2026-10-14 02:47:55.623731+00
d2ced0dc-6cce-430b-978a-5a1961c94c64	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	d8cb3d2d-ecca-460e-a4f9-217f014d3534	opa tudo sim e com voçê ?	2026-10-14 02:55:14.246298+00	2026-10-14 02:55:14.246298+00
48c3a293-648a-4818-a45b-81d8e16d7127	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	d8cb3d2d-ecca-460e-a4f9-217f014d3534	bem tabem graas a deus oque faiz de bom	2026-10-14 03:21:46.585866+00	2026-10-14 03:21:46.585866+00
0213d968-a3c7-4b29-ad96-82a500507af5	19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	a78ecf46-6afa-467c-af92-cb726a987c73	nada e vc	2026-10-14 03:22:27.413806+00	2026-10-14 03:22:27.413806+00
b124c4cb-fb33-47f6-ae78-540d2d0ee3fc	19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	a78ecf46-6afa-467c-af92-cb726a987c73	fdfdggd	2026-10-17 00:55:25.307325+00	2026-10-17 00:55:25.307325+00
eeb12989-2c15-41ce-b0d7-eead77691559	19d1feec-1408-4f69-8f5a-d3d21b88e21a	a78ecf46-6afa-467c-af92-cb726a987c73	d8cb3d2d-ecca-460e-a4f9-217f014d3534	fsffsfsfs	2026-10-17 00:55:39.370545+00	2026-10-17 00:55:39.370545+00
b6a21fc3-cb4b-486a-8a1f-f2df3a33c633	19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	a78ecf46-6afa-467c-af92-cb726a987c73	aopa eai joia teste 123	2026-10-17 00:57:53.650667+00	2026-10-17 00:57:53.650667+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, item_id, title, message, type, is_read, created_at, updated_at) FROM stdin;
0a16ca27-1fbf-486b-bbcc-98d0babeebeb	d8cb3d2d-ecca-460e-a4f9-217f014d3534	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Reivindicação Recebida	Wanderson Santos Lemos abriu uma reivindicação para o item 'ppp'	CLAIM_RECEIVED	f	2026-10-03 21:36:44.674651+00	2026-10-03 21:36:44.674651+00
36d0cea9-0364-4db1-85f8-ab667b7fb1f9	bf843dfb-2c0c-41f4-9b3f-6aa7236f724f	c32e7b55-0ab9-402d-93e8-54a05afe9526	Possível correspondência	O objeto encontrado 'fone' pode corresponder ao seu item perdido 'fone'. Confira as informações e solicite a devolução se for seu.	MATCH_FOUND	f	2026-10-10 21:56:52.513293+00	2026-10-10 21:56:52.513293+00
3c347152-e087-499f-96e0-68a41b9bfdc1	a78ecf46-6afa-467c-af92-cb726a987c73	9da0214f-efe1-4319-80a0-972d391de51d	Possível correspondência	O objeto encontrado 'ppp' pode corresponder ao seu item perdido 'ppp'. Confira as informações e solicite a devolução se for seu.	MATCH_FOUND	t	2026-10-03 20:59:08.526374+00	2026-10-14 02:40:41.421401+00
4b5f8633-18ea-4212-ab17-6f304be5232b	a78ecf46-6afa-467c-af92-cb726a987c73	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Reivindicação Aprovada	Sua reivindicação para o item 'ppp' foi aprovada!	CLAIM_UPDATED	t	2026-10-03 21:40:43.865524+00	2026-10-14 02:40:51.209195+00
79537091-8692-46e5-b474-30030d180f56	a78ecf46-6afa-467c-af92-cb726a987c73	5c9738b6-9896-48b0-b224-d777c27e43ec	Possível correspondência	O objeto encontrado 'fone' pode corresponder ao seu item perdido '2erf2egf'. Confira as informações e solicite a devolução se for seu.	MATCH_FOUND	t	2026-10-12 20:23:22.210797+00	2026-10-14 02:41:09.834227+00
5ef9106d-7bc4-4591-b6d9-71248cbe21f6	cca340d9-8559-4110-b4a2-f8c0b5cf81f0	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Santos Lemos enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-14 02:45:33.504512+00	2026-10-14 02:45:33.504512+00
1550c6ed-4ba5-4654-9101-7c38900c2583	cca340d9-8559-4110-b4a2-f8c0b5cf81f0	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Santos Lemos enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-14 02:47:25.42642+00	2026-10-14 02:47:25.42642+00
69cc2277-5d0a-431a-9986-f498dd803f8c	d8cb3d2d-ecca-460e-a4f9-217f014d3534	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Santos Lemos enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-14 02:55:14.246298+00	2026-10-14 02:55:14.246298+00
271a017c-ad2a-4fcd-ae98-bd1e4c8cf670	a78ecf46-6afa-467c-af92-cb726a987c73	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Admin enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	t	2026-10-14 02:47:55.623731+00	2026-10-14 03:21:26.067225+00
834cc175-2afb-4fb9-a92f-3b9df6cf6354	d8cb3d2d-ecca-460e-a4f9-217f014d3534	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Santos Lemos enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-14 03:21:46.585866+00	2026-10-14 03:21:46.585866+00
bc521f40-e782-45e1-a706-4d2654140e05	a78ecf46-6afa-467c-af92-cb726a987c73	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Admin enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	t	2026-10-14 03:22:27.413806+00	2026-10-17 00:44:08.696127+00
c66afeff-2a92-4ca0-a2a4-330568fefd3d	a78ecf46-6afa-467c-af92-cb726a987c73	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Admin enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-17 00:55:25.307325+00	2026-10-17 00:55:25.307325+00
7fd3280b-6ee9-488c-9df1-15c938179faa	d8cb3d2d-ecca-460e-a4f9-217f014d3534	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Santos Lemos enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-17 00:55:39.370545+00	2026-10-17 00:55:39.370545+00
95932745-4493-4bcd-b123-a420a81af765	a78ecf46-6afa-467c-af92-cb726a987c73	19d1feec-1408-4f69-8f5a-d3d21b88e21a	Nova Mensagem	Wanderson Admin enviou uma mensagem sobre o item 'ppp'	NEW_MESSAGE	f	2026-10-17 00:57:53.650667+00	2026-10-17 00:57:53.650667+00
9d01c474-9250-4808-90ce-4beb60208617	6352201b-3a62-4480-bd2a-2582e9a9a062	cdd574eb-cd18-407b-9dc0-f926a7d362de	Possível correspondência	O objeto encontrado 'celular' pode corresponder ao seu item perdido 'celular'. Confira as informações e solicite a devolução se for seu.	MATCH_FOUND	t	2026-10-17 03:25:53.022095+00	2026-10-17 03:26:30.579754+00
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, reporter_id, reported_user_id, reported_item_id, reason, is_resolved, created_at, updated_at, resolution_action, resolution_notes, resolved_at, resolved_by) FROM stdin;
0b966eb9-423f-4282-89e5-77d6ca698601	bf843dfb-2c0c-41f4-9b3f-6aa7236f724f	\N	9da0214f-efe1-4319-80a0-972d391de51d	por que sim	f	2026-10-10 21:54:38.754646+00	2026-10-10 21:54:38.754646+00	\N	\N	\N	\N
\.


--
-- Data for Name: return_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.return_signatures (id, claim_id, signer_id, signer_name, signer_cpf, signer_email, document, document_hash, method, code_hash, expires_at, sent_at, attempts, send_count, confirmed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, item_id, reviewer_id, reviewed_user_id, rating, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status_history (id, item_id, changed_by, previous_status, new_status, note, created_at, updated_at) FROM stdin;
25e5d223-62b3-456b-b612-4eb92d96db8e	9da0214f-efe1-4319-80a0-972d391de51d	d8cb3d2d-ecca-460e-a4f9-217f014d3534	PERDIDO	EM_NEGOCIACAO	Solicitação #f9dfe161-0820-4299-a785-c86fc473593d aprovada	2026-10-03 21:40:43.865524+00	2026-10-03 21:40:43.865524+00
ffd74d04-04d2-4696-8dbf-6363a975be57	19d1feec-1408-4f69-8f5a-d3d21b88e21a	d8cb3d2d-ecca-460e-a4f9-217f014d3534	ENCONTRADO	EM_NEGOCIACAO	Reivindicação #f9dfe161-0820-4299-a785-c86fc473593d aprovada	2026-10-03 21:40:43.865524+00	2026-10-03 21:40:43.865524+00
75cd1e71-0ad6-4dd6-923c-6b585770e6cf	cdd574eb-cd18-407b-9dc0-f926a7d362de	d8cb3d2d-ecca-460e-a4f9-217f014d3534	PERDIDO	EM_NEGOCIACAO	\N	2026-10-17 03:32:40.80445+00	2026-10-17 03:32:40.80445+00
f6a96fca-6b57-4562-9a89-b5e7f89b5e19	cdd574eb-cd18-407b-9dc0-f926a7d362de	d8cb3d2d-ecca-460e-a4f9-217f014d3534	EM_NEGOCIACAO	ENCONTRADO	\N	2026-10-17 03:33:11.886939+00	2026-10-17 03:33:11.886939+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role, is_active, created_at, updated_at, cpf) FROM stdin;
93eb7f4e-fbd0-401b-9416-67c33ea11bbb	Wanderson Santos Lemos	wanderson@gmail.com	34998138876	$2b$12$j8mqZR747fbydjJweErFYO15Qw1W25rf1l4PHtFGa/s8RQ5wiFXXS	USER	t	2026-08-21 16:51:38.757292+00	2026-08-21 16:51:38.757292+00	\N
0848af01-f205-451e-8447-7bd8bd769a62	Wanderson santos lemos	wlemos@tribanco.com.br	34998138876	$2b$12$ZFt0oUCvwxSscA.aKYK1q.oCJvnyTc7KH2GEV72MYM8H.QSWXUgZ2	USER	t	2026-08-31 19:19:12.643685+00	2026-08-31 19:19:12.643685+00	\N
6e1611ec-9651-4e17-b651-984d64fe23da	Wanderson Santos Lemos	wanderson.2002.2017@gmail.com	34998138876	$2b$12$bNn/4j32.j0a4gALEOZbeuGxKRrQDYdeglZnMMN7Q8MghQ0A4TiQm	USER	t	2026-09-12 22:14:16.55548+00	2026-09-12 22:14:16.55548+00	\N
285c4066-e193-41cd-8831-2a068196cfd9	wanderson santos lemos	wanderson.2017@gmail.com	34998138876	$2b$12$BNYukMBxFRVVfO/Wea3dfOixKL2yVA4VJ3Uu14pj0scTav2vL1Gdi	USER	t	2026-09-13 00:05:25.301056+00	2026-09-13 00:05:25.301056+00	\N
cfcb4495-01c6-4d06-b408-ae869385e4d5	wanderson Santos Lemos	wanderson.2017.2000@gmail.com	34998207712	$2b$12$GWnHSVKqVI1C2WGOqeduteayhFTrzVMXtetAlcsdSf/kxUwKNEa5q	USER	t	2026-09-13 00:06:19.841492+00	2026-09-13 00:06:19.841492+00	\N
8c6bcd38-ca7d-4d7d-9ea6-7bc72ad4cc86	wanderson lemos	wanderson.2017.2005@gmail.com	34998138876	$2b$12$p1.gZm.Fx9/crIwrFYsxYel3Zuif3chIMdQUh.ETleLxwCd77lQyG	USER	t	2026-09-13 00:15:10.840681+00	2026-09-13 00:15:10.840681+00	\N
9afc8b4e-be92-4e72-b119-cc6dd1954df8	Guuilherme	guilherme@gmail.com	34998138876	$2b$12$hAMMQQNrrWN395j7kUNqG.6T.sJWBiEsIKb96vgmoZC2KuhybuRr2	USER	t	2026-09-25 01:36:17.747594+00	2026-09-25 01:36:17.747594+00	\N
d8cb3d2d-ecca-460e-a4f9-217f014d3534	Wanderson Admin	wanderson4002@gmail.com	\N	$2b$12$0T9Es.Y6ozwHnzVWOl4eFuEoii8pSLVZ02Wad//YmEzjMXMhWzG9G	ADMIN	t	2026-09-26 17:17:43.451491+00	2026-09-26 17:17:43.451491+00	\N
bf843dfb-2c0c-41f4-9b3f-6aa7236f724f	joao	joao@gmail.com	34998138876	$2b$12$/GVi07hEier1JA006iO1R.XAHRPiqCehwJecMKForwvG88Oa2Mxz2	USER	t	2026-10-10 21:49:31.978374+00	2026-10-10 21:49:31.978374+00	\N
a78ecf46-6afa-467c-af92-cb726a987c73	Wanderson Santos Lemos	wanderson.2002.2017@edu.uniube.br	(34)99813-8876	$2b$12$/iYKOjDlzDY91k8dyvg8le6ExqibAaRGPFRU8gHGXDnabR2CFZbde	USER	t	2026-08-25 02:03:21.487033+00	2026-10-10 21:58:33.156121+00	\N
cca340d9-8559-4110-b4a2-f8c0b5cf81f0	Usuario Teste	teste@teste.com	34999999999	$2b$12$qOjArLBa7BTcHd0/AAz16.LA18kJ3Hp.8SJDN4R3bFCUUKAXTt8ki	ADMIN	f	2026-08-21 16:07:24.141327+00	2026-10-17 02:19:44.47733+00	\N
6352201b-3a62-4480-bd2a-2582e9a9a062	kevin	kevin@gmail.com	34988138876	$2b$12$.1.nqtbD6lPlYIFSM0eTGeSKgg0X.cSkZleyllzb7.vMMSSizBzIa	USER	t	2026-10-17 03:22:23.375887+00	2026-10-17 03:22:23.375887+00	\N
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 9, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: item_images item_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: return_signatures return_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_signatures
    ADD CONSTRAINT return_signatures_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: status_history status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_pkey PRIMARY KEY (id);


--
-- Name: return_signatures uq_return_signatures_claim; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_signatures
    ADD CONSTRAINT uq_return_signatures_claim UNIQUE (claim_id);


--
-- Name: users uq_users_cpf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_cpf UNIQUE (cpf);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_categories_name ON public.categories USING btree (name);


--
-- Name: ix_claims_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_claims_item_id ON public.claims USING btree (item_id);


--
-- Name: ix_claims_lost_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_claims_lost_item_id ON public.claims USING btree (lost_item_id);


--
-- Name: ix_claims_requester_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_claims_requester_id ON public.claims USING btree (requester_id);


--
-- Name: ix_item_images_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_item_images_item_id ON public.item_images USING btree (item_id);


--
-- Name: ix_items_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_category_id ON public.items USING btree (category_id);


--
-- Name: ix_items_event_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_event_date ON public.items USING btree (event_date);


--
-- Name: ix_items_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_status ON public.items USING btree (status);


--
-- Name: ix_items_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_title ON public.items USING btree (title);


--
-- Name: ix_items_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_user_id ON public.items USING btree (user_id);


--
-- Name: ix_messages_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_messages_item_id ON public.messages USING btree (item_id);


--
-- Name: ix_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: ix_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: ix_notifications_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_item_id ON public.notifications USING btree (item_id);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_reports_reported_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reports_reported_item_id ON public.reports USING btree (reported_item_id);


--
-- Name: ix_reports_reported_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reports_reported_user_id ON public.reports USING btree (reported_user_id);


--
-- Name: ix_reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reports_reporter_id ON public.reports USING btree (reporter_id);


--
-- Name: ix_reviews_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_item_id ON public.reviews USING btree (item_id);


--
-- Name: ix_reviews_reviewed_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_reviewed_user_id ON public.reviews USING btree (reviewed_user_id);


--
-- Name: ix_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);


--
-- Name: ix_status_history_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_status_history_changed_by ON public.status_history USING btree (changed_by);


--
-- Name: ix_status_history_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_status_history_item_id ON public.status_history USING btree (item_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: claims claims_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: claims claims_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: claims fk_claims_lost_item; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT fk_claims_lost_item FOREIGN KEY (lost_item_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: item_images item_images_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_images
    ADD CONSTRAINT item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;


--
-- Name: items items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_reported_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_item_id_fkey FOREIGN KEY (reported_item_id) REFERENCES public.items(id) ON DELETE SET NULL;


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: return_signatures return_signatures_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_signatures
    ADD CONSTRAINT return_signatures_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.claims(id) ON DELETE RESTRICT;


--
-- Name: return_signatures return_signatures_signer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.return_signatures
    ADD CONSTRAINT return_signatures_signer_id_fkey FOREIGN KEY (signer_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: reviews reviews_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewed_user_id_fkey FOREIGN KEY (reviewed_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: status_history status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: status_history status_history_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ER1KZge10Q1wms96dSOHj5AhToWmcqxQoPfqCqzMUrnC372GocXwxvCdjhjBwgo

