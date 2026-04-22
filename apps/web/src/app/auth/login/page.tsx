'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Github, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Shield className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold">CloudGuard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Sign in</h1>
          <p className="text-muted-foreground text-center">
            Enter your credentials to access your security dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your CloudGuard account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="w-full">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Google
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
