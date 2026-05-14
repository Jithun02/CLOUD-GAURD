'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ComplianceReport {
  framework: string;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  compliance_score: number;
  control_details: Array<{
    control_id: string;
    title: string;
    status: 'passed' | 'failed';
    severity: string;
    findings: any[];
  }>;
}

const FRAMEWORKS = ['CIS AWS Foundations', 'SOC2', 'ISO27001', 'PCI-DSS', 'HIPAA', 'GDPR'];

export default function CompliancePage() {
  const router = useRouter();
  const [reports, setReports] = useState<Map<string, ComplianceReport>>(new Map());
  const [selectedFramework, setSelectedFramework] = useState('CIS AWS Foundations');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchComplianceReports();
  }, [router]);

  const fetchComplianceReports = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const newReports = new Map();

      for (const framework of FRAMEWORKS) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/compliance-summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // In real implementation, this would fetch per-framework reports
          newReports.set(framework, {
            framework,
            total_controls: 25,
            passed_controls: Math.floor(Math.random() * 20) + 5,
            failed_controls: Math.floor(Math.random() * 10),
            compliance_score: 0,
            control_details: [],
          });
        }
      }

      // Calculate scores
      newReports.forEach((report) => {
        report.compliance_score =
          (report.passed_controls / report.total_controls) * 100;
      });

      setReports(newReports);
    } catch (error) {
      console.error('Failed to fetch compliance reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentReport = reports.get(selectedFramework);

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const complianceData = Array.from(reports.values()).map((report) => ({
    name: report.framework.split(' ')[0],
    score: Math.round(report.compliance_score),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-inner py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Compliance Reports</h1>
            <p className="text-muted-foreground">
              Track compliance across multiple frameworks and regulations
            </p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Overview */}
        <Card className="glass-effect mb-8">
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
            <CardDescription>
              Compliance scores across all frameworks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Framework Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {FRAMEWORKS.map((framework) => {
            const report = reports.get(framework);
            const isSelected = selectedFramework === framework;

            return (
              <button
                key={framework}
                onClick={() => setSelectedFramework(framework)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-semibold text-sm mb-2">{framework.split(' ')[0]}</p>
                {report && (
                  <>
                    <p className={`text-2xl font-bold ${getStatusColor(report.compliance_score)}`}>
                      {Math.round(report.compliance_score)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.passed_controls}/{report.total_controls}
                    </p>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed Report */}
        {currentReport && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{currentReport.total_controls}</p>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Passed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">
                    {currentReport.passed_controls}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-500">
                    {currentReport.failed_controls}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Controls List */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>
                  Detailed status of each control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentReport.control_details.map((control) => (
                    <div
                      key={control.control_id}
                      className={`p-4 rounded-lg border ${
                        control.status === 'passed'
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">
                            {control.control_id} - {control.title}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Severity: <strong>{control.severity}</strong></span>
                            <span>Findings: <strong>{control.findings.length}</strong></span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          control.status === 'passed'
                            ? 'bg-green-500/20 text-green-700'
                            : 'bg-red-500/20 text-red-700'
                        }`}>
                          {control.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button>Export as PDF</Button>
              <Button variant="outline">Export as CSV</Button>
              <Button variant="outline">View Detailed Analysis</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
