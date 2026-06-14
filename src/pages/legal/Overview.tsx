import { Link } from 'react-router-dom';
import { Shield, FileText } from 'lucide-react';

const docs = [
  {
    path: '/legal/privacy',
    icon: Shield,
    title: 'Privacy Policy',
    description: 'How FashionUp collects, uses, and protects your personal information.',
    available: true,
  },
  {
    path: '/legal/terms',
    icon: FileText,
    title: 'Terms of Service',
    description: 'Rules and conditions for using the FashionUp platform.',
    available: false,
  },
];

const LegalOverview = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
    <h1 className="font-display text-3xl mb-2">Legal &amp; Privacy</h1>
    <p className="text-sm text-muted-foreground mb-10">
      Transparent, plain-language policies about how FashionUp operates and handles your data.
    </p>

    <div className="grid sm:grid-cols-2 gap-4">
      {docs.map(doc => (
        <div key={doc.path} className="relative">
          {doc.available ? (
            <Link
              to={doc.path}
              className="block border border-border rounded p-5 hover:border-foreground transition-colors group"
            >
              <doc.icon className="w-5 h-5 mb-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              <p className="font-medium text-sm mb-1">{doc.title}</p>
              <p className="text-xs text-muted-foreground">{doc.description}</p>
            </Link>
          ) : (
            <div className="border border-border rounded p-5 opacity-50 select-none cursor-not-allowed">
              <doc.icon className="w-5 h-5 mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">{doc.title}</p>
              <p className="text-xs text-muted-foreground">{doc.description}</p>
              <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                Coming soon
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default LegalOverview;
