// Debug component to test tasks functionality
import React, { useState, useEffect } from 'react';
import { supabase } from './src/utils/supabase.js';
import { useAuthContext } from './src/components/auth/AuthProvider';

export default function DebugTasks() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult('Testing...');

    try {
      console.log('Current user:', user);
      setTestResult(prev => prev + '\n✓ User: ' + (user ? user.email : 'Not logged in'));

      // Test basic Supabase connection
      const { data: testData, error: testError } = await supabase
        .from('tasks')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Supabase test error:', testError);
        setTestResult(prev => prev + '\n❌ Supabase error: ' + testError.message);
        setError('Supabase error: ' + testError.message);
      } else {
        setTestResult(prev => prev + '\n✓ Supabase connection working');

        // Try to fetch tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .limit(5);

        if (tasksError) {
          console.error('Tasks fetch error:', tasksError);
          setTestResult(prev => prev + '\n❌ Tasks fetch error: ' + tasksError.message);
          setError('Tasks error: ' + tasksError.message);
        } else {
          console.log('Tasks data:', tasksData);
          setTestResult(prev => prev + '\n✓ Tasks fetched: ' + (tasksData?.length || 0) + ' tasks');
          setTasks(tasksData || []);
        }
      }
    } catch (err) {
      console.error('Test error:', err);
      setTestResult(prev => prev + '\n❌ Exception: ' + err.message);
      setError('Exception: ' + err.message);
    }

    setLoading(false);
  };

  const testCreateTask = async () => {
    if (!user) {
      setError('Must be logged in');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: 'Test Task ' + Date.now(),
          description: 'Debug test task',
          priority: 'medium',
          status: 'pending',
          created_by: user.id
        }])
        .select();

      if (error) {
        console.error('Create task error:', error);
        setError('Create error: ' + error.message);
        setTestResult(prev => prev + '\n❌ Create failed: ' + error.message);
      } else {
        console.log('Task created:', data);
        setTestResult(prev => prev + '\n✓ Task created successfully');
        setTasks(prev => [...data, ...prev]);
      }
    } catch (err) {
      console.error('Create exception:', err);
      setError('Create exception: ' + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      testConnection();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Debug Tasks - Not Authenticated</h2>
        <p>Please log in to test tasks functionality.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Debug Tasks</h2>

      <div className="mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>

        <button
          onClick={testCreateTask}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Test Create Task'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold">Test Results:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
          {testResult || 'No tests run yet'}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold">Tasks ({tasks.length}):</h3>
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={task.id || index} className="p-2 bg-gray-50 rounded">
              <strong>{task.title}</strong>
              <br />
              <small>Status: {task.status} | Priority: {task.priority}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}