-- Datos iniciales (seed data)

-- Insertar badges/logros iniciales
INSERT INTO badges (name, description, required_points, category) VALUES
('Hormiga Iniciante', 'Comienza tu aventura en el reciclaje', 0, 'Hormiga'),
('Hormiga Trabajadora', 'Has reciclado 50 unidades', 200, 'Hormiga'),
('Mono Ágil', 'Has alcanzado 400 puntos', 400, 'Mono'),
('Mono Experto', 'Has alcanzado 600 puntos', 600, 'Mono'),
('Elefante Sabio', 'Has alcanzado 800 puntos', 800, 'Elefante'),
('Gallito Campeón', 'Has alcanzado 1000 puntos', 1000, 'Gallito de las Rocas')
ON CONFLICT DO NOTHING;

-- Nota: Los usuarios se crearán a través de la API cuando se registren

