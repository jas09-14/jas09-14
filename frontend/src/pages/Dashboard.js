import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Wallet, Target, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = 2026;

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    try {
      await axios.post(`${API}/init-default-categories`);
      await fetchSummary();
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/summary/${currentYear}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
    } finally {
      setLoading(false);
    }
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
        realizado: parseFloat(data.actual.toFixed(2))
      }))
    : [];

  const categoryData = summary?.category_summary
    ? Object.values(summary.category_summary).map(cat => ({
        name: cat.name,
        value: parseFloat(cat.actual.toFixed(2)),
        color: cat.color
      }))
    : [];

  const stats = [
    {
      title: 'Total Planejado',
      value: `R$ ${(summary?.total_planned || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Total Realizado',
      value: `R$ ${(summary?.total_actual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Diferença',
      value: `R$ ${Math.abs((summary?.total_planned || 0) - (summary?.total_actual || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: (summary?.total_actual || 0) > (summary?.total_planned || 0) ? TrendingUp : TrendingDown,
      color: (summary?.total_actual || 0) > (summary?.total_planned || 0) ? 'text-red-600' : 'text-green-600',
      bg: (summary?.total_actual || 0) > (summary?.total_planned || 0) ? 'bg-red-50' : 'bg-green-50'
    }
  ];

  return (
    <div className="animate-in space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-primary">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Visão geral das suas finanças em {currentYear}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={`stat-card-${index}`}
              className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft hover-lift transition-smooth"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-semibold font-mono mt-2 text-foreground">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-primary mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
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
              <Bar dataKey="planejado" fill="#A0C4FF" radius={[8, 8, 0, 0]} />
              <Bar dataKey="realizado" fill="#2A9D8F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-soft">
          <h3 className="text-xl font-semibold text-primary mb-4">Distribuição por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid hsl(220 13% 91%)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Dica</h4>
            <p className="text-sm text-blue-700">
              Utilize a página <strong>Controle Mensal</strong> para registrar seus gastos em cada categoria ao longo dos meses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;