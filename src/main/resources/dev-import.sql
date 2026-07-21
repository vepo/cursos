-- Cursos local seed. Login uses Passport (http://localhost:8080).
-- After Passport `%dev` clean seed order:
--   1 guest-user, 2 cto-boss, 3 junior, 4 alice, 5 bob, 6 carol, 7 diego, 8 mentor
-- Password for all Passport seed users: qwas1234
--
-- Feature coverage map (login as cto-boss unless noted):
--   Catalog filter/sections · teacher publish/draft · enrollments (REQUESTED/ENROLLED/REJECTED)
--   Progress partial/full/concluded · certificate · discussion upvote/hide
--   MARKDOWN + gallery embed · IMAGE · LINK · VIDEO · cover image · second teacher (mentor)

-- =============================================================================
-- 1. Categories
-- =============================================================================
INSERT INTO tb_categories (name, slug) VALUES
    ('Java', 'java'),
    ('Backend', 'backend'),
    ('Frontend', 'frontend'),
    ('DevOps', 'devops'),
    ('Dados', 'dados')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 2. Shared media resources (tiny bytes for local playback / image aulas)
-- =============================================================================
INSERT INTO tb_course_resources (content_type, filename, size_bytes, content)
SELECT 'video/mp4', 'demo-clip.mp4', 8, decode('00000018667479706d703432', 'hex')
WHERE NOT EXISTS (SELECT 1 FROM tb_course_resources WHERE filename = 'demo-clip.mp4');

INSERT INTO tb_course_resources (content_type, filename, size_bytes, content)
SELECT 'image/png', 'seed-aula.png', 70,
       decode('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc00000000300010005fed4ef0000000049454e44ae426082', 'hex')
WHERE NOT EXISTS (SELECT 1 FROM tb_course_resources WHERE filename = 'seed-aula.png');

-- =============================================================================
-- 3. Course: Introdução ao Quarkus (cto-boss) — full item/media/discussion demo
-- =============================================================================
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Introdução ao Quarkus',
    'Aprenda REST APIs com Quarkus e PostgreSQL. Inclui markdown, imagem, link e vídeo.',
    'PUBLISHED',
    2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Introdução ao Quarkus');

INSERT INTO tb_course_categories (course_id, category_id)
SELECT c.id, cat.id
FROM tb_courses c
CROSS JOIN tb_categories cat
WHERE c.title = 'Introdução ao Quarkus'
  AND cat.slug IN ('java', 'backend')
ON CONFLICT DO NOTHING;

INSERT INTO tb_course_image_assets (course_id, content_type, filename, size_bytes, content, created_at)
SELECT c.id, 'image/png', 'cover.png', 70,
       decode('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc00000000300010005fed4ef0000000049454e44ae426082', 'hex'),
       NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_image_assets a
      WHERE a.course_id = c.id AND a.filename = 'cover.png'
  );

INSERT INTO tb_course_image_assets (course_id, content_type, filename, size_bytes, content, created_at)
SELECT c.id, 'image/png', 'gallery-diagram.png', 70,
       decode('89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc00000000300010005fed4ef0000000049454e44ae426082', 'hex'),
       NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_image_assets a
      WHERE a.course_id = c.id AND a.filename = 'gallery-diagram.png'
  );

UPDATE tb_courses c
SET cover_image_asset_id = a.id
FROM tb_course_image_assets a
WHERE c.title = 'Introdução ao Quarkus'
  AND a.course_id = c.id
  AND a.filename = 'cover.png'
  AND c.cover_image_asset_id IS NULL;

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, item.title, item.sort_order, NOW(), NOW()
FROM tb_courses c
CROSS JOIN (
    VALUES
        (0, 'Bem-vindo',
         E'# Bem-vindo\n\nPrimeira **aula** do curso. Conclua para liberar a próxima.'),
        (1, 'Setup do projeto',
         E'# Setup\n\nConfigure o ambiente Quarkus e o banco PostgreSQL.')
) AS item(sort_order, title, body)
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = item.sort_order
  );

