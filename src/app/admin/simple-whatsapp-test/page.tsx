'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleWhatsAppTest() {
  const [phone, setPhone] = useState('923343867280');
  const [message, setMessage] = useState('Hello from Next.js!');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendMessage = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, message }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Network error: ' + error 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Simple WhatsApp Test (Exact Curl Format)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="923343867280"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message here"
              rows={3}
            />
          </div>
          
          <Button 
            onClick={sendMessage} 
            disabled={loading || !phone || !message}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send WhatsApp Message'}
          </Button>
          
          {result && (
            <div className={`p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <h3 className="font-bold">
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              <p className="text-sm mt-1">
                {result.success ? result.message : result.error}
              </p>
              {result.chatId && (
                <p className="text-xs mt-2">Chat ID: {result.chatId}</p>
              )}
              {result.response && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">API Response</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}