-- Schema para Sistema de Reciclaje
-- PostgreSQL Database

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
    email VARCHAR(255),
    password_hash VARCHAR(255), -- Para futuras implementaciones
    avatar_url VARCHAR(500),
    total_points INTEGER DEFAULT 0,
    total_recyclings INTEGER DEFAULT 0,
    current_level VARCHAR(50) DEFAULT 'Hormiga',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de peticiones de revisión (enviadas por estudiantes, revisadas por docentes)
CREATE TABLE IF NOT EXISTS recycling_requests (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student CHECK (
        (SELECT role FROM users WHERE id = student_id) = 'student'
    )
);

-- Tabla de registros de reciclaje (creados cuando se aprueba una petición)
CREATE TABLE IF NOT EXISTS recycling_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL CHECK (category_id BETWEEN 1 AND 6),
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('kg', 'Unid.', 'unid')),
    points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
    evidence_image_url VARCHAR(500),
    request_id INTEGER REFERENCES recycling_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de badges/logros
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    required_points INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50) -- 'Hormiga', 'Mono', 'Elefante', etc.
);

-- Tabla de badges obtenidos por usuarios
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_recycling_user_id ON recycling_records(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_created_at ON recycling_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_student_id ON recycling_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON recycling_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON recycling_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_reviewed_by ON recycling_requests(reviewed_by);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

