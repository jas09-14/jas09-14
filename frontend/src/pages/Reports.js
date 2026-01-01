import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '../lib/formatters';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = 2026;

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/summary/${currentYear}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!summary) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Relatório Financeiro Anual - ' + currentYear + '\n\n';
    csvContent += 'Mês,Planejado,Realizado,Diferença\n';

    Object.entries(summary.monthly_summary).forEach(([month, data]) => {
      const monthName = format(new Date(currentYear, parseInt(month) - 1), 'MMMM', { locale: ptBR });
      csvContent += `${monthName},${data.planned},${data.actual},${data.actual - data.planned}\n`;
    });

    csvContent += '\n\nCategoria,Planejado,Realizado,Diferença\n';
    Object.values(summary.category_summary).forEach((cat) => {
      csvContent += `${cat.name},${cat.planned},${cat.actual},${cat.actual - cat.planned}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio-financeiro-${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const monthlyData = summary?.monthly_summary
    ? Object.entries(summary.monthly_summary).map(([month, data]) => ({
        month: format(new Date(currentYear, parseInt(month) - 1), 'MMM', { locale: ptBR }),
        planejado: parseFloat(data.planned.toFixed(2)),
        realizado: parseFloat(data.actual.toFixed(2)),
        diferenca: parseFloat((data.actual - data.planned).toFixed(2))
      }))
    : [];

  const categoryData = summary?.category_summary
    ? Object.values(summary.category_summary)
        .sort((a, b) => b.actual - a.actual)
        .map(cat => ({
          name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
          planejado: parseFloat(cat.planned.toFixed(2)),
          realizado: parseFloat(cat.actual.toFixed(2))
        }))
    : [];

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary">Relatórios</h2>
          <p className="text-muted-foreground mt-1">Análise detalhada das suas finanças</p>
        </div>
        <button
          onClick={handleExport}
          data-testid="export-report-button"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
        <h3 className="text-xl font-semibold text-primary mb-4">Comparação Mensal: Planejado vs Realizado</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" stroke="hsl(220 14% 45%)" fontSize={12} />
            <YAxis stroke="hsl(220 14% 45%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(220 13% 91%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="planejado" stroke="#A0C4FF" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="realizado" stroke="#2A9D8F" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
        <h3 className="text-xl font-semibold text-primary mb-4">Despesas por Categoria</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={categoryData} layout="horizontal">
            <XAxis type="number" stroke="hsl(220 14% 45%)" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="hsl(220 14% 45%)" fontSize={11} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid hsl(220 13% 91%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend />
            <Bar dataKey="planejado" fill="#A0C4FF" radius={[0, 8, 8, 0]} />
            <Bar dataKey="realizado" fill="#2A9D8F" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-primary mb-4">Resumo Anual</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Planejado</span>
              <span className="font-mono font-semibold text-foreground">
                R$ {(summary?.total_planned || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Total Realizado</span>
              <span className="font-mono font-semibold text-foreground">
                R$ {(summary?.total_actual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Diferença</span>
              <span
                className={`font-mono font-semibold ${
                  (summary?.total_actual || 0) > (summary?.total_planned || 0) ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {(summary?.total_actual || 0) > (summary?.total_planned || 0) ? '+' : ''}
                R$ {Math.abs((summary?.total_planned || 0) - (summary?.total_actual || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-primary mb-4">Média Mensal</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Média Planejada</span>
              <span className="font-mono font-semibold text-foreground">
                R$ {((summary?.total_planned || 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Média Realizada</span>
              <span className="font-mono font-semibold text-foreground">
                R$ {((summary?.total_actual || 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Variação Média</span>
              <span className="font-mono font-semibold text-muted-foreground">
                R$ {(Math.abs((summary?.total_planned || 0) - (summary?.total_actual || 0)) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;