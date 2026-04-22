'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Github, Mail, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          full_name: fullName,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Account Created!</h2>
              <p className="text-muted-foreground">
                Your account has been created successfully. Redirecting to login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Shield className="w-10 h-10 text-primary" />
            <span className="text-2xl font-bold">CloudGuard</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground text-center">
            Get started with enterprise cloud security
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Create your CloudGuard account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

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
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or sign up with</span>
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
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
