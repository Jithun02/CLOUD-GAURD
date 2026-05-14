'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, Filter, Download, Eye, Check, X, AlertCircle, 
  ChevronRight, Code, Zap 
} from 'lucide-react';

interface Finding {
  id: number;
  scan_id: number;
  rule_id: string;
  rule_name: string;
  severity: string;
  description: string;
  resource_id: string;
  is_resolved: boolean;
  false_positive: boolean;
  created_at: string;
  remediation?: string;
  remediation_code?: string;
}

export default function FindingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<Finding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(
    searchParams.get('severity')
  );
  const [statusFilter, setStatusFilter] = useState<string>('open');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchFindings();
  }, [router]);

  useEffect(() => {
    filterFindings();
  }, [findings, searchTerm, severityFilter, statusFilter]);

  const fetchFindings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFindings(data);
      }
    } catch (error) {
      console.error('Failed to fetch findings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFindings = () => {
    let filtered = [...findings];

    // Status filter
    if (statusFilter === 'open') {
      filtered = filtered.filter((f) => !f.is_resolved && !f.false_positive);
    } else if (statusFilter === 'resolved') {
      filtered = filtered.filter((f) => f.is_resolved);
    } else if (statusFilter === 'false-positive') {
      filtered = filtered.filter((f) => f.false_positive);
    }

    // Severity filter
    if (severityFilter) {
      filtered = filtered.filter((f) => f.severity === severityFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.resource_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFindings(filtered);
  };

  const handleResolve = async (findingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/${findingId}/resolve`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFindings();
    } catch (error) {
      console.error('Failed to resolve finding:', error);
    }
  };

  const handleFalsePositive = async (findingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/findings/${findingId}/false-positive`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFindings();
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'LOW':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

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
            <h1 className="text-4xl font-bold mb-2">Security Findings</h1>
            <p className="text-muted-foreground">
              Explore and manage detected security issues
            </p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-red-500">
                {findings.filter((f) => f.severity === 'CRITICAL' && !f.is_resolved).length}
              </p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-orange-500">
                {findings.filter((f) => f.severity === 'HIGH' && !f.is_resolved).length}
              </p>
              <p className="text-sm text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-yellow-500">
                {findings.filter((f) => f.severity === 'MEDIUM' && !f.is_resolved).length}
              </p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-green-500">
                {findings.filter((f) => f.is_resolved).length}
              </p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Findings List */}
          <div className="lg:col-span-2">
            <Card className="glass-effect mb-6">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by rule, resource, or description"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {['open', 'resolved', 'false-positive'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          statusFilter === status
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {status.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity Filter */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Severity</p>
                  <div className="flex gap-2 flex-wrap">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(severityFilter === sev ? null : sev)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          severityFilter === sev
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Findings List */}
            <div className="space-y-4">
              {filteredFindings.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <Check className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-lg font-semibold">No findings match your filters</p>
                      <p className="text-muted-foreground">Great job! Keep monitoring for security issues.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredFindings.map((finding) => (
                  <Card
                    key={finding.id}
                    className="glass-effect cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedFinding(finding)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {getSeverityIcon(finding.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{finding.rule_name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Resource: <code className="text-foreground">{finding.resource_id}</code></span>
                            <span>{new Date(finding.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedFinding ? (
              <Card className="glass-effect sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Finding Details</CardTitle>
                  <CardDescription className="text-xs">{selectedFinding.rule_id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Severity */}
                  <div>
                    <p className="text-sm font-medium mb-2">Severity</p>
                    <span className={`px-3 py-1 rounded text-sm font-medium border ${getSeverityColor(selectedFinding.severity)}`}>
                      {selectedFinding.severity}
                    </span>
                  </div>

                  {/* Resource */}
                  <div>
                    <p className="text-sm font-medium mb-2">Resource</p>
                    <code className="block bg-secondary p-2 rounded text-xs break-all">
                      {selectedFinding.resource_id}
                    </code>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedFinding.description}</p>
                  </div>

                  {/* Remediation */}
                  {selectedFinding.remediation && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Remediation
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedFinding.remediation}</p>
                    </div>
                  )}

                  {/* Code */}
                  {selectedFinding.remediation_code && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Fix Code
                      </p>
                      <pre className="bg-secondary p-2 rounded text-xs overflow-x-auto">
                        {selectedFinding.remediation_code}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    {!selectedFinding.is_resolved && (
                      <Button
                        onClick={() => handleResolve(selectedFinding.id)}
                        className="w-full"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                    {!selectedFinding.false_positive && (
                      <Button
                        onClick={() => handleFalsePositive(selectedFinding.id)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        False Positive
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-effect">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Eye className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Select a finding to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
