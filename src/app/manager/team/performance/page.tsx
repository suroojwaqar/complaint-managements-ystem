'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Star,
  Award
} from 'lucide-react';

export default function TeamPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [sortBy, setSortBy] = useState('efficiency');

  // Mock data
  const performanceData = {
    members: [
      {
        _id: '1',
        name: 'John Smith',
        email: 'john@company.com',
        performance: {
          assignedComplaints: 45,
          resolvedComplaints: 42,
          avgResolutionTime: 16,
          customerRating: 4.8,
          efficiency: 93,
          qualityScore: 95
        },
        achievements: ['Top Performer', 'Customer Favorite', 'Speed Demon'],
        workload: {
          current: 8,
          capacity: 10,
          status: 'optimal' as const
        }
      },
      {
        _id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        performance: {
          assignedComplaints: 38,
          resolvedComplaints: 35,
          avgResolutionTime: 20,
          customerRating: 4.6,
          efficiency: 92,
          qualityScore: 91
        },
        achievements: ['Quality Champion', 'Team Player'],
        workload: {
          current: 6,
          capacity: 8,
          status: 'underloaded' as const
        }
      },
      {
        _id: '3',
        name: 'Mike Wilson',
        email: 'mike@company.com',
        performance: {
          assignedComplaints: 32,
          resolvedComplaints: 28,
          avgResolutionTime: 24,
          customerRating: 4.3,
          efficiency: 87,
          qualityScore: 88
        },
        achievements: ['Steady Performer'],
        workload: {
          current: 12,
          capacity: 10,
          status: 'overloaded' as const
        }
      }
    ],
    teamStats: {
      totalMembers: 3,
      avgResolutionTime: 20,
      avgCustomerRating: 4.6,
      teamEfficiency: 91,
      totalResolved: 105,
      totalAssigned: 115
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const getSortedMembers = () => {
    return [...performanceData.members].sort((a, b) => {
      switch (sortBy) {
        case 'efficiency':
          return b.performance.efficiency - a.performance.efficiency;
        case 'resolved':
          return b.performance.resolvedComplaints - a.performance.resolvedComplaints;
        case 'rating':
          return b.performance.customerRating - a.performance.customerRating;
        case 'speed':
          return a.performance.avgResolutionTime - b.performance.avgResolutionTime;
        default:
          return 0;
      }
    });
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case 'underloaded':
        return 'text-blue-600 bg-blue-100';
      case 'optimal':
        return 'text-green-600 bg-green-100';
      case 'overloaded':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const topPerformers = {
    fastest: performanceData.members.reduce((prev, current) => 
      prev.performance.avgResolutionTime < current.performance.avgResolutionTime ? prev : current
    ),
    mostResolved: performanceData.members.reduce((prev, current) => 
      prev.performance.resolvedComplaints > current.performance.resolvedComplaints ? prev : current
    ),
    bestRated: performanceData.members.reduce((prev, current) => 
      prev.performance.customerRating > current.performance.customerRating ? prev : current
    )
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
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Team Performance</h1>
            <p className="text-muted-foreground">Monitor and analyze individual team member performance</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="workload">Workload Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                    <p className="text-3xl font-bold">{performanceData.teamStats.totalMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                    <p className="text-3xl font-bold">{performanceData.teamStats.avgResolutionTime}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Rating</p>
                    <p className="text-3xl font-bold">{performanceData.teamStats.avgCustomerRating.toFixed(1)}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Efficiency</p>
                    <p className="text-3xl font-bold">{performanceData.teamStats.teamEfficiency}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Fastest Resolver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {topPerformers.fastest.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{topPerformers.fastest.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Avg: {topPerformers.fastest.performance.avgResolutionTime}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Most Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {topPerformers.mostResolved.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{topPerformers.mostResolved.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {topPerformers.mostResolved.performance.resolvedComplaints} resolved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  Best Rated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {topPerformers.bestRated.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{topPerformers.bestRated.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {topPerformers.bestRated.performance.customerRating.toFixed(1)} rating
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Individual Performance Metrics</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efficiency">Sort by Efficiency</SelectItem>
                <SelectItem value="resolved">Sort by Resolved</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
                <SelectItem value="speed">Sort by Speed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {getSortedMembers().map((member, index) => (
              <Card key={member._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {member.achievements.map((achievement, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {achievement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-2xl font-bold">{member.performance.efficiency}%</span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">Efficiency Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{member.performance.resolvedComplaints}</p>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{member.performance.avgResolutionTime}h</p>
                      <p className="text-xs text-muted-foreground">Avg Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{member.performance.customerRating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{member.performance.qualityScore}%</p>
                      <p className="text-xs text-muted-foreground">Quality</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Performance Score</span>
                      <span>{member.performance.efficiency}%</span>
                    </div>
                    <Progress value={member.performance.efficiency} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Workload Distribution</CardTitle>
              <CardDescription>Monitor team member capacity and current assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {performanceData.members.map((member) => (
                  <div key={member._id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.workload.current}/{member.workload.capacity} assignments
                          </p>
                        </div>
                      </div>
                      <Badge className={getWorkloadColor(member.workload.status)}>
                        {member.workload.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Workload</span>
                        <span>{((member.workload.current / member.workload.capacity) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={(member.workload.current / member.workload.capacity) * 100} 
                        className="h-3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
