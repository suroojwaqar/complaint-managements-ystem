'use client';

import { useState } from 'react';

interface TestResult {
  status: number | string;
  data: any;
  error: string | null;
}

interface TestResults {
  [endpoint: string]: TestResult;
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResults>({});

  const testEndpoint = async (endpoint: string, method: string = 'GET') => {
    try {
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      setResults((prev: TestResults) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
          error: response.ok ? null : data.error
        }
      }));
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        [endpoint]: {
          status: 'Network Error',
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  const endpoints = [
    '/api/test',
    '/api/departments',
    '/api/nature-types',
    '/api/complaints',
    '/api/users'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Debug Page</h1>
        
        <div className="space-y-4">
          {endpoints.map(endpoint => (
            <div key={endpoint} className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{endpoint}</h2>
                <button
                  onClick={() => testEndpoint(endpoint)}
                  className="btn-primary"
                >
                  Test
                </button>
              </div>
              
              {results[endpoint] && (
                <div className="bg-gray-100 p-4 rounded">
                  <p className="font-medium mb-2">
                    Status: <span className={typeof results[endpoint].status === 'number' && results[endpoint].status < 400 ? 'text-green-600' : 'text-red-600'}>
                      {results[endpoint].status}
                    </span>
                  </p>
                  
                  {results[endpoint].error && (
                    <p className="text-red-600 mb-2">Error: {results[endpoint].error}</p>
                  )}
                  
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(results[endpoint].data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => {
              endpoints.forEach(endpoint => testEndpoint(endpoint));
            }}
            className="btn-primary"
          >
            Test All Endpoints
          </button>
        </div>
      </div>
    </div>
  );
}
