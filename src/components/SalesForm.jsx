import React, { useState } from 'react';
import { Plus, Save, DollarSign, Calendar, Percent } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

const SalesForm = () => {
  const [saleData, setSaleData] = useState({
    dinheiro: '',
    debitoInter: '',
    debitoStone: '',
    creditoInter: '',
    creditoStone: '',
    ifoodPG: '',
    pixInter: '',
    pixStone: '',
    incentivoIfood: '',
    ifoodDesconto: '',
    vendasMesas: '',
    vendasEntregas: '',
    dataVenda: new Date().toISOString().slice(0, 16), // Data e hora atual
    observacoes: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods = [
    { key: 'dinheiro', label: 'Dinheiro', color: 'bg-green-500', icon: '💵' },
    { key: 'debitoInter', label: 'Débito Inter', color: 'bg-orange-500', icon: '🏦' },
    { key: 'debitoStone', label: 'Débito Stone', color: 'bg-gray-600', icon: '💳' },
    { key: 'creditoInter', label: 'Crédito Inter', color: 'bg-orange-600', icon: '🏦' },
    { key: 'creditoStone', label: 'Crédito Stone', color: 'bg-gray-700', icon: '💳' },
    { key: 'ifoodPG', label: 'iFood PG', color: 'bg-red-500', icon: '🍔' },
    { key: 'pixInter', label: 'PIX Inter', color: 'bg-blue-500', icon: '🏦' },
    { key: 'pixStone', label: 'PIX Stone', color: 'bg-blue-600', icon: '💳' }
  ];

  const salesTypes = [
    { key: 'vendasMesas', label: 'Vendas Mesas', color: 'bg-purple-500', icon: '🍽️' },
    { key: 'vendasEntregas', label: 'Vendas Entregas', color: 'bg-indigo-500', icon: '🚚' }
  ];

  // Campos que aparecem na seção de pagamentos mas NÃO somam no total
  const nonSumPayments = [
    { key: 'incentivoIfood', label: 'Incentivo iFood', color: 'bg-yellow-400', icon: '🎁' },
    { key: 'ifoodDesconto', label: 'iFood Desconto', color: 'bg-red-300', icon: '📉' }
  ];

  const handleInputChange = (field, value) => {
    // Remove caracteres não numéricos e formata como moeda
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = numericValue ? (parseFloat(numericValue) / 100).toFixed(2) : '';
    
    setSaleData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const calculateSubtotal = () => {
    return paymentMethods.reduce((total, method) => {
      const value = parseFloat(saleData[method.key]) || 0;
      return total + value;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const encaixe = parseFloat(saleData.encaixe) || 0;
    const desencaixe = parseFloat(saleData.desencaixe) || 0;
    return subtotal + encaixe - desencaixe;
  };

  const calculateTotalSagres = () => {
    const vendasMesas = parseFloat(saleData.vendasMesas) || 0;
    const vendasEntregas = parseFloat(saleData.vendasEntregas) || 0;
    return vendasMesas + vendasEntregas;
  };

  const calculateVendasTotal = () => {
    const vendasMesas = parseFloat(saleData.vendasMesas) || 0;
    const vendasEntregas = parseFloat(saleData.vendasEntregas) || 0;
    return vendasMesas + vendasEntregas;
  };

  const calculateDiferenca = () => {
    const encaixe = parseFloat(saleData.encaixe) || 0;
    const desencaixe = parseFloat(saleData.desencaixe) || 0;
    return encaixe - desencaixe;
  };

  const calculateConferencia = () => {
    const totalSagres = calculateTotalSagres(); // Total Vendas (Mesas + Entregas)
    const totalPagamentos = calculateSubtotal(); // Total das formas de pagamento
    const diferenca = calculateDiferenca(); // Encaixe - Desencaixe
    const incentivoIfood = parseFloat(saleData.incentivoIfood) || 0; // Incentivo iFood
    return totalSagres - totalPagamentos + diferenca + incentivoIfood;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const total = calculateTotal();
      
      if (total === 0) {
        toast.error('Digite pelo menos um valor para registrar a venda');
        return;
      }

      const saleRecord = {
        ...saleData,
        subtotal: calculateSubtotal().toFixed(2),
        total: total.toFixed(2),
        totalSagres: calculateTotalSagres().toFixed(2), // Soma automática de Mesas + Entregas
        dataVenda: new Date(saleData.dataVenda), // Usar a data selecionada pelo usuário
        timestamp: Date.now()
      };

      // Salvar no Firebase
      await addDoc(collection(db, 'vendas'), saleRecord);
      
      toast.success('Venda registrada com sucesso!');
      
      // Limpar formulário
      setSaleData({
        dinheiro: '',
        debitoInter: '',
        debitoStone: '',
        creditoInter: '',
        creditoStone: '',
        ifoodPG: '',
        pixInter: '',
        pixStone: '',
        incentivoIfood: '',
        vendasMesas: '',
        vendasEntregas: '',
        encaixe: '',
        desencaixe: '',
        dataVenda: new Date().toISOString().slice(0, 16),
        observacoes: ''
      });
      
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast.error('Erro ao registrar venda. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-primary text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Registrar Nova Venda</h1>
              <p className="text-gray-300">Insira os valores por forma de pagamento</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Campo de Data */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 max-w-md">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <label className="font-medium text-gray-700">
                  Data da Venda
                </label>
              </div>
              <input
                type="datetime-local"
                value={saleData.dataVenda}
                onChange={(e) => setSaleData(prev => ({ ...prev, dataVenda: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          {/* Campos de Vendas Mesas e Entregas */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-2">Informações de Vendas</h4>
            <p className="text-sm text-gray-500 mb-3">Campos informativos (não somados ao total)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {salesTypes.map((type) => (
                <div key={type.key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 ${type.color} rounded-full flex items-center justify-center text-white text-sm`}>
                      {type.icon}
                    </div>
                    <label className="font-medium text-gray-700">
                      {type.label}
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    value={saleData[type.key] ? formatCurrency(saleData[type.key]) : ''}
                    onChange={(e) => handleInputChange(type.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            
            {/* Total Sagres - Campo calculado automaticamente */}
            {calculateTotalSagres() > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    🍺
                  </div>
                  <label className="font-medium text-gray-700">
                    Total Sagres
                  </label>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    Calculado
                  </span>
                </div>
                <div className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-lg font-bold text-blue-700">
                  {formatCurrency(calculateTotalSagres().toFixed(2))}
                </div>
                <p className="text-xs text-blue-600 mt-1">Soma automática: Vendas Mesas + Vendas Entregas</p>
              </div>
            )}
          </div>

          {/* Grid de formas de pagamento */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">Formas de Pagamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {paymentMethods.map((method) => (
              <div key={method.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-8 h-8 ${method.color} rounded-full flex items-center justify-center text-white text-sm`}>
                    {method.icon}
                  </div>
                  <label className="font-medium text-gray-700">
                    {method.label}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={saleData[method.key] ? formatCurrency(saleData[method.key]) : ''}
                  onChange={(e) => handleInputChange(method.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
            ))}
            
            {/* Campos de pagamento que NÃO somam */}
            {nonSumPayments.map((payment) => (
              <div key={payment.key} className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-8 h-8 ${payment.color} rounded-full flex items-center justify-center text-white text-sm`}>
                    {payment.icon}
                  </div>
                  <label className="font-medium text-gray-700">
                    {payment.label}
                  </label>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    Não soma
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={saleData[payment.key] ? formatCurrency(saleData[payment.key]) : ''}
                  onChange={(e) => handleInputChange(payment.key, e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent bg-red-50"
                />
              </div>
            ))}
            </div>

            {/* Total das Formas de Pagamento - Campo calculado automaticamente */}
            {calculateSubtotal() > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    💰
                  </div>
                  <label className="font-medium text-gray-700">
                    Total Formas de Pagamento
                  </label>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    Calculado
                  </span>
                </div>
                <div className="w-full px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-lg font-bold text-green-700">
                  {formatCurrency(calculateSubtotal().toFixed(2))}
                </div>
                <p className="text-xs text-green-600 mt-1">Soma de todas as formas de pagamento (exceto campos informativos)</p>
              </div>
            )}
          </div>

          {/* Encaixe e Desencaixe */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Ajustes de Caixa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Encaixe */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                    ➕
                  </div>
                  <label className="font-medium text-gray-700">
                    Encaixe
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={saleData.encaixe ? formatCurrency(saleData.encaixe) : ''}
                  onChange={(e) => handleInputChange('encaixe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Valor a ser somado ao total</p>
              </div>

              {/* Desencaixe */}
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm">
                    ➖
                  </div>
                  <label className="font-medium text-gray-700">
                    Desencaixe
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  value={saleData.desencaixe ? formatCurrency(saleData.desencaixe) : ''}
                  onChange={(e) => handleInputChange('desencaixe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Valor a ser subtraído do total</p>
              </div>
            </div>

            {/* Diferença - Campo calculado automaticamente */}
            {(parseFloat(saleData.encaixe) > 0 || parseFloat(saleData.desencaixe) > 0) && (
              <div className={`rounded-lg p-4 border-2 ${calculateDiferenca() >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${calculateDiferenca() >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                    {calculateDiferenca() >= 0 ? '📈' : '📉'}
                  </div>
                  <label className="font-medium text-gray-700">
                    Diferença
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full ${calculateDiferenca() >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    Calculado
                  </span>
                </div>
                <div className={`w-full px-3 py-2 border rounded-lg text-lg font-bold ${calculateDiferenca() >= 0 ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-orange-100 border-orange-300 text-orange-700'}`}>
                  {calculateDiferenca() >= 0 ? '+' : ''}{formatCurrency(Math.abs(calculateDiferenca()).toFixed(2))}
                </div>
                <p className={`text-xs mt-1 ${calculateDiferenca() >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  Resultado: Encaixe - Desencaixe = {calculateDiferenca() >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}
                </p>
              </div>
            )}
          </div>

          {/* Conferência de Valor - Campo calculado automaticamente */}
          {(calculateTotalSagres() > 0 || calculateSubtotal() > 0 || calculateDiferenca() !== 0) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Conferência de Valor</h3>
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                    🔍
                  </div>
                  <label className="font-medium text-gray-700">
                    Total Conferência
                  </label>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    Calculado
                  </span>
                </div>
                
                <div className="space-y-2 mb-3 text-sm">
                  {calculateTotalSagres() > 0 && (
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                      <span className="text-gray-600">🍺 Total Sagres:</span>
                      <span className="font-medium text-blue-600">
                        + {formatCurrency(calculateTotalSagres().toFixed(2))}
                      </span>
                    </div>
                  )}
                  {calculateSubtotal() > 0 && (
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                      <span className="text-gray-600">💰 Total Pagamentos:</span>
                      <span className="font-medium text-red-600">
                        - {formatCurrency(calculateSubtotal().toFixed(2))}
                      </span>
                    </div>
                  )}
                  {calculateDiferenca() !== 0 && (
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                      <span className="text-gray-600">📊 Diferença Caixa:</span>
                      <span className={`font-medium ${calculateDiferenca() >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {calculateDiferenca() >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(calculateDiferenca()).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {parseFloat(saleData.incentivoIfood) > 0 && (
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-purple-100">
                      <span className="text-gray-600">🎁 Incentivo iFood:</span>
                      <span className="font-medium text-green-600">
                        + {formatCurrency(parseFloat(saleData.incentivoIfood).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <hr className="border-purple-200" />
                </div>
                
                <div className={`w-full px-4 py-3 border rounded-lg text-xl font-bold text-center ${calculateConferencia() >= 0 ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                  {calculateConferencia() >= 0 ? '+' : ''}{formatCurrency(Math.abs(calculateConferencia()).toFixed(2))}
                </div>
                <p className="text-xs text-purple-600 mt-2 text-center">
                  Cálculo: Total Vendas - Total Pagamentos + Diferença + Incentivo iFood
                </p>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={saleData.observacoes}
              onChange={(e) => setSaleData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Digite observações sobre esta venda..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Resumo da Venda */}
          <div className="bg-accent bg-opacity-10 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Resumo da Venda</h3>
            
            <div className="space-y-2">
              {/* Informações de Vendas */}
              {(parseFloat(saleData.vendasMesas) > 0 || parseFloat(saleData.vendasEntregas) > 0) && (
                <>
                  <div className="text-sm font-medium text-gray-600 mb-2">Informações:</div>
                  {parseFloat(saleData.vendasMesas) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">🍽️ Vendas Mesas:</span>
                      <span className="font-medium text-purple-600">
                        {formatCurrency(parseFloat(saleData.vendasMesas).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {parseFloat(saleData.vendasEntregas) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">🚚 Vendas Entregas:</span>
                      <span className="font-medium text-indigo-600">
                        {formatCurrency(parseFloat(saleData.vendasEntregas).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {calculateTotalSagres() > 0 && (
                    <div className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded-lg mt-2">
                      <span className="text-gray-700 font-medium">🍺 Total Sagres:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(calculateTotalSagres().toFixed(2))}
                      </span>
                    </div>
                  )}
                  <hr className="my-2 border-gray-300" />
                </>
              )}
              
              {/* Subtotal das Formas de Pagamento */}
              <div className="flex justify-between items-center">
                <span className="text-md font-medium text-gray-700">Subtotal Pagamentos:</span>
                <span className="text-lg font-semibold text-gray-800">
                  {formatCurrency(calculateSubtotal().toFixed(2))}
                </span>
              </div>
              
              {/* Ajustes */}
              {(parseFloat(saleData.encaixe) > 0 || parseFloat(saleData.desencaixe) > 0) && (
                <>
                  <hr className="my-2 border-gray-300" />
                  <div className="text-sm font-medium text-gray-600 mb-2">Ajustes:</div>
                  {parseFloat(saleData.encaixe) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">➕ Encaixe:</span>
                      <span className="font-medium text-green-600">
                        + {formatCurrency(parseFloat(saleData.encaixe).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {parseFloat(saleData.desencaixe) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">➖ Desencaixe:</span>
                      <span className="font-medium text-red-600">
                        - {formatCurrency(parseFloat(saleData.desencaixe).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <hr className="my-2 border-gray-300" />
                </>
              )}
              
              {/* Total Final da Venda */}
              {/* Campos iFood Informativos */}
              {(parseFloat(saleData.incentivoIfood) > 0 || parseFloat(saleData.ifoodDesconto) > 0) && (
                <>
                  <div className="text-sm font-medium text-gray-600 mb-2">Valores iFood (Informativos):</div>
                  {parseFloat(saleData.incentivoIfood) > 0 && (
                    <div className="flex justify-between items-center text-sm bg-yellow-50 p-2 rounded-lg mb-1">
                      <span className="text-gray-600">🎁 Incentivo iFood:</span>
                      <span className="font-medium text-yellow-600">
                        {formatCurrency(parseFloat(saleData.incentivoIfood).toFixed(2))}
                      </span>
                    </div>
                  )}
                  {parseFloat(saleData.ifoodDesconto) > 0 && (
                    <div className="flex justify-between items-center text-sm bg-red-50 p-2 rounded-lg">
                      <span className="text-gray-600">📉 iFood Desconto:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(parseFloat(saleData.ifoodDesconto).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <hr className="my-2 border-gray-300" />
                </>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total da Venda:</span>
                <span className="text-2xl font-bold text-accent">
                  {formatCurrency(calculateTotal().toFixed(2))}
                </span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isLoading || calculateTotal() === 0}
              className="flex-1 bg-accent text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Registrar Venda</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setSaleData({
                dinheiro: '', debitoInter: '', debitoStone: '', 
                creditoInter: '', creditoStone: '', ifoodPG: '', pixInter: '', pixStone: '',
                incentivoIfood: '', ifoodDesconto: '', vendasMesas: '', vendasEntregas: '',
                dataVenda: new Date().toISOString().slice(0, 16),
                observacoes: ''
              })}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesForm;
