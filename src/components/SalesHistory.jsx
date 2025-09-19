import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Edit
} from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const paymentMethods = [
    { key: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { key: 'debitoInter', label: 'Débito Inter', icon: '🏦' },
    { key: 'debitoStone', label: 'Débito Stone', icon: '💳' },
    { key: 'creditoInter', label: 'Crédito Inter', icon: '🏦' },
    { key: 'creditoStone', label: 'Crédito Stone', icon: '💳' },
    { key: 'ifoodPG', label: 'iFood PG', icon: '🍔' },
    { key: 'pixInter', label: 'Pix Inter', icon: '📱' },
    { key: 'pixStone', label: 'Pix Stone', icon: '📱' }
  ];

  const salesTypes = [
    { key: 'vendasMesas', label: 'Vendas Mesas', icon: '🍽️' },
    { key: 'vendasEntregas', label: 'Vendas Entregas', icon: '🚚' },
    { key: 'incentivoIfood', label: 'Incentivo iFood', icon: '🎁' },
    { key: 'ifoodDesconto', label: 'iFood Desconto', icon: '📉' },
    { key: 'ifoodVenda', label: 'iFood Venda', icon: '🍔' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const salesQuery = query(
        collection(db, 'vendas'),
        orderBy('dataVenda', 'desc')
      );
      
      const snapshot = await getDocs(salesQuery);
      const salesData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        salesData.push({
          id: doc.id,
          ...data,
          dataVenda: data.dataVenda.toDate()
        });
      });
      
      setSales(salesData);
      setFilteredSales(salesData);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar histórico de vendas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Filtro por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.dataVenda);
        return saleDate >= startOfDay(filterDate) && saleDate <= endOfDay(filterDate);
      });
    }

    // Filtro por forma de pagamento
    if (paymentFilter) {
      filtered = filtered.filter(sale => {
        const value = parseFloat(sale[paymentFilter] || 0);
        return value > 0;
      });
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(sale => {
        const total = formatCurrency(sale.total).toLowerCase();
        const observacoes = (sale.observacoes || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return total.includes(searchLower) || observacoes.includes(searchLower);
      });
    }

    setFilteredSales(filtered);
  };

  const deleteSale = async (saleId) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await deleteDoc(doc(db, 'vendas', saleId));
        toast.success('Venda excluída com sucesso!');
        loadSales();
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        toast.error('Erro ao excluir venda');
      }
    }
  };

  const handleEditClick = (sale) => {
    setEditingSale(sale.id);
    setEditData({
      ...sale,
      dataVenda: format(sale.dataVenda, "yyyy-MM-dd'T'HH:mm"),
      dinheiro: sale.dinheiro || '',
      debitoInter: sale.debitoInter || '',
      debitoStone: sale.debitoStone || '',
      creditoInter: sale.creditoInter || '',
      creditoStone: sale.creditoStone || '',
      ifoodPG: sale.ifoodPG || '',
      pixInter: sale.pixInter || '',
      pixStone: sale.pixStone || '',
      vendasMesas: sale.vendasMesas || '',
      vendasEntregas: sale.vendasEntregas || '',
      incentivoIfood: sale.incentivoIfood || '',
      ifoodDesconto: sale.ifoodDesconto || '',
      ifoodVenda: sale.ifoodVenda || '',
      observacoes: sale.observacoes || ''
    });
  };

  const handleInputChange = (field, value) => {
    if (['dinheiro', 'debitoInter', 'debitoStone', 'creditoInter', 'creditoStone', 'ifoodPG', 'pixInter', 'pixStone', 'vendasMesas', 'vendasEntregas', 'incentivoIfood', 'ifoodDesconto', 'ifoodVenda'].includes(field)) {
      // Remove caracteres não numéricos e formata como moeda
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = numericValue ? (parseFloat(numericValue) / 100).toFixed(2) : '';
      
      setEditData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const calculateEditSubtotal = () => {
    return paymentMethods.reduce((total, method) => {
      const value = parseFloat(editData[method.key]) || 0;
      return total + value;
    }, 0);
  };

  const calculateEditTotal = () => {
    return calculateEditSubtotal(); // Total é igual ao subtotal (sem desconto)
  };

  const handleUpdateSale = async () => {
    setIsUpdating(true);
    try {
      const subtotal = calculateEditSubtotal();
      const total = calculateEditTotal();
      
      if (total === 0) {
        toast.error('Digite pelo menos um valor para a venda');
        return;
      }

      const updatedSale = {
        ...editData,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        dataVenda: new Date(editData.dataVenda),
        timestamp: Date.now()
      };

      await updateDoc(doc(db, 'vendas', editingSale), updatedSale);
      
      toast.success('Venda atualizada com sucesso!');
      setEditingSale(null);
      setEditData({});
      loadSales();
      
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      toast.error('Erro ao atualizar venda. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditingSale(null);
    setEditData({});
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Total', 'Vendas Mesas', 'Vendas Entregas', 'Incentivo iFood', 'iFood Desconto', 'iFood Venda', 'Dinheiro', 'Débito Inter', 'Débito Stone', 'Crédito Inter', 'Crédito Stone', 'iFood PG', 'Pix Inter', 'Pix Stone', 'Observações'];
    
    const csvData = filteredSales.map(sale => [
      format(sale.dataVenda, 'dd/MM/yyyy HH:mm'),
      sale.total,
      sale.vendasMesas || '0',
      sale.vendasEntregas || '0',
      sale.incentivoIfood || '0',
      sale.ifoodDesconto || '0',
      sale.ifoodVenda || '0',
      sale.dinheiro || '0',
      sale.debitoInter || '0',
      sale.debitoStone || '0',
      sale.creditoInter || '0',
      sale.creditoStone || '0',
      sale.ifoodPG || '0',
      sale.pixInter || '0',
      sale.pixStone || '0',
      sale.observacoes || ''
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [searchTerm, dateFilter, paymentFilter, sales]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Vendas</h1>
          <p className="text-gray-600">Visualize e gerencie suas vendas anteriores</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={loadSales}
            className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por valor ou observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Todas</option>
              {paymentMethods.map(method => (
                <option key={method.key} value={method.key}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setPaymentFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="bg-white rounded-lg shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formas de Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observações
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(sale.dataVenda, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(sale.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {paymentMethods.map(method => {
                          const value = parseFloat(sale[method.key] || 0);
                          if (value > 0) {
                            return (
                              <span
                                key={method.key}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {method.icon} {method.label}: {formatCurrency(value)}
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {sale.observacoes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(sale)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar venda"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir venda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma venda encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Editar Venda
                </h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Campo de Data */}
                <div>
                  <div className="bg-blue-50 rounded-lg p-4 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Data da Venda
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.dataVenda || ''}
                      onChange={(e) => handleInputChange('dataVenda', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tipos de Vendas */}
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Informações de Vendas</h4>
                  <p className="text-sm text-gray-500 mb-3">Campos informativos (não somados ao total)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {salesTypes.map((type) => (
                      <div key={type.key} className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {type.icon} {type.label}
                        </label>
                        <input
                          type="text"
                          placeholder="R$ 0,00"
                          value={editData[type.key] ? formatCurrency(editData[type.key]) : ''}
                          onChange={(e) => handleInputChange(type.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">Formas de Pagamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <div key={method.key} className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {method.icon} {method.label}
                        </label>
                        <input
                          type="text"
                          placeholder="R$ 0,00"
                          value={editData[method.key] ? formatCurrency(editData[method.key]) : ''}
                          onChange={(e) => handleInputChange(method.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={editData.observacoes || ''}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Digite observações sobre esta venda..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                {/* Resumo */}
                <div className="bg-accent bg-opacity-10 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Resumo da Venda</h4>
                  <div className="space-y-2">
                    {/* Informações de Vendas */}
                    {(parseFloat(editData.vendasMesas) > 0 || parseFloat(editData.vendasEntregas) > 0) && (
                      <>
                        <div className="text-sm font-medium text-gray-600 mb-2">Informações:</div>
                        {parseFloat(editData.vendasMesas) > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">🍽️ Vendas Mesas:</span>
                            <span className="font-medium text-purple-600">
                              {formatCurrency(parseFloat(editData.vendasMesas).toFixed(2))}
                            </span>
                          </div>
                        )}
                        {parseFloat(editData.vendasEntregas) > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">🚚 Vendas Entregas:</span>
                            <span className="font-medium text-indigo-600">
                              {formatCurrency(parseFloat(editData.vendasEntregas).toFixed(2))}
                            </span>
                          </div>
                        )}
                        <hr className="my-2 border-gray-300" />
                      </>
                    )}
                    
                    {/* Total da Venda */}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Total da Venda:</span>
                      <span className="text-2xl font-bold text-accent">
                        {formatCurrency(calculateEditTotal().toFixed(2))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpdateSale}
                    disabled={isUpdating || calculateEditTotal() === 0}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Edit className="w-5 h-5" />
                        <span>Atualizar Venda</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalhes da Venda
                </h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data e Hora
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(selectedSale.dataVenda, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total da Venda
                  </label>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-700">Total:</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Informações de Vendas
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Valores informativos registrados</p>
                  <div className="space-y-3 mb-4">
                    {/* Vendas individuais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {salesTypes.filter(type => ['vendasMesas', 'vendasEntregas'].includes(type.key)).map(type => {
                        const value = parseFloat(selectedSale[type.key] || 0);
                        return (
                          <div key={type.key} className={`p-3 rounded-lg ${value > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {type.icon} {type.label}
                              </span>
                              <span className={`font-semibold ${value > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                                {formatCurrency(value)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Total Sagres */}
                    {((parseFloat(selectedSale.vendasMesas) || 0) + (parseFloat(selectedSale.vendasEntregas) || 0)) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                              🍺
                            </div>
                            <span className="text-sm font-bold text-blue-700">
                              Total Sagres
                            </span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(((parseFloat(selectedSale.vendasMesas) || 0) + (parseFloat(selectedSale.vendasEntregas) || 0)).toFixed(2))}
                          </span>
                        </div>
                        <div className="text-xs text-blue-500 text-center mt-1">
                          Soma automática: Mesas + Entregas
                        </div>
                      </div>
                    )}
                    
                    {/* Outros campos informativos (iFood) */}
                    {salesTypes.filter(type => ['incentivoIfood', 'ifoodDesconto'].includes(type.key)).map(type => {
                      const value = parseFloat(selectedSale[type.key] || 0);
                      if (value > 0) {
                        return (
                          <div key={type.key} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {type.icon} {type.label}
                              </span>
                              <span className="font-semibold text-yellow-600">
                                {formatCurrency(value)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Formas de Pagamento
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {paymentMethods.map(method => {
                      const value = parseFloat(selectedSale[method.key] || 0);
                      return (
                        <div key={method.key} className={`p-3 rounded-lg ${value > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {method.icon} {method.label}
                            </span>
                            <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {formatCurrency(value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSale.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Observações
                    </label>
                    <p className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">
                      {selectedSale.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
