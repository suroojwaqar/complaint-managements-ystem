'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ReportData {
  overview: {
    totalComplaints: number;
    resolvedComplaints: number;
    avgResolutionTime: number;
    activeUsers: number;
    departmentPerformance: Array<{
      department: string;
      total: number;
      resolved: number;
      avgTime: number;
    }>;
  };
  trends: Array<{
    date: string;
    complaints: number;
    resolved: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  departmentWorkload: Array<{
    department: string;
    workload: number;
    capacity: number;
  }>;
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    fetchDepartments();
    fetchReportData();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        department: selectedDepartment,
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        department: selectedDepartment,
        format,
      });

      const response = await fetch(`/api/admin/reports/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaint-report-${format}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
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
          <h1 className="text-3xl font-bold">System Reports</h1>
          <p className="text-muted-foreground">Comprehensive system analytics and performance metrics</p>
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                      <p className="text-3xl font-bold">{reportData.overview.totalComplaints}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                      <p className="text-3xl font-bold">{reportData.overview.resolvedComplaints}</p>
                      <p className="text-sm text-green-600">
                        {((reportData.overview.resolvedComplaints / reportData.overview.totalComplaints) * 100).toFixed(1)}% resolved
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-3xl font-bold">{reportData.overview.avgResolutionTime}h</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-3xl font-bold">{reportData.overview.activeUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.overview.departmentPerformance.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{dept.department}</span>
                        <span>{dept.resolved}/{dept.total}</span>
                      </div>
                      <Progress value={(dept.resolved / dept.total) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{((dept.resolved / dept.total) * 100).toFixed(1)}% resolved</span>
                        <span>Avg: {dept.avgTime}h</span>
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
                <CardTitle>Complaint Trends</CardTitle>
                <CardDescription>Daily complaint volume and resolution trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <p className="text-center text-muted-foreground mt-20">Chart visualization would be rendered here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Workload</CardTitle>
                <CardDescription>Current workload vs capacity by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.departmentWorkload.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{dept.department}</span>
                        <span>{dept.workload}/{dept.capacity}</span>
                      </div>
                      <Progress value={(dept.workload / dept.capacity) * 100} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {((dept.workload / dept.capacity) * 100).toFixed(1)}% capacity used
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Under 24 hours</span>
                      <Badge variant="default">45%</Badge>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">24-72 hours</span>
                      <Badge variant="secondary">30%</Badge>
                    </div>
                    <Progress value={30} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">3-7 days</span>
                      <Badge variant="outline">20%</Badge>
                    </div>
                    <Progress value={20} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Over 7 days</span>
                      <Badge variant="destructive">5%</Badge>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { issue: 'Login Problems', count: 45, trend: 'up' },
                      { issue: 'Payment Issues', count: 32, trend: 'down' },
                      { issue: 'System Errors', count: 28, trend: 'up' },
                      { issue: 'Feature Requests', count: 21, trend: 'stable' },
                      { issue: 'Performance Issues', count: 18, trend: 'down' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.issue}</p>
                          <p className="text-sm text-muted-foreground">{item.count} complaints</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                          {item.trend === 'stable' && <div className="w-4 h-4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
