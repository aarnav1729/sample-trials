import React, { useState, useEffect } from 'react';
import { MaterialRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storageUtils } from '@/utils/storage';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle, Users, FileText, Calendar, Activity } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const allRequests = storageUtils.getRequests();
    setRequests(allRequests);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access analytics.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate analytics data
  const totalRequests = requests.length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const pendingRequests = totalRequests - completedRequests - rejectedRequests;
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

  // Status distribution
  const statusData = [
    { name: 'Pending CMK', value: requests.filter(r => r.status === 'pending_cmk').length, color: '#8884d8' },
    { name: 'Pending PPC', value: requests.filter(r => r.status === 'pending_ppc').length, color: '#82ca9d' },
    { name: 'Pending Procurement', value: requests.filter(r => r.status === 'pending_procurement').length, color: '#ffc658' },
    { name: 'Ordered', value: requests.filter(r => r.status === 'ordered').length, color: '#ff7c7c' },
    { name: 'Delivered', value: requests.filter(r => r.status === 'delivered').length, color: '#8dd1e1' },
    { name: 'Pending Evaluation', value: requests.filter(r => r.status === 'pending_evaluation').length, color: '#d084d0' },
    { name: 'Completed', value: completedRequests, color: '#87d068' },
    { name: 'Rejected', value: rejectedRequests, color: '#ff4d4f' }
  ].filter(item => item.value > 0);

  // Material category distribution
  const categoryData = requests.reduce((acc, request) => {
    const category = request.materialCategory;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value
  }));

  // Plant distribution
  const plantData = requests.reduce((acc, request) => {
    if (request.plant) {
      acc[request.plant] = (acc[request.plant] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const plantChartData = Object.entries(plantData).map(([name, value]) => ({
    name,
    value
  }));

  // TAT Analysis
  const calculateTAT = (request: MaterialRequest, fromStatus: string, toStatus: string): number => {
    const auditEntries = request.auditTrail || [];
    const fromEntry = auditEntries.find(entry => entry.details.toLowerCase().includes(fromStatus.toLowerCase()));
    const toEntry = auditEntries.find(entry => entry.details.toLowerCase().includes(toStatus.toLowerCase()));
    
    if (fromEntry && toEntry) {
      const fromDate = new Date(fromEntry.timestamp);
      const toDate = new Date(toEntry.timestamp);
      return Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  // Monthly trend
  const monthlyData = requests.reduce((acc, request) => {
    const month = new Date(request.dateReceived).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, count]) => ({
      month,
      requests: count
    }));

  // Recent activity
  const recentActivity = requests
    .flatMap(request => 
      (request.auditTrail || []).map(entry => ({
        ...entry,
        requestId: request.id,
        materialCategory: request.materialCategory,
        supplier: request.supplierName
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights and metrics for material trial management</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                All time submissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedRequests}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedRequests}</div>
              <p className="text-xs text-muted-foreground">
                {totalRequests > 0 ? ((rejectedRequests / totalRequests) * 100).toFixed(1) : 0}% rejection rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Material Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Material Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Plant Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Plant Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plantChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{activity.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.materialCategory}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.details}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supplier: {activity.supplier}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* TAT Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Turnaround Time Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.cmkDecision).length}
                </div>
                <div className="text-sm text-muted-foreground">CMK Reviewed</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.ppcData).length}
                </div>
                <div className="text-sm text-muted-foreground">PPC Processed</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.procurementData).length}
                </div>
                <div className="text-sm text-muted-foreground">Procurement Handled</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {requests.filter(r => r.evaluationData?.received).length}
                </div>
                <div className="text-sm text-muted-foreground">Evaluations Started</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};