-- Verificar se há dados na tabela products
SELECT * FROM products WHERE is_active = true;

-- Se não houver dados, inserir os dados fornecidos
INSERT INTO products (id, name, description, price, is_active, created_at) 
VALUES 
  ('2fc58504-16ad-4147-9a63-c4ace1b21def', 'Starter', 'Ideal para clínicas pequenas', 21.90, true, '2025-09-29 18:42:30.955269+00'),
  ('c64f9350-7e67-4357-b198-798926e84b8e', 'Professional', 'Para clínicas em crescimento', 49.90, true, '2025-09-29 18:42:30.955269+00'),
  ('f8a11561-81fe-44be-ae1e-1df688bc2146', 'Enterprise', 'Para redes de clínicas', 99.90, true, '2025-09-29 18:42:30.955269+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;