UPDATE tb_aula_blocks b
SET markdown_body = E'# Bem-vindo\n\nPrimeira **aula** do curso. Conclua para liberar a próxima.\n\n![Diagrama](course-asset:'
                    || a.id::text || E')'
FROM tb_course_items i
JOIN tb_courses c ON c.id = i.course_id
JOIN tb_course_image_assets a ON a.course_id = c.id AND a.filename = 'gallery-diagram.png'
WHERE b.course_item_id = i.id
  AND c.title = 'Introdução ao Quarkus'
  AND i.sort_order = 0
  AND b.block_type = 'MARKDOWN'
  AND b.markdown_body NOT LIKE '%course-asset:%';

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, 'Diagrama da arquitetura', 2, NOW(), NOW()
FROM tb_courses c
CROSS JOIN tb_course_resources r
WHERE c.title = 'Introdução ao Quarkus'
  AND r.filename = 'seed-aula.png'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 2
  );

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id,
       'Documentação Quarkus',
       3,
       NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 3
  );

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, 'Vídeo de boas-vindas', 4, NOW(), NOW()
FROM tb_courses c
CROSS JOIN tb_course_resources r
WHERE c.title = 'Introdução ao Quarkus'
  AND r.filename = 'demo-clip.mp4'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 4
  );

-- =============================================================================
-- 4. Course: Angular na prática (junior) — available to cto + certificate demo
-- =============================================================================
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Angular na prática',
    'SPA com Angular Material e APIs REST.',
    'PUBLISHED',
    3, 'junior', 'Junior Developer', 'junior_dev@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Angular na prática');

INSERT INTO tb_course_categories (course_id, category_id)
SELECT c.id, cat.id
FROM tb_courses c
CROSS JOIN tb_categories cat
WHERE c.title = 'Angular na prática'
  AND cat.slug = 'frontend'
ON CONFLICT DO NOTHING;

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, item.title, item.sort_order, NOW(), NOW()
FROM tb_courses c
CROSS JOIN (
    VALUES
        (0, 'Introdução ao Angular',
         E'# Angular\n\nComponentes, rotas e Material.'),
        (1, 'Consumindo APIs',
         E'# HTTP\n\nUse `HttpClient` com interceptors JWT.'),
        (2, 'Formulários e validação',
         E'# Forms\n\nReactive forms e Material form fields.')
) AS item(sort_order, title, body)
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = item.sort_order
  );

-- =============================================================================
-- 5. Draft courses (teacher area — Rascunho)
-- =============================================================================
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Rascunho Angular',
    'Curso em elaboração sobre Angular avançado.',
    'DRAFT',
    2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Rascunho Angular');

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, 'Outline', 0, NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Rascunho Angular'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i WHERE i.course_id = c.id AND i.sort_order = 0
  );

-- =============================================================================
-- 6. Course: PostgreSQL na prática (cto-boss) — catalog volume + mid progress
-- =============================================================================
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'PostgreSQL na prática',
    'Modelagem, índices, JSONB e Flyway no dia a dia.',
    'PUBLISHED',
    2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'PostgreSQL na prática');

INSERT INTO tb_course_categories (course_id, category_id)
SELECT c.id, cat.id
FROM tb_courses c
CROSS JOIN tb_categories cat
WHERE c.title = 'PostgreSQL na prática'
  AND cat.slug IN ('backend', 'dados')
ON CONFLICT DO NOTHING;

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, item.title, item.sort_order, NOW(), NOW()
FROM tb_courses c
CROSS JOIN (
    VALUES
        (0, 'Modelagem relacional',
         E'# Modelagem\n\nChaves, FKs e normalização.'),
        (1, 'Índices e EXPLAIN',
         E'# Performance\n\nQuando criar índices e como ler EXPLAIN.'),
        (2, 'JSONB e migrações',
         E'# JSONB\n\nConsultas e Flyway em ambientes de desenvolvimento.')
) AS item(sort_order, title, body)
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = item.sort_order
  );

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id,
       'Documentação PostgreSQL',
       3,
       NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 3
  );

