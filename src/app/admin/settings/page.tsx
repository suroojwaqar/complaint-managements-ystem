'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  ArrowLeft,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Shield,
  Users,
  Target
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/lib/toast';

// Import design system components
import {
  PageContainer,
  PageHeader,
  ContentCard,
  ErrorState,
  PageSkeleton
} from '@/components/layout/pages';

interface Department {
  _id: string;
  name: string;
  description: string;
  managerId: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  isRoutingEnabled: boolean; // New field for complaint routing
}

interface SystemSettings {
  autoRouting: {
    enabled: boolean;
    departments: string[]; // Array of department IDs that receive complaints
  };
  defaultDepartment?: string; // Fallback department ID
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    autoRouting: {
      enabled: true,
      departments: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
    fetchSettings();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        const depts = data.departments || data.data || data;
        setDepartments(Array.isArray(depts) ? depts : []);
      } else {
        throw new Error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      } else if (response.status !== 404) {
        throw new Error('Failed to fetch settings');
      }
      // If 404, use default settings
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (departmentId: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      autoRouting: {
        ...prev.autoRouting,
        departments: enabled 
          ? [...prev.autoRouting.departments, departmentId]
          : prev.autoRouting.departments.filter(id => id !== departmentId)
      }
    }));
  };

  const handleAutoRoutingToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      autoRouting: {
        ...prev.autoRouting,
        enabled
      }
    }));
  };

  const handleSetDefault = (departmentId: string) => {
    setSettings(prev => ({
      ...prev,
      defaultDepartment: departmentId
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');

      console.log('Saving settings:', settings);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const enabledDepartments = departments.filter(dept => 
    settings.autoRouting.departments.includes(dept._id)
  );

  return (
    <PageContainer className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="System Settings"
        description="Configure complaint routing and system behavior"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        }
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Auto-Routing Configuration */}
      <ContentCard
        title="Complaint Auto-Routing"
        description="Configure automatic complaint routing to departments"
        headerActions={
          <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Enable/Disable Auto-Routing */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <div className="text-base font-medium">Enable Auto-Routing</div>
              <div className="text-sm text-muted-foreground">
                Automatically route new complaints to configured departments
              </div>
            </div>
            <Switch
              checked={settings.autoRouting.enabled}
              onCheckedChange={handleAutoRoutingToggle}
            />
          </div>

          {settings.autoRouting.enabled && (
            <>
              <Separator />
              
              {/* Department Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Department Configuration</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select which departments should receive all new complaints. Complaints will be automatically assigned to the department manager.
                </p>

                <div className="grid gap-4">
                  {departments.filter(dept => dept.isActive).map((department) => {
                    const isEnabled = settings.autoRouting.departments.includes(department._id);
                    const isDefault = settings.defaultDepartment === department._id;
                    
                    return (
                      <Card key={department._id} className={`transition-colors ${isEnabled ? 'border-primary bg-primary/5' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {department.name}
                                    {isDefault && (
                                      <Badge variant="secondary" className="text-xs">
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Manager: {department.managerId?.name || 'No manager assigned'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {department.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isEnabled && !isDefault && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefault(department._id)}
                                  className="text-xs"
                                >
                                  Set as Default
                                </Button>
                              )}
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => handleDepartmentToggle(department._id, checked)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {enabledDepartments.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No departments are configured for auto-routing. Enable at least one department to start routing complaints automatically.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </div>
      </ContentCard>

      {/* Routing Summary */}
      {settings.autoRouting.enabled && enabledDepartments.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Routing Summary
            </CardTitle>
            <CardDescription>
              How complaints will be automatically routed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Enabled Departments ({enabledDepartments.length})
                  </h4>
                  <div className="space-y-1">
                    {enabledDepartments.map((dept) => (
                      <div key={dept._id} className="text-sm flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>{dept.name}</span>
                        {settings.defaultDepartment === dept._id && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Routing Logic
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• New complaints are automatically assigned to department managers</p>
                    <p>• No manual employee selection required</p>
                    <p>• Managers can reassign within their teams</p>
                    {settings.defaultDepartment && (
                      <p>• Fallback to default department if routing fails</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-3 pt-6">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset Changes
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </PageContainer>
  );
}