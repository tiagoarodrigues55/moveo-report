'use client';

import { useRouter } from 'next/navigation';
import { getAllAccountSlugs } from '@/config/clients';

export default function Home() {
  const router = useRouter();
  const accountSlugs = getAllAccountSlugs();

  const handleClientSelect = (slug) => {
    router.push(`/${slug}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Relatórios Moveo
            </h1>
            <p className="text-gray-600">
              Selecione um cliente para visualizar os relatórios
            </p>
          </div>

          {accountSlugs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Nenhum cliente configurado</p>
              <p className="text-sm text-gray-500">
                Adicione clientes no arquivo <code className="bg-gray-100 px-2 py-1 rounded">config/clients.js</code>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accountSlugs.map((slug) => (
                <button
                  key={slug}
                  onClick={() => handleClientSelect(slug)}
                  className="w-full text-left px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg capitalize">
                        {slug.replace(/-/g, ' ')}
                      </div>
                      <div className="text-sm text-blue-100 mt-1">
                        Visualizar relatórios
                      </div>
                    </div>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Para adicionar mais clientes, edite o arquivo de configuração</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                config/clients.js
              </code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