-- =============================================================================
-- 7. Course: DevOps com containers (mentor) — second teacher + empty available
-- =============================================================================
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'DevOps com containers',
    'Docker, Compose e pipelines simples para apps Quarkus.',
    'PUBLISHED',
    8, 'mentor', 'Ana Mentora', 'mentor@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'DevOps com containers');

INSERT INTO tb_course_categories (course_id, category_id)
SELECT c.id, cat.id
FROM tb_courses c
CROSS JOIN tb_categories cat
WHERE c.title = 'DevOps com containers'
  AND cat.slug = 'devops'
ON CONFLICT DO NOTHING;

INSERT INTO tb_course_items (
    course_id, title, sort_order, created_at, updated_at
)
SELECT c.id, item.title, item.sort_order, NOW(), NOW()
FROM tb_courses c
CROSS JOIN (
    VALUES
        (0, 'Containers 101',
         E'# Containers\n\nImagens, volumes e redes.'),
        (1, 'Compose no dia a dia',
         E'# Compose\n\nPostgres + app em um único `compose.yml`.')
) AS item(sort_order, title, body)
WHERE c.title = 'DevOps com containers'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = item.sort_order
  );

INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Rascunho Observabilidade',
    'Ideias sobre métricas e logs (ainda não publicado).',
    'DRAFT',
    8, 'mentor', 'Ana Mentora', 'mentor@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Rascunho Observabilidade');

-- =============================================================================
-- 7b. Aula blocks (content for each seeded aula)
-- =============================================================================

-- Introdução ao Quarkus — markdown aulas 0-1
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, markdown_body, created_at, updated_at)
SELECT i.id, 0, 'MARKDOWN', item.body, NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id
JOIN (
    VALUES
        (0, E'# Bem-vindo\n\nPrimeira **aula** do curso. Conclua para liberar a próxima.'),
        (1, E'# Setup\n\nConfigure o ambiente Quarkus e o banco PostgreSQL.')
) AS item(sort_order, body) ON item.sort_order = i.sort_order
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Introdução ao Quarkus — image aula 2
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, resource_id, created_at, updated_at)
SELECT i.id, 0, 'IMAGE', r.id, NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 2
JOIN tb_course_resources r ON r.filename = 'seed-aula.png'
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Introdução ao Quarkus — link aula 3
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, link_url, link_description, created_at, updated_at)
SELECT i.id, 0, 'LINK', 'https://quarkus.io/guides/', 'Guia oficial Quarkus (abre em nova aba).', NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 3
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Introdução ao Quarkus — video aula 4
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, resource_id, created_at, updated_at)
SELECT i.id, 0, 'VIDEO', r.id, NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 4
JOIN tb_course_resources r ON r.filename = 'demo-clip.mp4'
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Angular na prática
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, markdown_body, created_at, updated_at)
SELECT i.id, 0, 'MARKDOWN', item.body, NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id
JOIN (
    VALUES
        (0, E'# Angular\n\nComponentes, rotas e Material.'),
        (1, E'# HTTP\n\nUse `HttpClient` com interceptors JWT.'),
        (2, E'# Forms\n\nReactive forms e Material form fields.')
) AS item(sort_order, body) ON item.sort_order = i.sort_order
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Rascunho Angular
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, markdown_body, created_at, updated_at)
SELECT i.id, 0, 'MARKDOWN', E'# Outline\n\n- Signals\n- SSR\n- Testes', NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 0
WHERE c.title = 'Rascunho Angular'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- PostgreSQL na prática — markdown
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, markdown_body, created_at, updated_at)
SELECT i.id, 0, 'MARKDOWN', item.body, NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id
JOIN (
    VALUES
        (0, E'# Modelagem\n\nChaves, FKs e normalização.'),
        (1, E'# Performance\n\nQuando criar índices e como ler EXPLAIN.'),
        (2, E'# JSONB\n\nConsultas e Flyway em ambientes de desenvolvimento.')
) AS item(sort_order, body) ON item.sort_order = i.sort_order
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- PostgreSQL na prática — link
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, link_url, link_description, created_at, updated_at)
SELECT i.id, 0, 'LINK', 'https://www.postgresql.org/docs/current/', 'Docs oficiais PostgreSQL.', NOW(), NOW()
FROM tb_courses c
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 3
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- Any remaining items without blocks get a placeholder markdown block
INSERT INTO tb_aula_blocks (course_item_id, sort_order, block_type, markdown_body, created_at, updated_at)
SELECT i.id, 0, 'MARKDOWN', E'# ' || i.title, NOW(), NOW()
FROM tb_course_items i
WHERE NOT EXISTS (SELECT 1 FROM tb_aula_blocks b WHERE b.course_item_id = i.id);

