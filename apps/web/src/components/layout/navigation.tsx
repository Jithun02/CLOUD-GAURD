'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full glass-effect border-b">
      <nav className="container-inner flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="w-6 h-6 text-primary" />
          <span>CloudGuard</span>
        </Link>

        <div className="flex items-center gap-6 ml-auto">
          <a href="#" className="text-sm hover:text-primary transition-colors">
            Features
          </a>
          <a href="#" className="text-sm hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#" className="text-sm hover:text-primary transition-colors">
            Docs
          </a>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
