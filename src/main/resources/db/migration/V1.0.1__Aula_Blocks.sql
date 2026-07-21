-- Composite aula: content moves from tb_course_items onto ordered tb_aula_blocks.
-- Baseline V1.0.0 is shipped; this migration is forward-only.

CREATE TABLE tb_aula_blocks (
    id BIGSERIAL PRIMARY KEY,
    course_item_id BIGINT NOT NULL REFERENCES tb_course_items (id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    block_type VARCHAR(20) NOT NULL,
    markdown_body TEXT,
    link_url VARCHAR(2000),
    link_description VARCHAR(2000),
    resource_id BIGINT REFERENCES tb_course_resources (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX idx_aula_blocks_order ON tb_aula_blocks (course_item_id, sort_order);

INSERT INTO tb_aula_blocks (
    course_item_id,
    sort_order,
    block_type,
    markdown_body,
    link_url,
    link_description,
    resource_id,
    created_at,
    updated_at
)
SELECT
    id,
    0,
    item_type,
    markdown_body,
    link_url,
    link_description,
    resource_id,
    created_at,
    updated_at
FROM tb_course_items;

ALTER TABLE tb_course_items DROP COLUMN item_type;
ALTER TABLE tb_course_items DROP COLUMN markdown_body;
ALTER TABLE tb_course_items DROP COLUMN link_url;
ALTER TABLE tb_course_items DROP COLUMN link_description;
ALTER TABLE tb_course_items DROP COLUMN resource_id;
