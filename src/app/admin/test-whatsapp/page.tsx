'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Phone, MessageSquare } from 'lucide-react';

export default function TestWhatsAppPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [phone, setPhone] = useState('923001234567');
  const [message, setMessage] = useState('Hello! This is a test message from the Complaint Management System.');

  // Test WhatsApp API connection
  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setConnectionStatus(result);
      
      if (result.status === 'error' && response.status === 403) {
        setConnectionStatus({
          ...result,
          message: 'Admin access required. Please login as admin first.'
        });
      }
      
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: 'Network error: ' + error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send test WhatsApp message
  const sendTestMessage = async () => {
    if (!phone || !message) {
      alert('Please enter both phone number and message');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phone.trim(), 
          message: message.trim() 
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      // Handle specific error cases
      if (result.status === 'error') {
        if (response.status === 403) {
          setTestResult({
            ...result,
            message: 'Admin access required. Please login as admin first.'
          });
        } else if (result.message.includes('403 Forbidden')) {
          setTestResult({
            ...result,
            message: 'WhatsApp API credentials are invalid. Please check your WAAPI_INSTANCE_ID and WAAPI_API_KEY in .env.local file.'
          });
        }
      }
      
    } catch (error) {
      setTestResult({
        status: 'error',
        message: 'Network error: ' + error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-green-600" />
            WhatsApp Integration Test
          </h1>
          <p className="text-gray-600 mt-2">Test and verify your WhatsApp API integration</p>
        </div>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Step 1: Test API Connection
          </CardTitle>
          <CardDescription>
            Check if your WhatsApp API credentials are configured and working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Test WhatsApp Connection
              </>
            )}
          </Button>
          
          {connectionStatus && (
            <Alert className={connectionStatus.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-start gap-2">
                {connectionStatus.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="space-y-1">
                      <div><strong>Status:</strong> {connectionStatus.status}</div>
                      <div><strong>Message:</strong> {connectionStatus.message}</div>
                      <div><strong>Time:</strong> {new Date(connectionStatus.timestamp).toLocaleString()}</div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Message Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Step 2: Send Test Message
          </CardTitle>
          <CardDescription>
            Send a test WhatsApp message to verify the integration works end-to-end
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="923001234567"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                <strong>Format:</strong> Country code + number (e.g., 923001234567 for Pakistan)
              </p>
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-medium">Test Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your test message here..."
                className="mt-1"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be sent to the phone number above
              </p>
            </div>
          </div>
          
          <Button 
            onClick={sendTestMessage} 
            disabled={isLoading || !phone || !message}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Test Message
              </>
            )}
          </Button>
          
          {testResult && (
            <Alert className={testResult.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-start gap-2">
                {testResult.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="space-y-1">
                      <div><strong>Status:</strong> {testResult.status}</div>
                      <div><strong>Message:</strong> {testResult.message}</div>
                      <div><strong>Time:</strong> {new Date(testResult.timestamp).toLocaleString()}</div>
                      {testResult.debug && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(testResult.debug, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Follow these steps if the tests are failing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">1</span>
                Get WAAPI Credentials
              </h4>
              <p className="text-gray-600 text-sm ml-8">
                Sign up at <a href="https://waapi.app" target="_blank" className="text-blue-600 underline hover:text-blue-800">waapi.app</a> and create a WhatsApp instance to get your Instance ID and API Key.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">2</span>
                Update Environment Variables
              </h4>
              <p className="text-gray-600 text-sm ml-8">
                Add your credentials to <code className="bg-gray-100 px-1 rounded">.env.local</code>:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto ml-8 border">
{`WAAPI_INSTANCE_ID=your_instance_id_here
WAAPI_API_KEY=your_api_key_here
WAAPI_BASE_URL=https://waapi.app/api/v1`}
              </pre>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">3</span>
                Connect WhatsApp
              </h4>
              <p className="text-gray-600 text-sm ml-8">
                In your WAAPI dashboard, scan the QR code to connect your WhatsApp account to the instance.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">4</span>
                Test Phone Number
              </h4>
              <p className="text-gray-600 text-sm ml-8">
                Use a valid WhatsApp number in the correct format. For Pakistan: 923XXXXXXXXX
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">5</span>
                Restart Development Server
              </h4>
              <p className="text-gray-600 text-sm ml-8">
                After updating environment variables, restart your development server:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs ml-8 border">
                npm run dev
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-amber-700">Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="border-l-4 border-red-200 pl-4">
              <h4 className="font-medium text-red-800">403 Forbidden Error</h4>
              <p className="text-red-600">Your API credentials are invalid or expired. Get new credentials from WAAPI.</p>
            </div>
            
            <div className="border-l-4 border-yellow-200 pl-4">
              <h4 className="font-medium text-yellow-800">Admin Access Required</h4>
              <p className="text-yellow-600">You need to be logged in as an admin user to test WhatsApp integration.</p>
            </div>
            
            <div className="border-l-4 border-blue-200 pl-4">
              <h4 className="font-medium text-blue-800">Message Sent But Not Received</h4>
              <p className="text-blue-600">WhatsApp has delivery rules. Try messaging your WAAPI number first, then test within 24 hours.</p>
            </div>
            
            <div className="border-l-4 border-green-200 pl-4">
              <h4 className="font-medium text-green-800">Success but No Delivery</h4>
              <p className="text-green-600">Check your WAAPI dashboard for message logs and delivery status.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}