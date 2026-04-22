import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Roadmap', href: '#' },
    { label: 'Pricing', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Docs', href: '#' },
    { label: 'Support', href: '#' },
    { label: 'Community', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Compliance', href: '#' },
    { label: 'Security', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container-inner py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h3 className="font-bold mb-4">CloudGuard</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise cloud security governance platform
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 capitalize">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 CloudGuard. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
