'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ClientDashboard() {
  const params = useParams();
  const router = useRouter();
  const accountSlug = params.account_slug;

  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [period, accountSlug]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/${accountSlug}/conversations?period=${period}`);
      setData(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      if (error.response?.status === 404) {
        setError('Cliente não encontrado. Verifique a URL.');
      } else {
        setError('Erro ao carregar dados. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const getPeriodLabel = () => {
    if (period === 'week') return 'Última Semana';
    if (period === 'month') return 'Último Mês';
    return 'Todo Período';
  };

  const getChartData = () => {
    if (!data?.stats?.interactions?.linear) return [];

    return data.stats.interactions.linear.map(item => ({
      name: item.label,
      interacoes: item.interactions,
      volume: item.count,
      erv_total: item.total_erv,
      human_attendance: item.human_attendance || 0
    }));
  };

  const getTagDisplayName = (tag) => {
    const names = {
      'nao_conheco': 'Não Conheço',
      'sou_eu': 'Sou Eu',
      'bloquear': 'Bloquear',
      'sem_tags': 'Sem Tags'
    };
    return names[tag] || tag;
  };

  const getTagPieData = () => {
    if (!data?.stats?.tagPresence) return [];

    return data.stats.tagPresence.map(item => ({
      name: getTagDisplayName(item.tag),
      value: item.count,
      percentage: item.percentage
    }));
  };

  const getTagKeyChartData = () => {
    if (!data?.stats?.tagKeyLinear) return [];

    return data.stats.tagKeyLinear.map(item => ({
      name: item.label,
      interacoes: item.interactions,
      volume: item.count,
      erv_total: item.total_erv,
      human_attendance: item.human_attendance || 0
    }));
  };

  const getFilterUrl = (key) => {
    if (!data?.account_slug) return null;

    const baseUrl = `https://console.moveo.ai/${data.account_slug}/analytics/human-chat-logs?filters=`;
    const filters = {
      'total': null, // No filter for total
      'more_than_3': 'W3sibWluTnVtVXNlck1lc3NhZ2VzIjozLCJ0eXBlIjoibWluTnVtVXNlck1lc3NhZ2VzIn1d',
      'more_than_5': 'W3sibWluTnVtVXNlck1lc3NhZ2VzIjo1LCJ0eXBlIjoibWluTnVtVXNlck1lc3NhZ2VzIn1d',
      'more_than_7': 'W3sibWluTnVtVXNlck1lc3NhZ2VzIjo3LCJ0eXBlIjoibWluTnVtVXNlck1lc3NhZ2VzIn9d',
      'more_than_10': 'W3sibWluTnVtVXNlck1lc3NhZ2VzIjoxMCwidHlwZSI6Im1pbk51bVVzZXJNZXNzYWdlcyJ9XQ'
    };

    return filters[key] ? baseUrl + filters[key] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Erro ao carregar dados</div>
      </div>
    );
  }

  const tagKeyName = data?.config?.tag_key ? getTagDisplayName(data.config.tag_key) : 'Tag Principal';

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatório de Conversas - {data?.config?.display_name || accountSlug}
          </h1>
          <p className="text-gray-600">
            Análise de volume e ERV por etapas de interação
          </p>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Período
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setPeriod('week')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                period === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Última Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                period === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Último Mês
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                period === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todo Período
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Período</div>
              <div className="text-2xl font-bold text-gray-900">{getPeriodLabel()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total de Conversas</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(data.total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">ERV Total</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.stats.interactions.total.total_erv)}
              </div>
            </div>
          </div>
        </div>

        {/* Interactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Análise por Etapas de Interação
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" rowSpan={2}>
                    Etapa
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" colSpan={3}>
                    Volume
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" colSpan={3}>
                    ERV Total
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" rowSpan={2}>
                    % Atend.<br/>Humano
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" rowSpan={2}>
                    Ações
                  </th>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 border-l border-gray-200">
                    Absoluto
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    % do Total
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    Evolução %
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 border-l border-gray-200">
                    Absoluto
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    % do Total
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    Evolução %
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Total de Conversas', key: 'total' },
                  { label: 'Mais de 3 Interações', key: 'more_than_3' },
                  { label: 'Mais de 5 Interações', key: 'more_than_5' },
                  { label: 'Mais de 7 Interações', key: 'more_than_7' },
                  { label: 'Mais de 10 Interações', key: 'more_than_10' }
                ].map(({ label, key }, index, array) => {
                  const item = data.stats.interactions[key];
                  const totalCount = data.stats.interactions.total.count;
                  const totalErv = data.stats.interactions.total.total_erv;

                  const volumePercentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                  const ervPercentage = totalErv > 0 ? (item.total_erv / totalErv) * 100 : 0;

                  // Calculate evolution from previous row
                  let volumeEvolution = null;
                  let ervEvolution = null;

                  if (index > 0) {
                    const prevItem = data.stats.interactions[array[index - 1].key];
                    volumeEvolution = prevItem.count > 0 ? (item.count / prevItem.count) * 100 : 0;
                    ervEvolution = prevItem.total_erv > 0 ? (item.total_erv / prevItem.total_erv) * 100 : 0;
                  }

                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{label}</td>

                      {/* Volume columns */}
                      <td className="py-3 px-4 text-sm text-gray-900 text-right border-l border-gray-100">
                        {formatNumber(item.count)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        <div className="space-y-1">
                          <div className="font-medium">{formatPercentage(volumePercentage)}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${volumePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {volumeEvolution !== null ? (
                          <div className="space-y-1">
                            <div className={volumeEvolution >= 50 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                              {formatPercentage(volumeEvolution)}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={volumeEvolution >= 50 ? 'bg-green-600 h-1.5 rounded-full transition-all' : 'bg-orange-600 h-1.5 rounded-full transition-all'}
                                style={{ width: `${Math.min(volumeEvolution, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* ERV columns */}
                      <td className="py-3 px-4 text-sm text-green-600 text-right font-medium border-l border-gray-100">
                        {formatCurrency(item.total_erv)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        <div className="space-y-1">
                          <div className="font-medium">{formatPercentage(ervPercentage)}</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${ervPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {ervEvolution !== null ? (
                          <div className="space-y-1">
                            <div className={ervEvolution >= 50 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                              {formatPercentage(ervEvolution)}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={ervEvolution >= 50 ? 'bg-green-600 h-1.5 rounded-full transition-all' : 'bg-orange-600 h-1.5 rounded-full transition-all'}
                                style={{ width: `${Math.min(ervEvolution, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Human Attendance column */}
                      <td className="py-3 px-4 text-sm text-gray-900 text-right border-l border-gray-100">
                        <div className="space-y-1">
                          <div className="font-medium text-purple-600">
                            {formatPercentage(item.human_attendance_percentage)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${item.human_attendance_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions column */}
                      <td className="py-3 px-4 text-center border-l border-gray-100">
                        {getFilterUrl(key) ? (
                          <a
                            href={getFilterUrl(key)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            Ver Conversas
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interaction Charts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Evolução por Interações
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume de Conversas</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    formatter={(value) => formatNumber(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Volume Total"
                  />
                  <Line
                    type="monotone"
                    dataKey="human_attendance"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="Com Atendimento Humano"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">ERV Total</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()} margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis
                    stroke="#6b7280"
                    width={90}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    formatter={(value) => [formatCurrency(value), 'ERV Total']}
                  />
                  <Line
                    type="monotone"
                    dataKey="erv_total"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    name="ERV Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tag Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Distribuição de Tags
          </h2>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={getTagPieData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  labelLine={true}
                >
                  {getTagPieData().map((entry, index) => {
                    const colors = ['#3b82f6', '#10b981', '#ef4444', '#9ca3af'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${formatNumber(value)} conversas (${props.payload.percentage.toFixed(1)}%)`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tag Key Analysis */}
        {data?.stats?.tags?.[data?.config?.tag_key] &&
         data.stats.tags[data.config.tag_key].total.count > 0 &&
         data?.stats?.tagKeyLinear &&
         data.stats.tagKeyLinear.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Análise de Conversas - Tag: {tagKeyName}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700" rowSpan={2}>
                        Etapa
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" colSpan={3}>
                        Volume
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" colSpan={3}>
                        ERV Total
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 border-l border-gray-300" rowSpan={2}>
                        % Atend.<br/>Humano
                      </th>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 border-l border-gray-200">
                        Absoluto
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                        % do Total
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                        Evolução %
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 border-l border-gray-200">
                        Absoluto
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                        % do Total
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                        Evolução %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Total de Conversas', key: 'total' },
                      { label: 'Mais de 3 Interações', key: 'more_than_3' },
                      { label: 'Mais de 5 Interações', key: 'more_than_5' },
                      { label: 'Mais de 7 Interações', key: 'more_than_7' },
                      { label: 'Mais de 10 Interações', key: 'more_than_10' }
                    ].map(({ label, key }, index, array) => {
                      const item = data.stats.tags[data.config.tag_key][key];
                      const totalCount = data.stats.tags[data.config.tag_key].total.count;
                      const totalErv = data.stats.tags[data.config.tag_key].total.total_erv;

                      const volumePercentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                      const ervPercentage = totalErv > 0 ? (item.total_erv / totalErv) * 100 : 0;

                      // Calculate evolution from previous row
                      let volumeEvolution = null;
                      let ervEvolution = null;

                      if (index > 0) {
                        const prevItem = data.stats.tags[data.config.tag_key][array[index - 1].key];
                        volumeEvolution = prevItem.count > 0 ? (item.count / prevItem.count) * 100 : 0;
                        ervEvolution = prevItem.total_erv > 0 ? (item.total_erv / prevItem.total_erv) * 100 : 0;
                      }

                      return (
                        <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">{label}</td>

                          {/* Volume columns */}
                          <td className="py-3 px-4 text-sm text-gray-900 text-right border-l border-gray-100">
                            {formatNumber(item.count)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            <div className="space-y-1">
                              <div className="font-medium">{formatPercentage(volumePercentage)}</div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${volumePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {volumeEvolution !== null ? (
                              <div className="space-y-1">
                                <div className={volumeEvolution >= 50 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                                  {formatPercentage(volumeEvolution)}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={volumeEvolution >= 50 ? 'bg-green-600 h-1.5 rounded-full transition-all' : 'bg-orange-600 h-1.5 rounded-full transition-all'}
                                    style={{ width: `${Math.min(volumeEvolution, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          {/* ERV columns */}
                          <td className="py-3 px-4 text-sm text-green-600 text-right font-medium border-l border-gray-100">
                            {formatCurrency(item.total_erv)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            <div className="space-y-1">
                              <div className="font-medium">{formatPercentage(ervPercentage)}</div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${ervPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 text-right">
                            {ervEvolution !== null ? (
                              <div className="space-y-1">
                                <div className={ervEvolution >= 50 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                                  {formatPercentage(ervEvolution)}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={ervEvolution >= 50 ? 'bg-green-600 h-1.5 rounded-full transition-all' : 'bg-orange-600 h-1.5 rounded-full transition-all'}
                                    style={{ width: `${Math.min(ervEvolution, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          {/* Human Attendance column */}
                          <td className="py-3 px-4 text-sm text-gray-900 text-right border-l border-gray-100">
                            <div className="space-y-1">
                              <div className="font-medium text-purple-600">
                                {formatPercentage(item.human_attendance_percentage)}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${item.human_attendance_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Evolução por Interações - Tag: {tagKeyName}
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Volume de Conversas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getTagKeyChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value) => formatNumber(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        name="Volume Total"
                      />
                      <Line
                        type="monotone"
                        dataKey="human_attendance"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ fill: '#ec4899', r: 4 }}
                        name="Com Atendimento Humano"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">ERV Total</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getTagKeyChartData()} margin={{ left: 20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis
                        stroke="#6b7280"
                        width={90}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value) => [formatCurrency(value), 'ERV Total']}
                      />
                      <Line
                        type="monotone"
                        dataKey="erv_total"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        name="ERV Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
