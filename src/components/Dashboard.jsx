import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [salesData, setSalesData] = useState({
    today: { total: 0, count: 0 },
    week: { total: 0, count: 0 },
    month: { total: 0, count: 0 },
    byPaymentMethod: {},
    bySalesType: {}
  });
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyEstimation, setMonthlyEstimation] = useState({
    averageDaily: 0,
    daysInMonth: 0,
    projection: 0,
    currentMonthTotal: 0
  });

  const paymentMethods = [
    { key: 'dinheiro', label: 'Dinheiro', color: 'bg-green-500', icon: '💵' },
    { key: 'debitoInter', label: 'Débito Inter', color: 'bg-orange-500', icon: '🏦' },
    { key: 'debitoStone', label: 'Débito Stone', color: 'bg-gray-600', icon: '💳' },
    { key: 'creditoInter', label: 'Crédito Inter', color: 'bg-orange-600', icon: '🏦' },
    { key: 'creditoStone', label: 'Crédito Stone', color: 'bg-gray-700', icon: '💳' },
    { key: 'ifoodPG', label: 'iFood PG', color: 'bg-red-500', icon: '🍔' },
    { key: 'pix', label: 'PIX', color: 'bg-blue-500', icon: '📱' }
  ];

  const salesTypes = [
    { key: 'vendasMesas', label: 'Vendas Mesas', color: 'bg-purple-500', icon: '🍽️' },
    { key: 'vendasEntregas', label: 'Vendas Entregas', color: 'bg-indigo-500', icon: '🚚' },
    { key: 'incentivoIfood', label: 'Incentivo iFood', color: 'bg-yellow-400', icon: '🎁' },
    { key: 'ifoodDesconto', label: 'iFood Desconto', color: 'bg-red-300', icon: '📉' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calculateMonthlyEstimation = async () => {
    try {
      const salesCollection = collection(db, 'vendas');
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      // Buscar vendas do mês atual
      const monthQuery = query(
        salesCollection,
        where('dataVenda', '>=', monthStart),
        where('dataVenda', '<=', monthEnd),
        orderBy('dataVenda', 'desc')
      );
      
      const snapshot = await getDocs(monthQuery);
      
      let totalSagres = 0;
      let daysWithSales = 0;
      const dailyData = {};
      
      // Processar dados por dia
      snapshot.forEach((doc) => {
        const data = doc.data();
        const saleDate = data.dataVenda.toDate();
        const dateKey = format(saleDate, 'yyyy-MM-dd');
        
        const vendasMesas = parseFloat(data.vendasMesas || 0);
        const vendasEntregas = parseFloat(data.vendasEntregas || 0);
        const dayTotalSagres = vendasMesas + vendasEntregas;
        
        if (dayTotalSagres > 0) {
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = 0;
            daysWithSales++;
          }
          dailyData[dateKey] += dayTotalSagres;
          totalSagres += dayTotalSagres;
        }
      });
      
      // Calcular média diária do mês
      const averageDaily = daysWithSales > 0 ? totalSagres / daysWithSales : 0;
      
      // Número de dias no mês atual
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // Projeção para o mês completo
      const projection = averageDaily * daysInMonth;
      
      setMonthlyEstimation({
        averageDaily,
        daysInMonth,
        projection,
        currentMonthTotal: totalSagres
      });
      
    } catch (error) {
      console.error('Erro ao calcular estimativa mensal:', error);
    }
  };


  const loadSalesData = async () => {
    setIsLoading(true);
    try {
      const salesCollection = collection(db, 'vendas');
      const now = new Date();
      
      // Dados de hoje
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const todayQuery = query(
        salesCollection, 
        where('dataVenda', '>=', todayStart),
        where('dataVenda', '<=', todayEnd)
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // Dados da semana
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const weekQuery = query(
        salesCollection,
        where('dataVenda', '>=', weekStart),
        where('dataVenda', '<=', weekEnd)
      );
      const weekSnapshot = await getDocs(weekQuery);
      
      // Dados do mês
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthQuery = query(
        salesCollection,
        where('dataVenda', '>=', monthStart),
        where('dataVenda', '<=', monthEnd)
      );
      const monthSnapshot = await getDocs(monthQuery);
      
      // Vendas recentes
      const recentQuery = query(
        salesCollection,
        orderBy('dataVenda', 'desc'),
        limit(5)
      );
      const recentSnapshot = await getDocs(recentQuery);
      
      // Processar dados
      const processPeriodData = (snapshot) => {
        let total = 0;
        let count = 0;
        const byPaymentMethod = {};
        const bySalesType = {};
        
        paymentMethods.forEach(method => {
          byPaymentMethod[method.key] = 0;
        });
        
        salesTypes.forEach(type => {
          bySalesType[type.key] = 0;
        });
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          total += parseFloat(data.total || 0);
          count++;
          
          paymentMethods.forEach(method => {
            const value = parseFloat(data[method.key] || 0);
            byPaymentMethod[method.key] += value;
          });
          
          salesTypes.forEach(type => {
            const value = parseFloat(data[type.key] || 0);
            bySalesType[type.key] += value;
          });
        });
        
        return { total, count, byPaymentMethod, bySalesType };
      };
      
      const todayData = processPeriodData(todaySnapshot);
      const weekData = processPeriodData(weekSnapshot);
      const monthData = processPeriodData(monthSnapshot);
      
      setSalesData({
        today: todayData,
        week: weekData,
        month: monthData,
        byPaymentMethod: monthData.byPaymentMethod,
        bySalesType: monthData.bySalesType
      });
      
      // Vendas recentes
      const recent = [];
      recentSnapshot.forEach((doc) => {
        const data = doc.data();
        recent.push({
          id: doc.id,
          ...data,
          dataVenda: data.dataVenda.toDate()
        });
      });
      setRecentSales(recent);
      
      // Calcular estimativa mensal após carregar os dados principais
      await calculateMonthlyEstimation();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral das suas vendas</p>
        </div>
        <button
          onClick={loadSalesData}
          className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesData.today.total)}
              </p>
              <p className="text-sm text-gray-500">
                {salesData.today.count} vendas
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesData.week.total)}
              </p>
              <p className="text-sm text-gray-500">
                {salesData.week.count} vendas
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(salesData.month.total)}
              </p>
              <p className="text-sm text-gray-500">
                {salesData.month.count} vendas
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quadro de Estimativa Mensal */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Estimativa de Vendas Sagres - {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <p className="text-sm text-gray-500">
                Baseado na média diária do mês atual
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vendas Atuais do Mês */}
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Vendas Atuais</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(monthlyEstimation.currentMonthTotal)}
                </p>
                <p className="text-xs text-blue-500">Este mês</p>
              </div>
              <div className="text-blue-500">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Média Diária */}
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Média Diária</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(monthlyEstimation.averageDaily)}
                </p>
                <p className="text-xs text-green-500">Por dia</p>
              </div>
              <div className="text-green-500">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Projeção Mensal */}
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Projeção Mensal</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(monthlyEstimation.projection)}
                </p>
                <p className="text-xs text-purple-500">Estimativa total</p>
              </div>
              <div className="text-purple-500">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Dias no Mês */}
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dias no Mês</p>
                <p className="text-2xl font-bold text-gray-700">
                  {monthlyEstimation.daysInMonth}
                </p>
                <p className="text-xs text-gray-500">Total de dias</p>
              </div>
              <div className="text-gray-500">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso do Mês</span>
            <span className="text-sm text-gray-500">
              {formatCurrency(monthlyEstimation.currentMonthTotal)} / {formatCurrency(monthlyEstimation.projection)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${monthlyEstimation.projection > 0 ? (monthlyEstimation.currentMonthTotal / monthlyEstimation.projection) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">
              {monthlyEstimation.projection > 0 ? 
                `${((monthlyEstimation.currentMonthTotal / monthlyEstimation.projection) * 100).toFixed(1)}%` : 
                '0%'
              }
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              <strong>Cálculo:</strong> Média diária × {monthlyEstimation.daysInMonth} dias = {formatCurrency(monthlyEstimation.projection)}
            </p>
            <p>
              <strong>Baseado em:</strong> Vendas Sagres (Mesas + Entregas) do mês atual
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações de Vendas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Informações de Vendas (Mês)
          </h3>
          <p className="text-sm text-gray-500 mb-4">Dados informativos registrados</p>
          <div className="space-y-3">
            {salesTypes.map((type) => {
              const value = salesData.bySalesType[type.key] || 0;
              const totalSalesTypes = salesTypes.reduce((total, t) => total + (salesData.bySalesType[t.key] || 0), 0);
              const percentage = totalSalesTypes > 0 ? (value / totalSalesTypes) * 100 : 0;
              
              return (
                <div key={type.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 ${type.color} rounded-full flex items-center justify-center text-white text-xs`}>
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {type.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Total Sagres (Mesas + Entregas) */}
            {(salesData.bySalesType.vendasMesas > 0 || salesData.bySalesType.vendasEntregas > 0) && (
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                      🍺
                    </div>
                    <span className="text-sm font-bold text-blue-700">
                      Total Sagres
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency((salesData.bySalesType.vendasMesas || 0) + (salesData.bySalesType.vendasEntregas || 0))}
                    </div>
                    <div className="text-xs text-blue-500">
                      Mesas + Entregas
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                * Valores informativos (não inclusos no total financeiro)
              </div>
            </div>
          </div>
        </div>

        {/* Vendas por Forma de Pagamento */}
        <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vendas por Forma de Pagamento (Mês)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const value = salesData.byPaymentMethod[method.key] || 0;
              const totalPayments = paymentMethods.reduce((total, m) => total + (salesData.byPaymentMethod[m.key] || 0), 0);
              const percentage = totalPayments > 0 ? (value / totalPayments) * 100 : 0;
              
              return (
                <div key={method.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 ${method.color} rounded-full flex items-center justify-center text-white text-xs`}>
                      {method.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {method.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendas Recentes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vendas Recentes
          </h3>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(sale.dataVenda, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="text-right">
                    <DollarSign className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                Nenhuma venda registrada ainda
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
