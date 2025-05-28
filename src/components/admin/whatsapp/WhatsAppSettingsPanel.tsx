'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquareIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
  PhoneIcon,
  AlertTriangleIcon
} from 'lucide-react';

interface WhatsAppSettings {
  isConfigured: boolean;
  baseUrl: string;
  instanceId: string | null;
  apiKey: string | null;
}

interface ConnectionStatus {
  success: boolean;
  message: string;
}

export default function WhatsAppSettingsPanel() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/whatsapp/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/whatsapp/test');
      const data = await response.json();
      setConnectionStatus({
        success: data.status === 'success',
        message: data.message
      });
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestResult('Please enter a phone number');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage || 'Test message from your complaint management system!'
        }),
      });

      const data = await response.json();
      setTestResult(data.status === 'success' ? 'Test message sent successfully!' : data.message);
    } catch (error) {
      setTestResult('Failed to send test message');
    } finally {
      setTestLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCwIcon className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5" />
            WhatsApp Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Configuration Status</p>
              <p className="text-sm text-muted-foreground">
                {settings.isConfigured 
                  ? 'WhatsApp API credentials are configured' 
                  : 'WhatsApp API credentials are not configured'
                }
              </p>
            </div>
            <Badge variant={settings.isConfigured ? 'default' : 'destructive'}>
              {settings.isConfigured ? (
                <>
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>

          {settings.isConfigured && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Base URL</p>
                  <p className="text-sm text-muted-foreground">{settings.baseUrl}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Instance ID</p>
                  <p className="text-sm text-muted-foreground">{settings.instanceId || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">API Key</p>
                  <p className="text-sm text-muted-foreground">{settings.apiKey || 'Not set'}</p>
                </div>
              </div>

              <Separator />
              
              {/* Connection Test */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Connection Test</p>
                    <p className="text-sm text-muted-foreground">
                      Test the connection to WhatsApp API
                    </p>
                  </div>
                  <Button 
                    onClick={testConnection} 
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <SettingsIcon className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>

                {connectionStatus && (
                  <Alert variant={connectionStatus.success ? 'default' : 'destructive'}>
                    <AlertDescription className="flex items-center gap-2">
                      {connectionStatus.success ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <XCircleIcon className="h-4 w-4" />
                      )}
                      {connectionStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables Setup */}
      {!settings.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">WhatsApp API Setup Required</p>
                <p className="mb-4">
                  To enable WhatsApp notifications, you need to configure the following environment variables:
                </p>
                <div className="space-y-2 font-mono text-sm bg-muted p-3 rounded">
                  <div>WAAPI_INSTANCE_ID=your_instance_id</div>
                  <div>WAAPI_API_KEY=your_api_key</div>
                  <div>WAAPI_BASE_URL=https://waapi.app/api/v1 (optional)</div>
                </div>
                <p className="mt-4 text-sm">
                  After adding these variables to your .env.local file, restart your application.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Test Message */}
      {settings.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendIcon className="h-5 w-5" />
              Send Test Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Phone Number</Label>
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="923001234567 or 03001234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Enter with country code (e.g., 923001234567) or local format (03001234567)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testMessage">Custom Message (Optional)</Label>
                <Input
                  id="testMessage"
                  placeholder="Test message content..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={sendTestMessage}
              disabled={testLoading || !testPhone.trim()}
              className="w-full md:w-auto"
            >
              {testLoading ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PhoneIcon className="h-4 w-4 mr-2" />
              )}
              Send Test Message
            </Button>

            {testResult && (
              <Alert variant={testResult.includes('successfully') ? 'default' : 'destructive'}>
                <AlertDescription>
                  {testResult}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Events */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            When configured, WhatsApp notifications will be sent automatically for these events:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Complaint Events</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• New complaint created</li>
                <li>• Complaint assigned/reassigned</li>
                <li>• Status changes</li>
                <li>• Comments added</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Recipients</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complaint assignees</li>
                <li>• Department managers</li>
                <li>• System administrators</li>
                <li>• Clients (for their complaints)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
