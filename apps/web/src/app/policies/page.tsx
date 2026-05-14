'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Code, Eye, Trash2, Copy } from 'lucide-react';

interface Policy {
  id: number;
  name: string;
  description?: string;
  policy_type: string;
  is_enabled: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policy_type: 'rego',
    content: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchPolicies();
  }, [router]);

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Note: org_id would come from user context in real implementation
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/policies?org_id=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/policies?org_id=1`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setFormData({ name: '', description: '', policy_type: 'rego', content: '' });
        setShowCreateModal(false);
        fetchPolicies();
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Policy Studio</h1>
            <p className="text-muted-foreground">Create and manage security policies</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Policy
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{policies.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Custom Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{policies.filter(p => p.is_custom).length}</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{policies.filter(p => p.is_enabled).length}</p>
            </CardContent>
          </Card>
          <Card className="glass-effect">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Policy Types</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{new Set(policies.map(p => p.policy_type)).size}</p>
            </CardContent>
          </Card>
        </div>

        {policies.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Code className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-lg font-semibold">No policies yet</p>
                <p className="text-muted-foreground">Create your first policy to enforce security rules</p>
                <Button onClick={() => setShowCreateModal(true)}>Create Policy</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="glass-effect hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{policy.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          policy.is_enabled
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-gray-500/10 text-gray-700'
                        }`}>
                          {policy.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          policy.is_custom
                            ? 'bg-blue-500/10 text-blue-700'
                            : 'bg-purple-500/10 text-purple-700'
                        }`}>
                          {policy.is_custom ? 'Custom' : 'Built-in'}
                        </span>
                      </div>
                      {policy.description && (
                        <p className="text-sm text-muted-foreground mb-3">{policy.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Type: <strong>{policy.policy_type.toUpperCase()}</strong></span>
                        <span>Updated: {new Date(policy.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      {policy.is_custom && (
                        <Button size="sm" variant="outline" className="hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create New Policy</CardTitle>
                <CardDescription>Define a new security policy using Rego or custom rules</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePolicy} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Policy Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="S3 Bucket Encryption Policy"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enforce encryption on all S3 buckets"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Policy Type</label>
                    <select
                      value={formData.policy_type}
                      onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="rego">Rego (OPA)</option>
                      <option value="checkov">Checkov</option>
                      <option value="custom">Custom Rule</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Policy Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="package cloudguard.s3&#10;&#10;deny[msg] {&#10;  input.resource_type == 'aws_s3'&#10;  input.encrypted != true&#10;  msg := 'S3 bucket must be encrypted'&#10;}"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-sm"
                      rows={10}
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Create Policy
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
