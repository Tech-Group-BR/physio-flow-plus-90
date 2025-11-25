# Limpar Cache e Recarregar Sistema de Pagamentos

## 🧹 Script para Executar no Console do Browser

Abra o DevTools (F12) e execute no Console:

```javascript
// Limpar todo o cache de produtos
localStorage.removeItem('cache_products');
localStorage.removeItem('physioflow_selected_plan');
localStorage.removeItem('physioflow_selected_period');
sessionStorage.clear();

// Recarregar a página
location.reload();
```

## OU execute este script completo:

```javascript
// Script de limpeza completa do cache
console.log('🧹 Limpando cache do PhysioFlow...');

// Limpar localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('cache') || key.includes('physioflow') || key.includes('products'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`  ❌ Removendo: ${key}`);
  localStorage.removeItem(key);
});

// Limpar sessionStorage
sessionStorage.clear();
console.log('  ❌ SessionStorage limpo');

// Recarregar
console.log('✅ Cache limpo! Recarregando página...');
setTimeout(() => location.reload(), 1000);
```

## 📋 Checklist de Verificação

Após limpar o cache e recarregar:

- [ ] Landing page mostra apenas 3 planos (Trimestral, Semestral, Anual)
- [ ] Não aparece "Plano Mensal" em lugar nenhum
- [ ] Página de pagamento mostra 3 opções de período
- [ ] Período padrão selecionado é "Trimestral"
- [ ] Descontos corretos: 10%, 20%, 30%
- [ ] Features detalhadas aparecem em cada plano
- [ ] Badge "Mais Popular" no Semestral
- [ ] Badge "Melhor Oferta" no Anual

## 🔄 Se ainda aparecer o Plano Mensal

Execute no Supabase SQL Editor:

```sql
-- Verificar quantos planos existem
SELECT COUNT(*), name FROM subscription_plans GROUP BY name;

-- Se aparecer "Plano Mensal", deletar:
DELETE FROM subscription_plans WHERE name = 'Plano Mensal';

-- Verificar resultado
SELECT id, name, price, billing_period FROM subscription_plans ORDER BY price;
```

## 🚀 Forçar Reload dos Produtos (se necessário)

Se após limpar o cache ainda não funcionar, execute no Console:

```javascript
// Forçar refetch dos produtos
window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
```