-- =============================================================================
-- 8. Enrollments — Quarkus (cto-boss teacher roster)
-- =============================================================================
-- junior: ENROLLED, first aula done (sequential lock demo)
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 3, 'junior', 'Junior Developer', 'junior_dev@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 3
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 3, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 0
WHERE c.title = 'Introdução ao Quarkus'
  AND e.student_passport_user_id = 3
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

-- alice: ENROLLED, two aulas done (~40%)
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 4, 'alice', 'Alice Santos', 'alice@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 4
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 4, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order IN (0, 1)
WHERE c.title = 'Introdução ao Quarkus'
  AND e.student_passport_user_id = 4
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

-- bob: ENROLLED + concluded (certificate as student on Quarkus)
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, concluded_at, created_at, updated_at
)
SELECT c.id, 5, 'bob', 'Bob Oliveira', 'bob@passport.vepo.dev',
       'ENROLLED', NOW(), NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 5
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 5, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id
WHERE c.title = 'Introdução ao Quarkus'
  AND e.student_passport_user_id = 5
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

-- carol + guest-user: REQUESTED (approve/reject inbox)
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 6, 'carol', 'Carol Mendes', 'carol@passport.vepo.dev',
       'REQUESTED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 6
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 1, 'guest-user', 'Guest User', 'guest@passport.vepo.dev',
       'REQUESTED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 1
  );

-- diego: REJECTED
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 7, 'diego', 'Diego Costa', 'diego@passport.vepo.dev',
       'REJECTED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 7
  );

-- =============================================================================
-- 9. Enrollments — Angular (junior teacher; cto certificate + pending)
-- =============================================================================
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, concluded_at, created_at, updated_at
)
SELECT c.id, 2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
       'ENROLLED', NOW(), NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 2
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 2, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id
WHERE c.title = 'Angular na prática'
  AND e.student_passport_user_id = 2
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 4, 'alice', 'Alice Santos', 'alice@passport.vepo.dev',
       'REQUESTED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 4
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 5, 'bob', 'Bob Oliveira', 'bob@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 5
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 5, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order = 0
WHERE c.title = 'Angular na prática'
  AND e.student_passport_user_id = 5
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

-- =============================================================================
-- 10. Enrollments — PostgreSQL + DevOps
-- =============================================================================
INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 3, 'junior', 'Junior Developer', 'junior_dev@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 3
  );

INSERT INTO tb_item_progress (
    enrollment_id, course_item_id, completed, actor_passport_user_id, updated_at
)
SELECT e.id, i.id, TRUE, 3, NOW()
FROM tb_enrollments e
JOIN tb_courses c ON c.id = e.course_id
JOIN tb_course_items i ON i.course_id = c.id AND i.sort_order IN (0, 1)
WHERE c.title = 'PostgreSQL na prática'
  AND e.student_passport_user_id = 3
  AND NOT EXISTS (
      SELECT 1 FROM tb_item_progress p
      WHERE p.enrollment_id = e.id AND p.course_item_id = i.id
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 6, 'carol', 'Carol Mendes', 'carol@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'PostgreSQL na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 6
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 4, 'alice', 'Alice Santos', 'alice@passport.vepo.dev',
       'REQUESTED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'DevOps com containers'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 4
  );

INSERT INTO tb_enrollments (
    course_id, student_passport_user_id, student_username, student_name, student_email,
    status, created_at, updated_at
)
SELECT c.id, 2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
       'ENROLLED', NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'DevOps com containers'
  AND NOT EXISTS (
      SELECT 1 FROM tb_enrollments e
      WHERE e.course_id = c.id AND e.student_passport_user_id = 2
  );

