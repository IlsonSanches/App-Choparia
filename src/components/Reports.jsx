import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download,
  TrendingUp,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'), // Primeiro dia do mês
    endDate: format(new Date(), 'yyyy-MM-dd') // Hoje
  });
  const [totals, setTotals] = useState({});

  const paymentMethods = [
    { key: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { key: 'debitoInter', label: 'Débito Inter', icon: '🏦' },
    { key: 'debitoStone', label: 'Débito Stone', icon: '💳' },
    { key: 'creditoInter', label: 'Crédito Inter', icon: '🏦' },
    { key: 'creditoStone', label: 'Crédito Stone', icon: '💳' },
    { key: 'ifoodPG', label: 'iFood PG', icon: '🍔' },
    { key: 'pix', label: 'PIX', icon: '📱' },
    { key: 'incentivoIfood', label: 'Incentivo iFood', icon: '🎁' }
  ];

  const informativeFields = [
    { key: 'vendasMesas', label: 'Vendas Mesas', icon: '🍽️' },
    { key: 'vendasEntregas', label: 'Vendas Entregas', icon: '🚚' }
  ];

  const adjustmentFields = [
    { key: 'encaixe', label: 'Encaixe', icon: '➕' },
    { key: 'desencaixe', label: 'Desencaixe', icon: '➖' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const loadReportData = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.error('Selecione as datas de início e fim');
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      toast.error('Data de início deve ser menor que data de fim');
      return;
    }

    setIsLoading(true);
    try {
      const startDate = startOfDay(parseISO(filters.startDate));
      const endDate = endOfDay(parseISO(filters.endDate));

      console.log('Carregando dados do período:', format(startDate, 'dd/MM/yyyy'), 'até', format(endDate, 'dd/MM/yyyy'));

      // Buscar vendas do período
      const salesCollection = collection(db, 'vendas');
      const snapshot = await getDocs(salesCollection);
      
      const salesByDate = {};
      const periodTotals = {};

      // Inicializar totais
      [...paymentMethods, ...informativeFields, ...adjustmentFields].forEach(field => {
        periodTotals[field.key] = 0;
      });
      periodTotals.total = 0;
      periodTotals.count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const saleDate = data.dataVenda ? data.dataVenda.toDate() : new Date();
        
        // Verificar se a venda está no período selecionado
        if (saleDate >= startDate && saleDate <= endDate) {
          const dateKey = format(saleDate, 'yyyy-MM-dd');
          
          if (!salesByDate[dateKey]) {
            salesByDate[dateKey] = {
              date: dateKey,
              dateFormatted: format(saleDate, "dd/MM/yyyy", { locale: ptBR }),
              dayOfWeek: format(saleDate, "EEEE", { locale: ptBR }),
              count: 0,
              total: 0,
              ...Object.fromEntries([...paymentMethods, ...informativeFields, ...adjustmentFields].map(field => [field.key, 0]))
            };
          }

          // Somar valores por método de pagamento e campos
          [...paymentMethods, ...informativeFields, ...adjustmentFields].forEach(field => {
            const value = parseFloat(data[field.key]) || 0;
            salesByDate[dateKey][field.key] += value;
            periodTotals[field.key] += value;
          });

          // Total da venda
          const saleTotal = parseFloat(data.total) || 0;
          salesByDate[dateKey].total += saleTotal;
          salesByDate[dateKey].count += 1;
          
          periodTotals.total += saleTotal;
          periodTotals.count += 1;
        }
      });

      // Converter para array e ordenar por data
      const reportArray = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

      setReportData(reportArray);
      setTotals(periodTotals);

      console.log('Dados carregados:', reportArray.length, 'dias com vendas');
      
      if (reportArray.length === 0) {
        toast.info('Nenhuma venda encontrada no período selecionado');
      } else {
        toast.success(`Relatório gerado com ${reportArray.length} dias de vendas`);
      }

    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'Data', 'Dia da Semana', 'Qtd Vendas', 'Total',
      ...paymentMethods.map(m => m.label),
      ...informativeFields.map(f => f.label),
      ...adjustmentFields.map(a => a.label)
    ];

    const csvData = reportData.map(day => [
      day.dateFormatted,
      day.dayOfWeek,
      day.count,
      day.total.toFixed(2),
      ...paymentMethods.map(m => (day[m.key] || 0).toFixed(2)),
      ...informativeFields.map(f => (day[f.key] || 0).toFixed(2)),
      ...adjustmentFields.map(a => (day[a.key] || 0).toFixed(2))
    ]);

    // Adicionar linha de totais
    csvData.push([
      'TOTAL PERÍODO',
      '',
      totals.count || 0,
      (totals.total || 0).toFixed(2),
      ...paymentMethods.map(m => (totals[m.key] || 0).toFixed(2)),
      ...informativeFields.map(f => (totals[f.key] || 0).toFixed(2)),
      ...adjustmentFields.map(a => (totals[a.key] || 0).toFixed(2))
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_periodo_${filters.startDate}_${filters.endDate}.csv`;
    link.click();

    toast.success('Relatório exportado com sucesso!');
  };

  useEffect(() => {
    loadReportData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise detalhada de vendas por período</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            disabled={reportData.length === 0}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={loadReportData}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Calendar className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros do Relatório</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReportData}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Filter className="w-4 h-4" />
              <span>Gerar Relatório</span>
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
                  endDate: format(new Date(), 'yyyy-MM-dd')
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Este Mês
            </button>
          </div>
        </div>
      </div>

      {/* Resumo do Período */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-gray-900">Resumo do Período</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.length}</div>
                <div className="text-sm text-gray-600">Dias com Vendas</div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totals.count || 0}</div>
                <div className="text-sm text-gray-600">Total de Vendas</div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.total || 0)}</div>
                <div className="text-sm text-gray-600">Faturamento Total</div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.length > 0 ? formatCurrency((totals.total || 0) / reportData.length) : formatCurrency(0)}
                </div>
                <div className="text-sm text-gray-600">Média por Dia</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Dados */}
      <div className="bg-white rounded-lg shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-accent mr-3" />
            <span className="text-gray-600">Gerando relatório...</span>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Vendas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  {paymentMethods.map(method => (
                    <th key={method.key} className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {method.icon}<br/>{method.label}
                    </th>
                  ))}
                  {informativeFields.map(field => (
                    <th key={field.key} className="px-3 py-3 text-right text-xs font-medium text-blue-600 uppercase">
                      {field.icon}<br/>{field.label}
                    </th>
                  ))}
                  {adjustmentFields.map(field => (
                    <th key={field.key} className="px-3 py-3 text-right text-xs font-medium text-purple-600 uppercase">
                      {field.icon}<br/>{field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.map((day, index) => (
                  <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-inherit">
                      <div className="font-medium text-gray-900">{day.dateFormatted}</div>
                      <div className="text-xs text-gray-500 capitalize">{day.dayOfWeek}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-blue-600">
                      {day.count}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(day.total)}
                    </td>
                    {paymentMethods.map(method => (
                      <td key={method.key} className="px-3 py-3 text-right">
                        {day[method.key] > 0 ? (
                          <span className="font-medium text-gray-900">
                            {formatCurrency(day[method.key])}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                    {informativeFields.map(field => (
                      <td key={field.key} className="px-3 py-3 text-right">
                        {day[field.key] > 0 ? (
                          <span className="font-medium text-blue-600">
                            {formatCurrency(day[field.key])}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                    {adjustmentFields.map(field => (
                      <td key={field.key} className="px-3 py-3 text-right">
                        {day[field.key] > 0 ? (
                          <span className="font-medium text-purple-600">
                            {formatCurrency(day[field.key])}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                
                {/* Linha de Totais */}
                <tr className="bg-accent bg-opacity-10 border-t-2 border-accent font-bold">
                  <td className="px-4 py-4 sticky left-0 bg-accent bg-opacity-10">
                    <div className="font-bold text-accent">TOTAL PERÍODO</div>
                    <div className="text-xs text-gray-600">{reportData.length} dias</div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-blue-700">
                    {totals.count || 0}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">
                    {formatCurrency(totals.total || 0)}
                  </td>
                  {paymentMethods.map(method => (
                    <td key={method.key} className="px-3 py-4 text-right font-bold text-gray-800">
                      {formatCurrency(totals[method.key] || 0)}
                    </td>
                  ))}
                  {informativeFields.map(field => (
                    <td key={field.key} className="px-3 py-4 text-right font-bold text-blue-700">
                      {formatCurrency(totals[field.key] || 0)}
                    </td>
                  ))}
                  {adjustmentFields.map(field => (
                    <td key={field.key} className="px-3 py-4 text-right font-bold text-purple-700">
                      {formatCurrency(totals[field.key] || 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Selecione um período e clique em "Gerar Relatório"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
