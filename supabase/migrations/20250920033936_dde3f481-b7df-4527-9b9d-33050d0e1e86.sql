-- Adicionar código único de 6 dígitos para cada clínica
ALTER TABLE clinic_settings 
ADD COLUMN clinic_code TEXT UNIQUE;

-- Adicionar código da clínica nos perfis de usuário para identificar a qual clínica pertencem
ALTER TABLE profiles 
ADD COLUMN clinic_code TEXT;

-- Criar função para gerar código de clínica único
CREATE OR REPLACE FUNCTION generate_clinic_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar código de 6 dígitos
        new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM clinic_settings WHERE clinic_code = new_code) INTO code_exists;
        
        -- Se não existe, usar este código
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Gerar código para clínicas existentes que não têm código
UPDATE clinic_settings 
SET clinic_code = generate_clinic_code() 
WHERE clinic_code IS NULL;

-- Criar trigger para gerar código automaticamente em novas clínicas
CREATE OR REPLACE FUNCTION set_clinic_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clinic_code IS NULL THEN
        NEW.clinic_code := generate_clinic_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_clinic_code
    BEFORE INSERT ON clinic_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_clinic_code();

-- Criar função para validar código da clínica no login/cadastro
CREATE OR REPLACE FUNCTION validate_clinic_code(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM clinic_settings WHERE clinic_code = code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;