'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, Users, Clock, CheckCircle, AlertTriangle, Star } from 'lucide-react';

interface ManagerReportData {
  departmentStats: {
    totalComplaints: number;
    resolvedComplaints: number;
    avgResolutionTime: number;
    teamSize: number;
    pendingComplaints: number;
  };
  teamPerformance: Array<{
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    assignedComplaints: number;
    resolvedComplaints: number;
    avgResolutionTime: number;
    performance: number;
    rating: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    received: number;
    resolved: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}

export default function ManagerReportsPage() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<ManagerReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData: ManagerReportData = {
        departmentStats: {
          totalComplaints: 156,
          resolvedComplaints: 134,
          avgResolutionTime: 18,
          teamSize: 8,
          pendingComplaints: 22
        },
        teamPerformance: [
          {
            userId: '1',
            name: 'John Smith',
            email: 'john@example.com',
            assignedComplaints: 45,
            resolvedComplaints: 42,
            avgResolutionTime: 16,
            performance: 93,
            rating: 4.8
          },
          {
            userId: '2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            assignedComplaints: 38,
            resolvedComplaints: 35,
            avgResolutionTime: 20,
            performance: 92,
            rating: 4.6
          },
          {
            userId: '3',
            name: 'Mike Wilson',
            email: 'mike@example.com',
            assignedComplaints: 32,
            resolvedComplaints: 28,
            avgResolutionTime: 24,
            performance: 87,
            rating: 4.3
          }
        ],
        weeklyTrends: [
          { week: 'Week 1', received: 25, resolved: 23 },
          { week: 'Week 2', received: 30, resolved: 28 },
          { week: 'Week 3', received: 28, resolved: 26 },
          { week: 'Week 4', received: 35, resolved: 32 }
        ],
        priorityDistribution: [
          { priority: 'High', count: 45, percentage: 29 },
          { priority: 'Medium', count: 78, percentage: 50 },
          { priority: 'Low', count: 33, percentage: 21 }
        ]
      };
      setReportData(mockData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      console.log(`Exporting ${format} report`);
      // Export functionality would be implemented here
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold">Department Reports</h1>
          <p className="text-muted-foreground">Team performance and department analytics</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {reportData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Department KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                      <p className="text-2xl font-bold">{reportData.departmentStats.totalComplaints}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold">{reportData.departmentStats.resolvedComplaints}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{reportData.departmentStats.pendingComplaints}</p>
                    </div>
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                      <p className="text-2xl font-bold">{reportData.departmentStats.avgResolutionTime}h</p>
                    </div>
                    <Clock className="h-6 w-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                      <p className="text-2xl font-bold">{reportData.departmentStats.teamSize}</p>
                    </div>
                    <Users className="h-6 w-6 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resolution Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Department Resolution Rate</CardTitle>
                <CardDescription>Overall performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Resolution Rate</span>
                    <span className="text-sm font-bold">
                      {((reportData.departmentStats.resolvedComplaints / reportData.departmentStats.totalComplaints) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={(reportData.departmentStats.resolvedComplaints / reportData.departmentStats.totalComplaints) * 100} 
                    className="h-3" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.priorityDistribution.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.priority} Priority</span>
                        <span>{item.count} ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Individual team member statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reportData.teamPerformance.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned</p>
                          <p className="font-semibold">{member.assignedComplaints}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Resolved</p>
                          <p className="font-semibold">{member.resolvedComplaints}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Time</p>
                          <p className="font-semibold">{member.avgResolutionTime}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Performance</p>
                          <div className="flex items-center gap-1">
                            <Badge variant={member.performance >= 90 ? 'default' : member.performance >= 80 ? 'secondary' : 'destructive'}>
                              {member.performance}%
                            </Badge>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < member.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
                <CardDescription>Complaints received vs resolved over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.weeklyTrends.map((week, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{week.week}</span>
                        <span>Received: {week.received} | Resolved: {week.resolved}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Received</p>
                          <Progress value={(week.received / 40) * 100} className="h-2" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resolved</p>
                          <Progress value={(week.resolved / 40) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
