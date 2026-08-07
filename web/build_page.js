const fs = require('fs');

let bodyHtml = fs.readFileSync('e:/SecurePush/web/app/page_body.jsx', 'utf8');

// Insert Pricing Preview before the CTA (cta section usually is the last section before footer)
// Let's find the last section (CTA)
const ctaMatch = bodyHtml.match(/<section[^>]*id=\"cta\"[^>]*>[\s\S]*?<\/section>/) 
                 || bodyHtml.match(/<section[^>]*class(?:Name)?=\"cta\"[^>]*>[\s\S]*?<\/section>/);

const pricingPreview = `
      <section id="pricing-preview" style={{ padding: '84px 0', borderTop: '1px solid rgba(242, 240, 234, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Pricing that makes sense</h2>
          <p className="lead" style={{ margin: '0 auto' }}>Choose how you want to run SecurePush.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', minWidth: '240px' }}>
            <h3 style={{ fontSize: '20px' }}>Free</h3>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>Up to 3 repos</p>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-mono)' }}>$0</div>
          </div>
          <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', minWidth: '240px', border: '1px solid var(--text-primary)' }}>
            <h3 style={{ fontSize: '20px' }}>Pro</h3>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>Unlimited repos</p>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-mono)' }}>$15<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/mo</span></div>
          </div>
          <div className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', minWidth: '240px' }}>
            <h3 style={{ fontSize: '20px' }}>BYO-key & Local</h3>
            <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>Run it yourself</p>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-mono)' }}>Free forever</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <a href="/pricing" className="button" style={{ background: 'transparent' }}>View full pricing →</a>
        </div>
      </section>
`;

if (ctaMatch) {
  bodyHtml = bodyHtml.replace(ctaMatch[0], pricingPreview + '\n' + ctaMatch[0]);
} else {
  // If no CTA section found, just append before footer or at the end
  const footerMatch = bodyHtml.match(/<footer[\s\S]*?<\/footer>/);
  if (footerMatch) {
    bodyHtml = bodyHtml.replace(footerMatch[0], pricingPreview + '\n' + footerMatch[0]);
  } else {
    bodyHtml += pricingPreview;
  }
}

const pageComponent = `
import GlobalNav from '@/components/GlobalNav';
import Hero from '@/components/Hero';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'SecurePush | Review AI code before it reaches GitHub',
};

export default function Home() {
  return (
    <>
      <div className="page" style={{ paddingTop: '0' }}>
        <GlobalNav />
        <nav aria-label="Section navigation" style={{
          display: 'flex', gap: '18px', padding: '16px 0', borderBottom: '1px solid rgba(242, 240, 234, 0.08)',
          position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 40, fontSize: '14px', color: 'var(--text-muted)'
        }}>
          <Link href="#flow" style={{ textDecoration: 'none' }}>Flow</Link>
          <Link href="#comparison" style={{ textDecoration: 'none' }}>Comparison</Link>
          <Link href="#memory" style={{ textDecoration: 'none' }}>Memory</Link>
        </nav>
        <div className={styles.landingContainer}>
          ${bodyHtml}
        </div>
      </div>
    </>
  );
}
`;

fs.writeFileSync('e:/SecurePush/web/app/page.tsx', pageComponent);
console.log('Page created');
