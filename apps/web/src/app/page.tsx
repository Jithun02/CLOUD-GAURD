import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import {
  Shield,
  Cloud,
  Zap,
  Lock,
  CheckCircle,
  TrendingUp,
  Code,
  Server,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Multi-Cloud Security',
    description: 'Unified security posture across AWS, Azure, GCP, and Kubernetes',
  },
  {
    icon: Code,
    title: 'IaC Scanning',
    description: 'Scan Terraform, CloudFormation, and Kubernetes manifests',
  },
  {
    icon: Lock,
    title: 'Secrets Detection',
    description: 'Detect and prevent credential leaks in code and infrastructure',
  },
  {
    icon: TrendingUp,
    title: 'Compliance Automation',
    description: 'CIS, SOC2, ISO27001, PCI-DSS, HIPAA, GDPR compliance tracking',
  },
  {
    icon: Zap,
    title: 'Auto Remediation',
    description: 'One-click fixes for security misconfigurations',
  },
  {
    icon: Server,
    title: 'CI/CD Integration',
    description: 'Block unsafe deployments with security gates',
  },
];

const stats = [
  { value: '500+', label: 'Enterprise Customers' },
  { value: '2M+', label: 'Policies Enforced Daily' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '0ms', label: 'Avg Response Time' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="container-inner">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
              Enterprise Cloud{' '}
              <span className="gradient-text">Security Governance</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Enforce security policies across AWS, Azure, GCP, and Kubernetes. Automate
              compliance, detect misconfigurations, and remediate security issues in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="px-8">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="container-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container-inner">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Security Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to secure your cloud infrastructure at scale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="glass-effect p-6 hover:border-primary/50 transition-colors">
                  <Icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-card/50">
        <div className="container-inner">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Native Integrations</h2>
            <p className="text-muted-foreground text-lg">
              Connect with your favorite tools and platforms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {['AWS', 'Azure', 'GCP', 'GitHub', 'GitLab', 'Kubernetes', 'Terraform', 'Docker'].map(
              (integration) => (
                <div
                  key={integration}
                  className="flex items-center justify-center p-6 glass-effect rounded-lg"
                >
                  <span className="font-semibold">{integration}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container-inner">
          <div className="glass-effect rounded-2xl p-12 text-center space-y-8">
            <h2 className="text-4xl font-bold">Ready to Secure Your Cloud?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a free trial and see how CloudGuard can transform your security
              posture.
            </p>
            <Button size="lg" className="px-12">
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
