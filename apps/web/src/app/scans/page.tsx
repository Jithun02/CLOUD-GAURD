'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw, Trash2, Eye } from 'lucide-react';

interface Scan {
  id: number;
  repository_id: number;
  scan_type: string;
  status: string;
  findings_count: number;
  risk_score: number;
  created_at: string;
  completed_at?: string;
}

export default function ScansPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchScans = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/scans`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setScans(data);
        }
      } catch (error) {
        console.error('Failed to fetch scans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScans();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-inner py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Security Scans</h1>
            <p className="text-muted-foreground">
              Manage and review all security scans
            </p>
          </div>
          <Button size="lg">
            <Play className="w-4 h-4 mr-2" />
            New Scan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading scans...</p>
            </div>
          </div>
        ) : scans.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-xl font-semibold">No scans yet</p>
                <p className="text-muted-foreground">
                  Start your first security scan to analyze your infrastructure
                </p>
                <Button>Create First Scan</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <Card key={scan.id} className="glass-effect hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="font-semibold">
                          Repository #{scan.repository_id} - {scan.scan_type}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(scan.status)}`}>
                          {scan.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Findings: <strong className="text-foreground">{scan.findings_count}</strong></span>
                        <span>Risk Score: <strong className={`${getRiskColor(scan.risk_score)} text-foreground`}>{scan.risk_score.toFixed(1)}</strong></span>
                        <span>Created: <strong className="text-foreground">{new Date(scan.created_at).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
