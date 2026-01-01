import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MonthlyControl = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const [categoriesRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/transactions?year=${currentYear}`)
      ]);

      setCategories(categoriesRes.data);

      const transMap = {};
      transactionsRes.data.forEach(trans => {
        const key = `${trans.category_id}-${trans.month}`;
        transMap[key] = trans;
      });
      setTransactions(transMap);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (categoryId, field, value) => {
    const key = `${categoryId}-${selectedMonth}`;
    setTransactions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        category_id: categoryId,
        month: selectedMonth,
        year: currentYear,
        [field]: value === '' ? 0 : parseFloat(value) || 0,
        planned_value: field === 'planned_value' ? (value === '' ? 0 : parseFloat(value) || 0) : (prev[key]?.planned_value || 0),
        actual_value: field === 'actual_value' ? (value === '' ? 0 : parseFloat(value) || 0) : (prev[key]?.actual_value || 0)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const monthTransactions = Object.entries(transactions).filter(
        ([key]) => key.endsWith(`-${selectedMonth}`)
      );

      for (const [_, trans] of monthTransactions) {
        if (trans.id) {
          await axios.put(`${API}/transactions/${trans.id}`, {
            planned_value: trans.planned_value,
            actual_value: trans.actual_value,
            notes: trans.notes
          });
        } else {
          const response = await axios.post(`${API}/transactions`, trans);
          const key = `${trans.category_id}-${trans.month}`;
          setTransactions(prev => ({
            ...prev,
            [key]: response.data
          }));
        }
      }

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const getTotalPlanned = () => {
    return categories.reduce((sum, cat) => {
      const key = `${cat.id}-${selectedMonth}`;
      return sum + (transactions[key]?.planned_value || 0);
    }, 0);
  };

  const getTotalActual = () => {
    return categories.reduce((sum, cat) => {
      const key = `${cat.id}-${selectedMonth}`;
      return sum + (transactions[key]?.actual_value || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label;

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary">Controle Mensal</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas despesas mês a mês</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-monthly-button"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedMonth(prev => prev === 1 ? 12 : prev - 1)}
            data-testid="prev-month-button"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-semibold text-primary capitalize">{selectedMonthName} {currentYear}</h3>
          <button
            onClick={() => setSelectedMonth(prev => prev === 12 ? 1 : prev + 1)}
            data-testid="next-month-button"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Categoria</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Planejado</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Realizado</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const key = `${category.id}-${selectedMonth}`;
                const trans = transactions[key] || { planned_value: 0, actual_value: 0 };
                const diff = trans.actual_value - trans.planned_value;

                return (
                  <tr key={category.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {category.due_day ? `Dia ${category.due_day}` : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={trans.planned_value || ''}
                        onChange={(e) => handleValueChange(category.id, 'planned_value', e.target.value)}
                        data-testid={`planned-input-${category.id}`}
                        className="w-full text-right bg-transparent border-b border-border focus:border-primary focus:outline-none px-2 py-1 font-mono text-foreground transition-colors"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={trans.actual_value || ''}
                        onChange={(e) => handleValueChange(category.id, 'actual_value', e.target.value)}
                        data-testid={`actual-input-${category.id}`}
                        className="w-full text-right bg-transparent border-b border-border focus:border-primary focus:outline-none px-2 py-1 font-mono text-foreground transition-colors"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      <span className={diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-muted-foreground'}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-accent/30 font-semibold">
                <td colSpan="2" className="py-4 px-4 text-foreground">TOTAL</td>
                <td className="py-4 px-4 text-right font-mono text-foreground" data-testid="total-planned">
                  R$ {getTotalPlanned().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 text-right font-mono text-foreground" data-testid="total-actual">
                  R$ {getTotalActual().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 text-right font-mono text-foreground">
                  <span className={(getTotalActual() - getTotalPlanned()) > 0 ? 'text-red-600' : 'text-green-600'}>
                    {(getTotalActual() - getTotalPlanned()) > 0 ? '+' : ''}
                    {(getTotalActual() - getTotalPlanned()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyControl;