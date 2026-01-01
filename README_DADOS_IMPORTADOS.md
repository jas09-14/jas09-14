# Sistema de Controle Financeiro 2026

Sistema web completo para controle financeiro baseado na planilha Excel fornecida.

## 📊 Dados Importados da Planilha

✅ **16 Categorias** com dias de vencimento:
1. Manut. Tiggo
2. Mantimento (Dia 20) - R$ 10.800/ano
3. Brisanet (Dia 05) - R$ 959,79/ano
4. Energia (Dia 09) - R$ 1.198,49/ano
5. Cartão C&A (20)
6. Condomínio (Dia 25) - R$ 7.923/ano
7. Inglês do JP (dia 09) - R$ 2.400/ano
8. Internet (Dia 20) - R$ 2.017,44/ano
9. Veículos (Dia 20/28)
10. Gastos extras
11. Cel. Cartão (Dia 25) - R$ 648/ano
12. Visa (Dia 28) - R$ 25.861,80/ano
13. IPTU (Dia 10) - R$ 1.908,13/ano
14. Gastos Diversos - R$ 18.000/ano
15. Parc. IR 2024 - R$ 10.653,14/ano
16. Água (Dia 30) - R$ 1.560/ano

✅ **192 Transações** (16 categorias × 12 meses)
✅ **Total Anual**: R$ 86.766,32
✅ **Média Mensal**: R$ 7.230,53

## 🎨 Funcionalidades

### 1. Dashboard
- Cards de resumo (Total Planejado, Realizado, Diferença)
- Gráfico de Evolução Mensal (barras)
- Gráfico de Distribuição por Categoria (pizza)
- Visão geral do ano inteiro

### 2. Controle Mensal
- Tabela editável com todas as 16 categorias
- Navegação entre meses (Jan-Dez)
- Colunas: Categoria, Vencimento, Planejado, Realizado, Diferença
- Cálculo automático de totais
- Botão Salvar para persistir alterações
- Cores por categoria para fácil identificação

### 3. Categorias
- Gestão completa das categorias
- Adicionar, editar e excluir categorias
- Definir dias de vencimento
- Escolher cores personalizadas
- 16 cores pré-definidas disponíveis

### 4. Relatórios
- Gráfico de linha: Comparação Mensal Planejado vs Realizado
- Gráfico de barras horizontal: Despesas por Categoria
- Resumo Anual com totais
- Média Mensal calculada
- Botão Exportar CSV para análise externa

## 🚀 Como Usar

### Visualizar Dados
1. Acesse o **Dashboard** para visão geral
2. Use **Controle Mensal** para ver valores mês a mês
3. Consulte **Relatórios** para análises detalhadas

### Editar Valores
1. Vá em **Controle Mensal**
2. Navegue até o mês desejado usando as setas
3. Edite os valores nas colunas Planejado ou Realizado
4. Clique em **Salvar** para persistir as mudanças

### Gerenciar Categorias
1. Acesse **Categorias**
2. Use **Nova Categoria** para adicionar
3. Clique no ícone de lápis para editar
4. Clique no ícone de lixeira para excluir

### Exportar Relatório
1. Vá em **Relatórios**
2. Clique em **Exportar CSV**
3. O arquivo será baixado automaticamente

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py          # API FastAPI com todos os endpoints
│   └── requirements.txt   # Dependências Python
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── MonthlyControl.js
│   │   │   ├── Categories.js
│   │   │   └── Reports.js
│   │   └── components/
│   │       └── Layout.js
│   └── package.json
└── scripts/
    └── import_excel.py    # Script de importação da planilha
```

## 🔧 API Endpoints

- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/{id}` - Atualizar categoria
- `DELETE /api/categories/{id}` - Excluir categoria
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/{id}` - Atualizar transação
- `GET /api/summary/{year}` - Resumo anual

## 💾 Banco de Dados

MongoDB com 3 coleções:
- `categories` - 16 categorias
- `transactions` - 192 registros (16 categorias × 12 meses)
- `budgets` - Metas de orçamento (opcional)

## 🎨 Design

- Tema: Moderno e minimalista
- Cores: Paleta suave de 16 cores para categorias
- Fonte: Manrope (títulos), Inter (corpo), JetBrains Mono (números)
- Layout: Responsivo com Tailwind CSS
- Componentes: Shadcn/UI

## ✅ Validação dos Dados

Todos os valores foram validados e conferem 100% com a planilha original:
- ✅ Mantimento: R$ 10.800 (R$ 900/mês)
- ✅ Visa: R$ 25.861,80
- ✅ Gastos Diversos: R$ 18.000 (R$ 1.500/mês)
- ✅ Água: R$ 1.560 (R$ 130/mês)
- ✅ Total Anual: R$ 86.766,32

## 📝 Próximos Passos Sugeridos

1. **Notificações de Vencimento**: Alertas quando as contas estão próximas do vencimento
2. **Metas por Categoria**: Definir limites e receber avisos ao ultrapassar
3. **Histórico de Alterações**: Ver quem alterou o quê e quando
4. **Backup Automático**: Exportação automática para Google Drive
5. **Múltiplos Anos**: Suporte para 2027, 2028, etc.
