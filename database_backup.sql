--
-- PostgreSQL database dump
--

-- Dumped from database version 13.20 (Debian 13.20-1.pgdg120+1)
-- Dumped by pg_dump version 13.20 (Debian 13.20-1.pgdg120+1)

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
-- Name: leave_status_enum; Type: TYPE; Schema: public; Owner: dayaway_user
--

CREATE TYPE public.leave_status_enum AS ENUM (
    'Pending',
    'Approved',
    'Denied',
    'Cancelled'
);


ALTER TYPE public.leave_status_enum OWNER TO dayaway_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.employees (
    employee_id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    employment_start_date date NOT NULL,
    manager_id character varying(100),
    annual_leave_accrual_rate numeric(4,2) DEFAULT 1.75 NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.employees OWNER TO dayaway_user;

--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.leave_balances (
    balance_id integer NOT NULL,
    employee_id character varying(100) NOT NULL,
    leave_type_id integer NOT NULL,
    current_balance numeric(6,2) DEFAULT 0.00 NOT NULL,
    last_accrual_date date,
    last_reset_date date,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_balances OWNER TO dayaway_user;

--
-- Name: leave_balances_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: dayaway_user
--

CREATE SEQUENCE public.leave_balances_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leave_balances_balance_id_seq OWNER TO dayaway_user;

--
-- Name: leave_balances_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dayaway_user
--

ALTER SEQUENCE public.leave_balances_balance_id_seq OWNED BY public.leave_balances.balance_id;


--
-- Name: leave_request_documents; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.leave_request_documents (
    document_id integer NOT NULL,
    request_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    storage_path character varying(1024) NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size_bytes bigint NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_request_documents OWNER TO dayaway_user;

--
-- Name: leave_request_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: dayaway_user
--

CREATE SEQUENCE public.leave_request_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leave_request_documents_document_id_seq OWNER TO dayaway_user;

--
-- Name: leave_request_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dayaway_user
--

ALTER SEQUENCE public.leave_request_documents_document_id_seq OWNED BY public.leave_request_documents.document_id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.leave_requests (
    request_id integer NOT NULL,
    employee_id character varying(100) NOT NULL,
    leave_type_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_start_half_day boolean DEFAULT false NOT NULL,
    is_end_half_day boolean DEFAULT false NOT NULL,
    calculated_duration_days numeric(5,1) NOT NULL,
    notes text,
    status public.leave_status_enum DEFAULT 'Pending'::public.leave_status_enum NOT NULL,
    submission_date timestamp with time zone DEFAULT now() NOT NULL,
    approver_id character varying(100),
    decision_date timestamp with time zone,
    is_historical_import boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO dayaway_user;

--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: dayaway_user
--

CREATE SEQUENCE public.leave_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leave_requests_request_id_seq OWNER TO dayaway_user;

--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dayaway_user
--

ALTER SEQUENCE public.leave_requests_request_id_seq OWNED BY public.leave_requests.request_id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.leave_types (
    leave_type_id integer NOT NULL,
    name character varying(100) NOT NULL,
    color_code character varying(7) DEFAULT '#CCCCCC'::character varying,
    requires_approval boolean DEFAULT true NOT NULL,
    deducts_balance boolean DEFAULT true NOT NULL,
    is_system_type boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leave_types OWNER TO dayaway_user;

--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE; Schema: public; Owner: dayaway_user
--

CREATE SEQUENCE public.leave_types_leave_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leave_types_leave_type_id_seq OWNER TO dayaway_user;

--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dayaway_user
--

ALTER SEQUENCE public.leave_types_leave_type_id_seq OWNED BY public.leave_types.leave_type_id;


--
-- Name: public_holidays; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.public_holidays (
    holiday_id integer NOT NULL,
    holiday_date date NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.public_holidays OWNER TO dayaway_user;

--
-- Name: public_holidays_holiday_id_seq; Type: SEQUENCE; Schema: public; Owner: dayaway_user
--

CREATE SEQUENCE public.public_holidays_holiday_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.public_holidays_holiday_id_seq OWNER TO dayaway_user;

--
-- Name: public_holidays_holiday_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dayaway_user
--

ALTER SEQUENCE public.public_holidays_holiday_id_seq OWNED BY public.public_holidays.holiday_id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO dayaway_user;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: dayaway_user
--

CREATE TABLE public.system_settings (
    setting_key character varying(100) NOT NULL,
    setting_value character varying(255) NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO dayaway_user;

--
-- Name: leave_balances balance_id; Type: DEFAULT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN balance_id SET DEFAULT nextval('public.leave_balances_balance_id_seq'::regclass);


--
-- Name: leave_request_documents document_id; Type: DEFAULT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_request_documents ALTER COLUMN document_id SET DEFAULT nextval('public.leave_request_documents_document_id_seq'::regclass);


--
-- Name: leave_requests request_id; Type: DEFAULT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN request_id SET DEFAULT nextval('public.leave_requests_request_id_seq'::regclass);


--
-- Name: leave_types leave_type_id; Type: DEFAULT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN leave_type_id SET DEFAULT nextval('public.leave_types_leave_type_id_seq'::regclass);


--
-- Name: public_holidays holiday_id; Type: DEFAULT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.public_holidays ALTER COLUMN holiday_id SET DEFAULT nextval('public.public_holidays_holiday_id_seq'::regclass);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.employees (employee_id, name, email, password_hash, employment_start_date, manager_id, annual_leave_accrual_rate, is_admin, created_at, updated_at) FROM stdin;
admin01	Admin User	admin@example.com	$2b$10$E1i1GrA5TewglCLItfZOuuf2lc/D9vawcOfL4BO17W8xfNGMrx0FG	2024-01-01	\N	1.75	t	2025-04-25 22:40:30.790065+00	2025-04-25 22:40:30.790065+00
emp01	Test Employee	employee@example.com	$2b$10$E1i1GrA5TewglCLItfZOuuf2lc/D9vawcOfL4BO17W8xfNGMrx0FG	2024-02-01	admin01	1.50	f	2025-04-25 22:40:30.790065+00	2025-04-25 22:40:30.790065+00
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.leave_balances (balance_id, employee_id, leave_type_id, current_balance, last_accrual_date, last_reset_date, updated_at) FROM stdin;
1	emp01	1	6.00	\N	\N	2025-04-26 20:16:57.516253+00
\.


--
-- Data for Name: leave_request_documents; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.leave_request_documents (document_id, request_id, file_name, storage_path, file_type, file_size_bytes, uploaded_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.leave_requests (request_id, employee_id, leave_type_id, start_date, end_date, is_start_half_day, is_end_half_day, calculated_duration_days, notes, status, submission_date, approver_id, decision_date, is_historical_import, created_at, updated_at) FROM stdin;
1	emp01	1	2025-04-28	2025-05-02	f	f	4.0	Taking a short break.	Approved	2025-04-26 00:18:12.813115+00	admin01	2025-04-26 21:03:22.824273+00	f	2025-04-26 00:18:12.813115+00	2025-04-26 00:18:12.813115+00
2	emp01	1	2025-04-28	2025-05-02	f	f	4.0	Taking a short break.	Denied	2025-04-26 00:31:47.07985+00	admin01	2025-04-26 21:04:20.808253+00	f	2025-04-26 00:31:47.07985+00	2025-04-26 00:31:47.07985+00
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.leave_types (leave_type_id, name, color_code, requires_approval, deducts_balance, is_system_type, created_at, updated_at) FROM stdin;
1	Annual Leave	#0D6EFD	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
2	Sick Leave	#DC3545	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
3	Family Responsibility Leave	#FFC107	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
4	Maternity Leave	#FD7E14	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
5	Paternity Leave	#6F42C1	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
6	Unpaid Leave	#6C757D	t	f	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
7	Study Leave	#198754	t	t	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
8	Public Holiday	#ADB5BD	f	f	t	2025-04-26 00:02:31.912393+00	2025-04-26 00:02:31.912393+00
\.


--
-- Data for Name: public_holidays; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.public_holidays (holiday_id, holiday_date, name, created_at) FROM stdin;
1	2025-05-01	Workers Day	2025-04-26 00:17:31.786637+00
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.session (sid, sess, expire) FROM stdin;
Dig5sxPqOviHm1sFNwrvVt2vg8O8Maix	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-05-25T23:57:53.649Z","httpOnly":true,"path":"/"},"user":{"id":"admin01","name":"Admin User","email":"admin@example.com","isAdmin":true}}	2025-05-27 21:04:06
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: dayaway_user
--

COPY public.system_settings (setting_key, setting_value, description, updated_at) FROM stdin;
\.


--
-- Name: leave_balances_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dayaway_user
--

SELECT pg_catalog.setval('public.leave_balances_balance_id_seq', 1, true);


--
-- Name: leave_request_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dayaway_user
--

SELECT pg_catalog.setval('public.leave_request_documents_document_id_seq', 1, false);


--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dayaway_user
--

SELECT pg_catalog.setval('public.leave_requests_request_id_seq', 2, true);


--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dayaway_user
--

SELECT pg_catalog.setval('public.leave_types_leave_type_id_seq', 8, true);


--
-- Name: public_holidays_holiday_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dayaway_user
--

SELECT pg_catalog.setval('public.public_holidays_holiday_id_seq', 1, true);


--
-- Name: employees employees_email_key; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_key UNIQUE (email);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (balance_id);


--
-- Name: leave_request_documents leave_request_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_request_documents
    ADD CONSTRAINT leave_request_documents_pkey PRIMARY KEY (document_id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (request_id);


--
-- Name: leave_types leave_types_name_key; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_name_key UNIQUE (name);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (leave_type_id);


--
-- Name: public_holidays public_holidays_holiday_date_key; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.public_holidays
    ADD CONSTRAINT public_holidays_holiday_date_key UNIQUE (holiday_date);


--
-- Name: public_holidays public_holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.public_holidays
    ADD CONSTRAINT public_holidays_pkey PRIMARY KEY (holiday_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_key);


--
-- Name: leave_balances uq_employee_leave_type; Type: CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT uq_employee_leave_type UNIQUE (employee_id, leave_type_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: dayaway_user
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: leave_requests fk_approver_request; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fk_approver_request FOREIGN KEY (approver_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL;


--
-- Name: leave_balances fk_employee_balance; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT fk_employee_balance FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: leave_requests fk_employee_request; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fk_employee_request FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: leave_balances fk_leave_type_balance; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT fk_leave_type_balance FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id) ON DELETE CASCADE;


--
-- Name: leave_requests fk_leave_type_request; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fk_leave_type_request FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id) ON DELETE RESTRICT;


--
-- Name: employees fk_manager; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES public.employees(employee_id) ON DELETE SET NULL;


--
-- Name: leave_request_documents fk_request_document; Type: FK CONSTRAINT; Schema: public; Owner: dayaway_user
--

ALTER TABLE ONLY public.leave_request_documents
    ADD CONSTRAINT fk_request_document FOREIGN KEY (request_id) REFERENCES public.leave_requests(request_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

