CREATE TABLE tb_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tb_courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(2000) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL,
    teacher_passport_user_id BIGINT NOT NULL,
    teacher_username VARCHAR(64) NOT NULL,
    teacher_name VARCHAR(200) NOT NULL,
    teacher_email VARCHAR(320) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_courses_teacher ON tb_courses (teacher_passport_user_id);
CREATE INDEX idx_courses_status ON tb_courses (status);

CREATE TABLE tb_course_categories (
    course_id BIGINT NOT NULL REFERENCES tb_courses (id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES tb_categories (id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, category_id)
);

CREATE TABLE tb_course_resources (
    id BIGSERIAL PRIMARY KEY,
    content_type VARCHAR(200) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    content BYTEA NOT NULL
);

CREATE TABLE tb_course_items (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES tb_courses (id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL,
    markdown_body TEXT,
    resource_id BIGINT REFERENCES tb_course_resources (id) ON DELETE SET NULL,
    source_path VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX idx_course_items_order ON tb_course_items (course_id, sort_order);
CREATE UNIQUE INDEX idx_course_items_source_path ON tb_course_items (course_id, source_path)
    WHERE source_path IS NOT NULL;

CREATE TABLE tb_enrollments (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES tb_courses (id) ON DELETE CASCADE,
    student_passport_user_id BIGINT NOT NULL,
    student_username VARCHAR(64) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    student_email VARCHAR(320) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (course_id, student_passport_user_id)
);

CREATE INDEX idx_enrollments_student ON tb_enrollments (student_passport_user_id);

CREATE TABLE tb_item_progress (
    id BIGSERIAL PRIMARY KEY,
    enrollment_id BIGINT NOT NULL REFERENCES tb_enrollments (id) ON DELETE CASCADE,
    course_item_id BIGINT NOT NULL REFERENCES tb_course_items (id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    actor_passport_user_id BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (enrollment_id, course_item_id)
);

CREATE TABLE tb_course_git_repositories (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL UNIQUE REFERENCES tb_courses (id) ON DELETE CASCADE,
    remote_url VARCHAR(1000) NOT NULL,
    default_branch VARCHAR(200) NOT NULL DEFAULT 'main',
    description_path VARCHAR(500) NOT NULL DEFAULT 'course.yml',
    last_synced_sha VARCHAR(64),
    last_synced_at TIMESTAMPTZ,
    status VARCHAR(40) NOT NULL DEFAULT 'LINKED',
    error_summary TEXT,
    webhook_secret_hash VARCHAR(200)
);
