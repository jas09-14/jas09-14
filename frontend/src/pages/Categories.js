import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AVAILABLE_COLORS = [
  '#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF',
  '#BDB2FF', '#FFC6FF', '#E5E5E5', '#F4A261', '#2A9D8F', '#E9C46A',
  '#E76F51', '#8ECAE6', '#219EBC', '#264653'
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    due_day: '',
    color: '#FFADAD',
    order: 1
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        due_day: category.due_day || '',
        color: category.color,
        order: category.order
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        due_day: '',
        color: '#FFADAD',
        order: categories.length + 1
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', due_day: '', color: '#FFADAD', order: 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        due_day: formData.due_day ? parseInt(formData.due_day) : null,
        color: formData.color,
        order: formData.order
      };

      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, payload);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await axios.post(`${API}/categories`, payload);
        toast.success('Categoria criada com sucesso!');
      }

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria? Todas as transações relacionadas serão removidas.')) {
      return;
    }

    try {
      await axios.delete(`${API}/categories/${categoryId}`);
      toast.success('Categoria excluída com sucesso!');
      fetchCategories();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-primary">Categorias</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas categorias de despesas</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          data-testid="add-category-button"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            data-testid={`category-card-${category.id}`}
            className="bg-card rounded-xl border border-border/50 p-5 shadow-soft hover-lift transition-smooth"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="font-semibold text-foreground">{category.name}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenDialog(category)}
                  data-testid={`edit-category-${category.id}`}
                  className="p-1.5 hover:bg-accent rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  data-testid={`delete-category-${category.id}`}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            {category.due_day && (
              <p className="text-sm text-muted-foreground">
                Vencimento: Dia {category.due_day}
              </p>
            )}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="category-name-input"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ex: Aluguel"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Dia de Vencimento (opcional)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.due_day}
                onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                data-testid="category-due-day-input"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="1-31"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cor</label>
              <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-option-${color}`}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" data-testid="submit-category-button" className="flex-1">
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
              <Button
                type="button"
                onClick={handleCloseDialog}
                variant="outline"
                data-testid="cancel-category-button"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;