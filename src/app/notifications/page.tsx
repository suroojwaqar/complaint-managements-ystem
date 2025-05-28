'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  Settings,
  Filter,
  MarkAsRead
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  userId: string;
  complaintId: string;
  message: string;
  type: 'email' | 'whatsapp' | 'system';
  isRead: boolean;
  createdAt: string;
  complaint?: {
    title: string;
    status: string;
  };
}

interface NotificationSettings {
  email: boolean;
  whatsapp: boolean;
  system: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    whatsapp: false,
    system: true,
    emailFrequency: 'instant',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'email' | 'whatsapp' | 'system'>('all');
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          _id: '1',
          userId: session?.user?.id || '',
          complaintId: 'comp1',
          message: 'Your complaint #COMP-001 has been assigned to technical team',
          type: 'system',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          complaint: { title: 'Login Issue', status: 'Assigned' }
        },
        {
          _id: '2',
          userId: session?.user?.id || '',
          complaintId: 'comp2',
          message: 'Status update: Your complaint has been resolved',
          type: 'email',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          complaint: { title: 'Payment Problem', status: 'Resolved' }
        },
        {
          _id: '3',
          userId: session?.user?.id || '',
          complaintId: 'comp3',
          message: 'New complaint received from client',
          type: 'system',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          complaint: { title: 'Feature Request', status: 'New' }
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      // Settings would be fetched from API
      console.log('Fetching settings...');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    toast.success('Marked as read');
  };

  const markAllAsRead = async () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif._id !== notificationId)
    );
    toast.success('Notification deleted');
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    toast.success('Settings updated successfully');
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notif => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notif.isRead;
      return notif.type === filter;
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'whatsapp':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filter Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('email')}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button
                  variant={filter === 'whatsapp' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('whatsapp')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  variant={filter === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('system')}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-3">
            {getFilteredNotifications().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "No notifications found for the selected filter."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredNotifications().map((notification) => (
                <Card key={notification._id} className={`${!notification.isRead ? 'border-l-4 border-l-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.message}
                          </p>
                          {notification.complaint && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Complaint: {notification.complaint.title}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.email}
                    onCheckedChange={(checked) => updateSettings({ email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <Label htmlFor="whatsapp-notifications">WhatsApp Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="whatsapp-notifications"
                    checked={settings.whatsapp}
                    onCheckedChange={(checked) => updateSettings({ whatsapp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="system-notifications">System Notifications</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive in-app notifications
                    </p>
                  </div>
                  <Switch
                    id="system-notifications"
                    checked={settings.system}
                    onCheckedChange={(checked) => updateSettings({ system: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Frequency</CardTitle>
              <CardDescription>How often you want to receive email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="instant"
                    name="frequency"
                    checked={settings.emailFrequency === 'instant'}
                    onChange={() => updateSettings({ emailFrequency: 'instant' })}
                  />
                  <Label htmlFor="instant">Instant - Get notified immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="daily"
                    name="frequency"
                    checked={settings.emailFrequency === 'daily'}
                    onChange={() => updateSettings({ emailFrequency: 'daily' })}
                  />
                  <Label htmlFor="daily">Daily - Once per day digest</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="weekly"
                    name="frequency"
                    checked={settings.emailFrequency === 'weekly'}
                    onChange={() => updateSettings({ emailFrequency: 'weekly' })}
                  />
                  <Label htmlFor="weekly">Weekly - Weekly summary</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>Set times when you don't want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours">Enable quiet hours</Label>
                <Switch
                  id="quiet-hours"
                  checked={settings.quietHours.enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ 
                      quietHours: { ...settings.quietHours, enabled: checked } 
                    })
                  }
                />
              </div>
              
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-sm">Start time</Label>
                    <input
                      type="time"
                      id="start-time"
                      value={settings.quietHours.start}
                      onChange={(e) => 
                        updateSettings({
                          quietHours: { ...settings.quietHours, start: e.target.value }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-sm">End time</Label>
                    <input
                      type="time"
                      id="end-time"
                      value={settings.quietHours.end}
                      onChange={(e) => 
                        updateSettings({
                          quietHours: { ...settings.quietHours, end: e.target.value }
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
