import { useState, useEffect, useCallback } from 'react';
import { calculateSEOScore } from '@/lib/seo/seoUtils';

interface SEOHealthData {
  title: string;
  description: string;
  url: string;
  wordCount: number;
  hasImages: boolean;
  headings: string[];
  internalLinks: number;
  externalLinks: number;
}

interface SEOHealthResult {
  score: number;
  issues: string[];
  suggestions: string[];
  isHealthy: boolean;
}

export function useSEOHealth() {
  const [healthData, setHealthData] = useState<SEOHealthResult | null>(null);

  const analyzePage = useCallback(() => {
    // Get current page SEO data
    const title = document.title || '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const wordCount = document.body.innerText.split(/\s+/).filter(w => w.length > 0).length;
    const hasImages = document.querySelectorAll('img[alt]').length > 0;
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent || '');
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="https://bak55talent"]').length;
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="bak55talent"])').length;

    const result = calculateSEOScore({
      title,
      description,
      headings,
      wordCount,
      hasImages,
      internalLinks,
      externalLinks,
    });

    setHealthData({
      ...result,
      isHealthy: result.score >= 70,
    });
  }, []);

  useEffect(() => {
    // Run analysis after page renders
    const timeout = setTimeout(analyzePage, 1000);
    return () => clearTimeout(timeout);
  }, [analyzePage]);

  return { healthData, analyzePage };
}

/**
 * Hook to track Core Web Vitals
 */
export function useCoreWebVitals() {
  const [vitals, setVitals] = useState<{
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
  }>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  useEffect(() => {
    // Use Performance Observer API if available
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.debug('LCP not supported');
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          setVitals(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.debug('FCP not supported');
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setVitals(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.debug('CLS not supported');
    }

    // Time to First Byte
    try {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        setVitals(prev => ({ ...prev, ttfb: navEntry.responseStart - navEntry.requestStart }));
      }
    } catch (e) {
      console.debug('TTFB not supported');
    }
  }, []);

  const getVitalsGrade = useCallback(() => {
    const grades: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};
    
    // LCP: Good < 2.5s, Poor > 4s
    if (vitals.lcp !== null) {
      grades.lcp = vitals.lcp < 2500 ? 'good' : vitals.lcp < 4000 ? 'needs-improvement' : 'poor';
    }
    
    // FCP: Good < 1.8s, Poor > 3s
    if (vitals.fcp !== null) {
      grades.fcp = vitals.fcp < 1800 ? 'good' : vitals.fcp < 3000 ? 'needs-improvement' : 'poor';
    }
    
    // CLS: Good < 0.1, Poor > 0.25
    if (vitals.cls !== null) {
      grades.cls = vitals.cls < 0.1 ? 'good' : vitals.cls < 0.25 ? 'needs-improvement' : 'poor';
    }
    
    // TTFB: Good < 800ms, Poor > 1800ms
    if (vitals.ttfb !== null) {
      grades.ttfb = vitals.ttfb < 800 ? 'good' : vitals.ttfb < 1800 ? 'needs-improvement' : 'poor';
    }
    
    return grades;
  }, [vitals]);

  return { vitals, getVitalsGrade };
}
