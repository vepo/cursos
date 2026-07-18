-- Cursos local seed. Login uses Passport (http://localhost:8080).
-- Teacher snapshot ids assume Passport seed user cto-boss (id may vary; prefer UI login).

INSERT INTO tb_categories (name, slug) VALUES
    ('Java', 'java'),
    ('Backend', 'backend'),
    ('Frontend', 'frontend')
ON CONFLICT DO NOTHING;

INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Introdução ao Quarkus',
    'Aprenda REST APIs com Quarkus e PostgreSQL.',
    'PUBLISHED',
    1, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Introdução ao Quarkus');

INSERT INTO tb_course_categories (course_id, category_id)
SELECT c.id, cat.id
FROM tb_courses c
CROSS JOIN tb_categories cat
WHERE c.title = 'Introdução ao Quarkus'
  AND cat.slug IN ('java', 'backend')
ON CONFLICT DO NOTHING;

INSERT INTO tb_course_items (
    course_id, title, item_type, sort_order, markdown_body, created_at, updated_at
)
SELECT c.id, 'Bem-vindo', 'MARKDOWN', 0,
       '# Bem-vindo\n\nEste é o primeiro item do curso.',
       NOW(), NOW()
FROM tb_courses c
WHERE c.title = 'Introdução ao Quarkus'
  AND NOT EXISTS (
      SELECT 1 FROM tb_course_items i WHERE i.course_id = c.id AND i.sort_order = 0
  );

INSERT INTO tb_courses (
    title, summary, status,
    teacher_passport_user_id, teacher_username, teacher_name, teacher_email,
    created_at, updated_at
)
SELECT
    'Rascunho Angular',
    'Curso em elaboração sobre Angular.',
    'DRAFT',
    1, 'cto-boss', 'CTO Boss', 'cto@passport.vepo.dev',
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tb_courses WHERE title = 'Rascunho Angular');