-- =============================================================================
-- 11. Discussion samples (Quarkus first aula)
-- =============================================================================
INSERT INTO tb_comments (
    course_item_id,
    author_passport_user_id, author_username, author_name, author_email,
    content, created_at,
    hidden_at,
    moderator_passport_user_id, moderator_username, moderator_name, moderator_email
)
SELECT i.id,
       3, 'junior', 'Junior Developer', 'junior_dev@passport.vepo.dev',
       'Excelente introdução!', NOW(),
       NULL, NULL, NULL, NULL, NULL
FROM tb_course_items i
JOIN tb_courses c ON c.id = i.course_id
WHERE c.title = 'Introdução ao Quarkus'
  AND i.sort_order = 0
  AND NOT EXISTS (
      SELECT 1 FROM tb_comments cm
      WHERE cm.course_item_id = i.id
        AND cm.author_passport_user_id = 3
        AND cm.content = 'Excelente introdução!'
  );

INSERT INTO tb_comments (
    course_item_id,
    author_passport_user_id, author_username, author_name, author_email,
    content, created_at,
    hidden_at,
    moderator_passport_user_id, moderator_username, moderator_name, moderator_email
)
SELECT i.id,
       4, 'alice', 'Alice Santos', 'alice@passport.vepo.dev',
       'Alguém já testou com Java 21?', NOW(),
       NULL, NULL, NULL, NULL, NULL
FROM tb_course_items i
JOIN tb_courses c ON c.id = i.course_id
WHERE c.title = 'Introdução ao Quarkus'
  AND i.sort_order = 0
  AND NOT EXISTS (
      SELECT 1 FROM tb_comments cm
      WHERE cm.course_item_id = i.id
        AND cm.author_passport_user_id = 4
        AND cm.content = 'Alguém já testou com Java 21?'
  );

INSERT INTO tb_comments (
    course_item_id,
    author_passport_user_id, author_username, author_name, author_email,
    content, created_at,
    hidden_at,
    moderator_passport_user_id, moderator_username, moderator_name, moderator_email
)
SELECT i.id,
       3, 'junior', 'Junior Developer', 'junior_dev@passport.vepo.dev',
       'Comentário oculto pelo professor.', NOW(),
       NOW(),
       2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev'
FROM tb_course_items i
JOIN tb_courses c ON c.id = i.course_id
WHERE c.title = 'Introdução ao Quarkus'
  AND i.sort_order = 0
  AND NOT EXISTS (
      SELECT 1 FROM tb_comments cm
      WHERE cm.course_item_id = i.id
        AND cm.content = 'Comentário oculto pelo professor.'
  );

INSERT INTO tb_comment_upvotes (
    comment_id,
    voter_passport_user_id, voter_username, voter_name, voter_email,
    created_at
)
SELECT cm.id,
       2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
       NOW()
FROM tb_comments cm
JOIN tb_course_items i ON i.id = cm.course_item_id
JOIN tb_courses c ON c.id = i.course_id
WHERE c.title = 'Introdução ao Quarkus'
  AND cm.content = 'Excelente introdução!'
  AND NOT EXISTS (
      SELECT 1 FROM tb_comment_upvotes u
      WHERE u.comment_id = cm.id AND u.voter_passport_user_id = 2
  );

INSERT INTO tb_comment_upvotes (
    comment_id,
    voter_passport_user_id, voter_username, voter_name, voter_email,
    created_at
)
SELECT cm.id,
       5, 'bob', 'Bob Oliveira', 'bob@passport.vepo.dev',
       NOW()
FROM tb_comments cm
JOIN tb_course_items i ON i.id = cm.course_item_id
JOIN tb_courses c ON c.id = i.course_id
WHERE c.title = 'Introdução ao Quarkus'
  AND cm.content = 'Alguém já testou com Java 21?'
  AND NOT EXISTS (
      SELECT 1 FROM tb_comment_upvotes u
      WHERE u.comment_id = cm.id AND u.voter_passport_user_id = 5
  );
