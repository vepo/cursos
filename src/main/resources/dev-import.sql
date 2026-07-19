-- Cursos local seed. Login uses Passport (http://localhost:8080).
-- After Passport `%dev` clean seed order: guest-user=1, cto-boss=2, junior=3.
-- Password for all Passport seed users: qwas1234

-- 1. Categories
INSERT INTO tb_categories (name, slug) VALUES
    ('Java', 'java'),
    ('Backend', 'backend'),
    ('Frontend', 'frontend')
ON CONFLICT DO NOTHING;

-- 2. Published course taught by cto-boss (Passport id 2)
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Introdução ao Quarkus',
    'Aprenda REST APIs com Quarkus e PostgreSQL.',
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

-- Course image assets (cover + gallery) — 1x1 PNG
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

-- Ordered aulas: markdown, link, and a tiny seeded video for local playback tests
INSERT INTO tb_course_items (
    course_id, title, item_type, sort_order, markdown_body, created_at, updated_at
)
SELECT c.id, item.title, 'MARKDOWN', item.sort_order, item.body, NOW(), NOW()
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

UPDATE tb_course_items i
SET markdown_body = E'# Bem-vindo\n\nPrimeira **aula** do curso. Conclua para liberar a próxima.\n\n![Diagrama](course-asset:'
                    || a.id::text || E')'
FROM tb_courses c
JOIN tb_course_image_assets a ON a.course_id = c.id AND a.filename = 'gallery-diagram.png'
WHERE i.course_id = c.id
  AND c.title = 'Introdução ao Quarkus'
  AND i.sort_order = 0
  AND i.markdown_body NOT LIKE '%course-asset:%';

INSERT INTO tb_course_items (
    course_id, title, item_type, sort_order, link_url, link_description, created_at, updated_at
)
SELECT c.id,
       'Documentação Quarkus',
       'LINK',
       2,
       'https://quarkus.io/guides/',
       'Guia oficial Quarkus (abre em nova aba).',
       NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 2
  );

INSERT INTO tb_course_resources (content_type, filename, size_bytes, content)
SELECT 'video/mp4', 'demo-clip.mp4', 8, decode('00000018667479706d703432', 'hex')
WHERE NOT EXISTS (SELECT 1 FROM tb_course_resources WHERE filename = 'demo-clip.mp4');

INSERT INTO tb_course_items (
    course_id, title, item_type, sort_order, resource_id, created_at, updated_at
)
SELECT c.id, 'Vídeo de boas-vindas', 'VIDEO', 3, r.id, NOW(), NOW()
FROM tb_courses c
CROSS JOIN tb_course_resources r
WHERE c.title = 'Introdução ao Quarkus'
  AND r.filename = 'demo-clip.mp4'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i
      WHERE i.course_id = c.id AND i.sort_order = 3
  );

-- 3. Published course taught by junior so cto-boss can browse Disponivel / enroll
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
    course_id, title, item_type, sort_order, markdown_body, created_at, updated_at
)
SELECT c.id, 'Introdução ao Angular', 'MARKDOWN', 0,
       E'# Angular\n\nComponentes, rotas e Material.',
       NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Angular na prática'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i WHERE i.course_id = c.id AND i.sort_order = 0
  );

-- 4. Draft course for teacher area
INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Rascunho Angular',
    'Curso em elaboração sobre Angular.',
    'DRAFT',
    2, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Rascunho Angular');

-- 5. Junior enrolled in Quarkus course with first aula completed (later aulas locked)
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

-- 5b. CTO fully concluded on Angular course (catalog Concluído + certificate download)
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

-- 6. Discussion samples on the accessible first aula
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
