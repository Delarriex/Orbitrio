import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = path.join(__dirname, 'src/components/HomeSections.tsx');
const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split('\n');

const components = [
  { name: 'InvestmentPlansSection', path: 'src/components/home/InvestmentPlansSection.tsx', start: 2614 },
  { name: 'WhyOrbitrio', path: 'src/components/home/WhyOrbitrio.tsx', start: 2779 },
  { name: 'Confidence', path: 'src/components/home/Confidence.tsx', start: 2922 },
  { name: 'AboutUs', path: 'src/components/home/AboutUs.tsx', start: 2958 },
  { name: 'GetStarted', path: 'src/components/home/GetStarted.tsx', start: 3013 },
  { name: 'ContactUs', path: 'src/components/home/ContactUs.tsx', start: 3044 },
  { name: 'Footer', path: 'src/components/Footer.tsx', start: 3066 }
];

components.forEach((comp, idx) => {
  const startIdx = comp.start;
  const endIdx = idx < components.length - 1 ? components[idx + 1].start : lines.length;
  
  let actStart = startIdx;
  if (lines[actStart - 1] && lines[actStart - 1].startsWith('//')) {
    actStart -= 1;
  }

  let compContent = lines.slice(actStart, endIdx).join('\n');
  
  const imports = [
    "import React from 'react';",
    "import { motion } from 'motion/react';",
    "import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';",
    "import { useOrbit } from '../../context/OrbitContext';"
  ].join('\n') + '\n\n';

  const finalContent = comp.name === 'Footer' ? 
    compContent.replace("import React from 'react';\n", "") :
    imports + compContent;

  const outPath = path.join(__dirname, comp.path);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalContent, 'utf8');
  console.log(`Extracted ${comp.name} to ${comp.path}`);
});

const newHomeSections = `export { TradeFeaturesChart as TradeFeatures } from './charts/TradeFeaturesChart';
export { ZeroPercentLoopCard } from './home/ZeroPercentLoopCard';
export { InvestmentPlansSection } from './home/InvestmentPlansSection';
export { WhyOrbitrio } from './home/WhyOrbitrio';
export { Confidence } from './home/Confidence';
export { AboutUs } from './home/AboutUs';
export { GetStarted } from './home/GetStarted';
export { ContactUs } from './home/ContactUs';
export { Footer } from './Footer';
`;
fs.writeFileSync(srcPath, newHomeSections, 'utf8');
console.log('Rewrote HomeSections.tsx');
