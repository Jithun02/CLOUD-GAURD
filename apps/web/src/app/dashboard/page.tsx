'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, TrendingUp, CheckCircle, Clock, Shield, 
  BarChart3, PieChart, Activity 
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  total_organizations: number;
  total_projects: number;
  active_scans: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  compliance_score: number;
  mttr_hours: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold text-center">Error</h2>
              <p className="text-muted-foreground text-center">
                Failed to load dashboard. Please try again.
              </p>
              <Button onClick={() => router.refresh()} className="w-full">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const findingsSeverity = [
    { name: 'Critical', value: stats.critical_findings, color: '#ef4444' },
    { name: 'High', value: stats.high_findings, color: '#f97316' },
    { name: 'Medium', value: stats.medium_findings, color: '#eab308' },
    { name: 'Low', value: stats.low_findings, color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container-inner py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time visibility into your cloud security posture
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_organizations}</p>
              <p className="text-xs text-muted-foreground mt-1">Total organizations</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_projects}</p>
              <p className="text-xs text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Active Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.active_scans}</p>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.compliance_score.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall score</p>
            </CardContent>
          </Card>
        </div>

        {/* Findings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="glass-effect lg:col-span-2">
            <CardHeader>
              <CardTitle>Findings Overview</CardTitle>
              <CardDescription>Distribution by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-2xl font-bold text-destructive">{stats.critical_findings}</p>
                  <p className="text-xs text-muted-foreground mt-1">Critical</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-2xl font-bold text-orange-500">{stats.high_findings}</p>
                  <p className="text-xs text-muted-foreground mt-1">High</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-2xl font-bold text-yellow-500">{stats.medium_findings}</p>
                  <p className="text-xs text-muted-foreground mt-1">Medium</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-500">{stats.low_findings}</p>
                  <p className="text-xs text-muted-foreground mt-1">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Resolution Time</span>
                  <span className="text-sm font-bold">
                    {stats.mttr_hours ? `${stats.mttr_hours.toFixed(1)}h` : 'N/A'}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min((stats.mttr_hours || 0) / 48 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className="text-sm font-bold">
                    {stats.compliance_score.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${stats.compliance_score}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="flex-1">
            Start New Scan
          </Button>
          <Button size="lg" variant="outline" className="flex-1">
            View All Findings
          </Button>
          <Button size="lg" variant="outline" className="flex-1">
            Manage Policies
          </Button>
        </div>
      </div>
    </div>
  );
}
