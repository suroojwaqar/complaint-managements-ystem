'use client';

import { useState, useEffect } from 'react';

export default function DepartmentsDebugPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testDepartmentsAPI = async () => {
    setLoading(true);
    setError('');
    setApiData(null);

    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      console.log('Raw API response:', { 
        status: response.status, 
        headers: Object.fromEntries(response.headers.entries()),
        data 
      });

      setApiData({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });

      if (!response.ok) {
        setError(`API error: ${response.status} - ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
      console.error('Departments API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDepartmentsAPI();
  }, []);

  const createTestDepartment = async () => {
    try {
      // First, let's check if we have users
      const usersResponse = await fetch('/api/users');
      const users = await usersResponse.json();
      
      console.log('Available users:', users);
      
      const managers = users.filter((u: any) => u.role === 'manager');
      const employees = users.filter((u: any) => u.role === 'employee');
      
      if (managers.length === 0 || employees.length === 0) {
        alert(`Cannot create department: Need at least 1 manager and 1 employee. Found ${managers.length} managers, ${employees.length} employees.`);
        return;
      }

      const testDept = {
        name: 'Test Department ' + Date.now(),
        description: 'Test department created for debugging',
        managerId: managers[0]._id,
        defaultAssigneeId: employees[0]._id,
      };

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testDept),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Test department created successfully!');
        testDepartmentsAPI(); // Refresh
      } else {
        alert(`Failed to create department: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Departments API Debug</h1>
        
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test Controls</h2>
          <div className="flex space-x-4">
            <button 
              onClick={testDepartmentsAPI}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Testing...' : 'Test Departments API'}
            </button>
            <button 
              onClick={createTestDepartment}
              className="btn-secondary"
            >
              Create Test Department
            </button>
          </div>
        </div>

        {error && (
          <div className="card mb-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {apiData && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">API Response</h3>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {apiData.status} ({apiData.ok ? 'OK' : 'ERROR'})
              </div>
              
              <div>
                <strong>Response Data:</strong>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(apiData.data, null, 2)}
                </pre>
              </div>

              <div>
                <strong>Analysis:</strong>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Data type: {typeof apiData.data}</li>
                  <li>• Is array: {Array.isArray(apiData.data) ? 'Yes' : 'No'}</li>
                  <li>• Has departments property: {apiData.data?.departments ? 'Yes' : 'No'}</li>
                  <li>• Departments count: {apiData.data?.departments?.length || 'N/A'}</li>
                  <li>• Has data property: {apiData.data?.data ? 'Yes' : 'No'}</li>
                  {apiData.data?.departments && (
                    <li>• Department names: {apiData.data.departments.map((d: any) => d.name).join(', ')}</li>
                  )}
                </ul>
              </div>

              <div>
                <strong>Headers:</strong>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(apiData.headers, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
