'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

export default function GlobalNavClient({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: user ? '/dashboard' : '/login?redirect=/dashboard' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
  ];

  const username = user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true"></span>
        <span>SecurePush</span>
      </Link>

      <nav aria-label="Primary navigation">
        <ul className="nav-list">
          {navLinks.map((link) => {
            // Precise active matching
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <li key={link.name}>
                <Link href={link.href} className={isActive ? 'active-link' : ''}>
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="auth-slot">
        {!user ? (
          <Link href="/login" className="button nav-cta">
            Sign in
          </Link>
        ) : (
          <div className="avatar-dropdown" ref={dropdownRef}>
            <button 
              className="avatar-button" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              <div className="avatar">{username.charAt(0).toUpperCase()}</div>
              <span>{username}</span>
              <span className="dropdown-caret">▾</span>
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link href="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                <form action="/auth/signout" method="POST">
                  <button type="submit" className="signout-button">Sign out</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .topbar {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding: 22px 0;
          border-bottom: 1px solid rgba(242, 240, 234, 0.08);
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font: 700 14px/1 var(--font-mono);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .brand-mark {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 1px solid rgba(242, 240, 234, 0.14);
          background:
            linear-gradient(
              135deg,
              transparent 0 44%,
              rgba(242, 240, 234, 0.92) 44% 56%,
              transparent 56%
            ),
            rgba(255, 255, 255, 0.04);
        }

        .nav-list {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          margin: 0;
          padding: 0;
          list-style: none;
          color: var(--text-muted);
          font-size: 14px;
        }

        .nav-list a {
          text-decoration: none;
          padding: 8px 0;
          transition:
            color 140ms ease,
            opacity 140ms ease;
        }

        .nav-list a:hover {
          color: var(--text-primary);
        }

        .nav-list a.active-link {
          color: var(--text-primary);
          font-weight: 600;
          box-shadow: 0 1px 0 0 var(--text-primary);
        }

        .auth-slot {
          display: flex;
          align-items: center;
        }

        .button.nav-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--bg);
          padding: 8px 16px;
          border-radius: 999px;
          background: var(--text-primary);
          font: 600 14px/1 var(--font-mono);
          text-decoration: none;
          border: 1px solid transparent;
          transition: background 140ms ease, transform 140ms ease;
        }

        .button.nav-cta:hover {
          background: white;
          transform: translateY(-1px);
        }

        .avatar-dropdown {
          position: relative;
        }

        .avatar-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 6px 12px;
          border-radius: 999px;
          color: var(--text-primary);
          font: 500 14px/1 var(--font-body);
          cursor: pointer;
          transition: background 140ms ease;
        }

        .avatar-button:hover,
        .avatar-button[aria-expanded="true"] {
          background: rgba(255, 255, 255, 0.08);
        }

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(242, 240, 234, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .dropdown-caret {
          font-size: 12px;
          color: var(--text-muted);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 160px;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 50;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .dropdown-menu a,
        .dropdown-menu .signout-button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border-radius: 8px;
          background: none;
          border: none;
          color: var(--text-primary);
          font: 500 14px/1 var(--font-body);
          text-decoration: none;
          cursor: pointer;
          transition: background 140ms ease;
        }

        .dropdown-menu a:hover,
        .dropdown-menu .signout-button:hover {
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </header>
  );
}
