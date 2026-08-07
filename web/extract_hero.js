const fs = require('fs');

let html = fs.readFileSync('e:/SecurePush/web/app/page_body.jsx', 'utf8');

// Find Hero section
const heroMatch = html.match(/<section className=\"hero[^>]*>([\s\S]*?)<\/section>/);
if (heroMatch) {
  let heroJsx = heroMatch[0];
  
  // Extract script
  const scriptCode = fs.readFileSync('e:/SecurePush/web/app/hero_script_1.js', 'utf8');
  
  const heroComponent = `
'use client';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Original script adapted for React ref scope
    // We wrap it in a self-executing function so we don't leak variables and match the original closure
    (function () {
      const hero = container.querySelector(".hero-anim");
      if (!hero) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      
      ${
        scriptCode
          .replace(/^\s*\(function \(\) \{/, '') // remove opening IIFE
          .replace(/\}\)\(\);\s*$/, '') // remove closing IIFE
          // Now we also need to change `document.querySelector(".hero-anim")` which was at the start
          .replace(/const hero = document\.querySelector\("\.hero-anim"\);/, '')
          .replace(/const reduceMotion = window\.matchMedia[^;]+;/, '')
      }
    })();
  }, []);

  return (
    <div ref={containerRef}>
      ${heroJsx}
    </div>
  );
}
`;
  fs.writeFileSync('e:/SecurePush/web/components/Hero.tsx', heroComponent);
  
  // Replace hero in page with <Hero />
  let newHtml = html.replace(heroMatch[0], '<Hero />');
  fs.writeFileSync('e:/SecurePush/web/app/page_body.jsx', newHtml);
  
  console.log('Hero component created');
} else {
  console.log('Hero section not found');
}
