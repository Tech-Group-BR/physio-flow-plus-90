-- Inserir clínica padrão para testes
INSERT INTO clinic_settings (name, clinic_code, phone, email, address)
VALUES ('Clínica FisioTech', '123456', '(11) 99999-9999', 'contato@fisiotech.com', 'Rua das Flores, 123 - São Paulo, SP')
ON CONFLICT (clinic_code) DO NOTHING;