import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '../lib/formatters';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Incomes = () => {
  const [incomes, setIncomes] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const currentYear = 2026;

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(currentYear, i), 'MMMM', { locale: ptBR })
  }));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incomesRes, summaryRes] = await Promise.all([
        axios.get(`${API}/incomes?year=${currentYear}`),
        axios.get(`${API}/summary/${currentYear}`)
      ]);

      const incomeMap = {};
      incomesRes.data.forEach(income => {
        incomeMap[income.month] = income;
      });
      setIncomes(incomeMap);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    setIncomes(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        month: selectedMonth,
        year: currentYear,
        [field]: parseFloat(numValue.toFixed(2)),
        aposentadoria: field === 'aposentadoria' ? parseFloat(numValue.toFixed(2)) : parseFloat((prev[selectedMonth]?.aposentadoria || 0).toFixed(2)),
        salario: field === 'salario' ? parseFloat(numValue.toFixed(2)) : parseFloat((prev[selectedMonth]?.salario || 0).toFixed(2)),
        recursos_externos: field === 'recursos_externos' ? parseFloat(numValue.toFixed(2)) : parseFloat((prev[selectedMonth]?.recursos_externos || 0).toFixed(2))
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const monthIncome = incomes[selectedMonth];
      
      if (monthIncome?.id) {
        await axios.put(`${API}/incomes/${monthIncome.id}`, {
          aposentadoria: monthIncome.aposentadoria,
          salario: monthIncome.salario,
          recursos_externos: monthIncome.recursos_externos
        });
      } else if (monthIncome) {
        const response = await axios.post(`${API}/incomes`, monthIncome);
        setIncomes(prev => ({
          ...prev,
          [selectedMonth]: response.data
        }));
      }

      toast.success('Dados salvos com sucesso!');
      await fetchData(); // Recarregar para atualizar resumo
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const getMonthData = (month) => {
    return incomes[month] || { aposentadoria: 0, salario: 0, recursos_externos: 0 };
  };

  const getTotalIncome = () => {
    const data = getMonthData(selectedMonth);
    return data.aposentadoria + data.salario + data.recursos_externos;
  };

  const getMonthExpenses = () => {
    return summary?.monthly_summary?.[selectedMonth]?.actual || 0;
  };

  const getMonthBalance = () => {
    return getTotalIncome() - getMonthExpenses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label;
  const monthData = getMonthData(selectedMonth);
  const balance = getMonthBalance();

  return (
    <div className="animate-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-primary">Receitas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas receitas mensais</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-income-button"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Receitas</p>
          <p className="text-xl sm:text-2xl font-semibold font-mono mt-2 text-green-600">
            {formatBRL(getTotalIncome())}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Despesas</p>
          <p className="text-xl sm:text-2xl font-semibold font-mono mt-2 text-red-600">
            {formatBRL(getMonthExpenses())}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            Saldo
            {balance > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
          </p>
          <p className={`text-xl sm:text-2xl font-semibold font-mono mt-2 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatBRL(Math.abs(balance))}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedMonth(prev => prev === 1 ? 12 : prev - 1)}
            data-testid="prev-month-button"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-xl sm:text-2xl font-semibold text-primary capitalize">{selectedMonthName} {currentYear}</h3>
          <button
            onClick={() => setSelectedMonth(prev => prev === 12 ? 1 : prev + 1)}
            data-testid="next-month-button"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Aposentadoria</label>
            <input
              type="number"
              step="0.01"
              value={monthData.aposentadoria || ''}
              onChange={(e) => handleValueChange('aposentadoria', e.target.value)}
              data-testid="aposentadoria-input"
              className="w-full text-right bg-transparent border-b border-border focus:border-primary focus:outline-none px-2 py-2 font-mono text-lg text-foreground transition-colors"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Salário</label>
            <input
              type="number"
              step="0.01"
              value={monthData.salario || ''}
              onChange={(e) => handleValueChange('salario', e.target.value)}
              data-testid="salario-input"
              className="w-full text-right bg-transparent border-b border-border focus:border-primary focus:outline-none px-2 py-2 font-mono text-lg text-foreground transition-colors"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Recursos Externos</label>
            <input
              type="number"
              step="0.01"
              value={monthData.recursos_externos || ''}
              onChange={(e) => handleValueChange('recursos_externos', e.target.value)}
              data-testid="recursos-externos-input"
              className="w-full text-right bg-transparent border-b border-border focus:border-primary focus:outline-none px-2 py-2 font-mono text-lg text-foreground transition-colors"
              placeholder="0.00"
            />
          </div>

          <div className="pt-4 border-t border-border mt-6">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-foreground">TOTAL DO MÊS</span>
              <span className="text-xl font-semibold font-mono text-green-600">
                {formatBRL(getTotalIncome())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Incomes;