-- Migración: Crear tabla de peticiones de revisión
-- Este script elimina y recrea la tabla desde cero para asegurar una instalación limpia

-- 1. Eliminar índices si existen (para evitar errores al eliminar la tabla)
DROP INDEX IF EXISTS idx_requests_student_id;
DROP INDEX IF EXISTS idx_requests_status;
DROP INDEX IF EXISTS idx_requests_created_at;
DROP INDEX IF EXISTS idx_requests_reviewed_by;

-- 2. Eliminar columna request_id de recycling_records si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recycling_records' AND column_name = 'request_id'
    ) THEN
        ALTER TABLE recycling_records DROP COLUMN request_id;
    END IF;
END $$;

-- 3. Eliminar tabla recycling_requests si existe (CASCADE para eliminar dependencias)
DROP TABLE IF EXISTS recycling_requests CASCADE;

-- 4. Crear tabla de peticiones de revisión (enviadas por estudiantes, revisadas por docentes)
CREATE TABLE recycling_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL CHECK (category_id BETWEEN 1 AND 6),
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('kg', 'Unid.', 'unid')),
    evidence_image_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    points_awarded INTEGER CHECK (points_awarded >= 0),
    review_message TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Agregar columna request_id a recycling_records
ALTER TABLE recycling_records 
ADD COLUMN request_id INTEGER REFERENCES recycling_requests(id) ON DELETE SET NULL;

-- 6. Crear índices para mejorar rendimiento
CREATE INDEX idx_requests_student_id ON recycling_requests(student_id);
CREATE INDEX idx_requests_status ON recycling_requests(status);
CREATE INDEX idx_requests_created_at ON recycling_requests(created_at DESC);
CREATE INDEX idx_requests_reviewed_by ON recycling_requests(reviewed_by);

