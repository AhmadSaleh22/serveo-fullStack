import { useState, useCallback } from 'react';
import pptxgen from 'pptxgenjs';
import type { SlideData } from '../types/financial';

// Colors matching the website theme
const colors = {
  primary: '1F2937',      // Gray-900
  secondary: '6B7280',    // Gray-500
  muted: '9CA3AF',        // Gray-400
  border: 'E5E7EB',       // Gray-200
  cardBg: 'F9FAFB',       // Gray-50
  blue: '3B82F6',
  blueLight: 'DBEAFE',    // Blue-100 for backgrounds
  emerald: '10B981',
  emeraldLight: 'D1FAE5', // Emerald-100 for backgrounds
  purple: '8B5CF6',
  purpleLight: 'EDE9FE',  // Purple-100 for backgrounds
  amber: 'F59E0B',
  amberLight: 'FEF3C7',   // Amber-100 for backgrounds
  white: 'FFFFFF',
};

export function usePPTXExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToPPTX = useCallback(async (slides: SlideData[], filename: string = 'Financial_Presentation') => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const pptx = new pptxgen();

      // Set presentation properties
      pptx.author = 'Financial AI Co-pilot';
      pptx.title = 'Investor Presentation';
      pptx.subject = 'Financial Analysis';
      pptx.company = 'Financial AI';
      pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

      // Generate each slide based on type
      for (let i = 0; i < slides.length; i++) {
        const slideData = slides[i];
        const slide = pptx.addSlide();

        // Background gradient simulation
        slide.addShape('rect', {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: colors.white },
        });

        // Add subtle gradient overlay using gradient fill
        const gradientColor = slideData.type === 'executive' ? 'EFF6FF' :
                              slideData.type === 'revenue' ? 'ECFDF5' :
                              slideData.type === 'segment' ? 'EFF6FF' :
                              slideData.type === 'margins' ? 'FAF5FF' : 'ECFDF5';
        slide.addShape('rect', {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: {
            type: 'solid',
            color: gradientColor,
          },
        });

        // Logo (top-right corner) - matching website
        slide.addShape('rect', {
          x: 12.2, y: 0.3, w: 0.6, h: 0.6,
          fill: { type: 'solid', color: colors.blue },
          shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.2 },
        });
        slide.addText('FA', {
          x: 12.2, y: 0.35, w: 0.6, h: 0.5,
          fontSize: 10, bold: true, color: colors.white,
          align: 'center', valign: 'middle',
        });

        // Slide number (bottom-right)
        slide.addText(`${i + 1} / ${slides.length}`, {
          x: 11.8, y: 6.9, w: 1, h: 0.3,
          fontSize: 9, color: colors.muted, fontFace: 'Courier New',
          align: 'right',
        });

        // Generate slide-specific content
        switch (slideData.type) {
          case 'executive':
            generateExecutiveSlide(slide);
            break;
          case 'revenue':
            generateRevenueSlide(slide);
            break;
          case 'segment':
            generateSegmentSlide(slide);
            break;
          case 'margins':
            generateMarginsSlide(slide);
            break;
          case 'guidance':
            generateGuidanceSlide(slide);
            break;
          default:
            generateExecutiveSlide(slide);
        }

        setExportProgress(((i + 1) / slides.length) * 100);
      }

      await pptx.writeFile({ fileName: `${filename}.pptx` });
      setIsExporting(false);
      setExportProgress(100);
      return true;
    } catch (error) {
      console.error('PPTX export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      return false;
    }
  }, []);

  return { exportToPPTX, isExporting, exportProgress };
}

// Executive Summary Slide - matches website exactly
function generateExecutiveSlide(slide: pptxgen.Slide) {
  // Title
  slide.addText('Executive Summary', {
    x: 0.6, y: 0.5, w: 10, h: 0.5,
    fontSize: 26, bold: true, color: colors.primary,
  });
  slide.addText('FY 2024 Financial Performance Review', {
    x: 0.6, y: 0.95, w: 10, h: 0.3,
    fontSize: 12, color: colors.secondary,
  });

  // KPI Cards - 2x2 grid matching website layout
  const kpis = [
    { label: 'Revenue', value: '$1.44B', change: '+20%', icon: '$', color: colors.blue, bgColor: colors.blueLight },
    { label: 'EBITDA', value: '$432M', change: '+20%', icon: '↗', color: colors.emerald, bgColor: colors.emeraldLight },
    { label: 'Net Income', value: '$259M', change: '+20%', icon: '◎', color: colors.purple, bgColor: colors.purpleLight },
    { label: 'EPS', value: '$2.59', change: '+20%', icon: '▤', color: colors.amber, bgColor: colors.amberLight },
  ];

  const cardWidth = 5.5;
  const cardHeight = 1.6;
  const startX = 0.6;
  const startY = 1.5;
  const gap = 0.4;

  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = startX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);

    // Card background
    slide.addShape('roundRect', {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: colors.cardBg },
      line: { color: colors.border, width: 1 },
      rectRadius: 0.1,
    });

    // Icon circle (light background)
    slide.addShape('ellipse', {
      x: x + 0.2, y: y + 0.25, w: 0.5, h: 0.5,
      fill: { color: kpi.bgColor },
    });
    slide.addText(kpi.icon, {
      x: x + 0.2, y: y + 0.25, w: 0.5, h: 0.5,
      fontSize: 12, color: kpi.color, align: 'center', valign: 'middle',
    });

    // Label
    slide.addText(kpi.label, {
      x: x + 0.8, y: y + 0.3, w: 2, h: 0.3,
      fontSize: 10, color: colors.secondary,
    });

    // Value and change
    slide.addText(kpi.value, {
      x: x + 0.2, y: y + 0.9, w: 2.5, h: 0.5,
      fontSize: 22, bold: true, color: colors.primary, fontFace: 'Courier New',
    });
    slide.addText(kpi.change, {
      x: x + 2.8, y: y + 1.0, w: 1, h: 0.4,
      fontSize: 11, color: colors.emerald,
    });
  });

  // Key Highlight box
  slide.addShape('roundRect', {
    x: 0.6, y: 5.3, w: 11.3, h: 0.8,
    fill: { color: colors.cardBg },
    line: { color: colors.border, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText([
    { text: 'Key Highlight: ', options: { bold: true, color: colors.emerald } },
    { text: 'Strong revenue growth of 20% YoY driven by product expansion and improved operating leverage.', options: { color: colors.secondary } },
  ], {
    x: 0.8, y: 5.45, w: 11, h: 0.5,
    fontSize: 11,
  });
}

// Revenue Analysis Slide
function generateRevenueSlide(slide: pptxgen.Slide) {
  // Title
  slide.addText('Revenue Analysis', {
    x: 0.6, y: 0.5, w: 10, h: 0.5,
    fontSize: 26, bold: true, color: colors.primary,
  });
  slide.addText('4-Year Revenue Trajectory', {
    x: 0.6, y: 0.95, w: 10, h: 0.3,
    fontSize: 12, color: colors.secondary,
  });

  // Area chart
  slide.addChart('area', [
    {
      name: 'Revenue',
      labels: ['2023A', '2024E', '2025E', '2026E'],
      values: [1200, 1440, 1728, 2074],
    },
  ], {
    x: 0.6, y: 1.4, w: 7.5, h: 4.2,
    chartColors: [colors.emerald],
    lineDataSymbol: 'circle',
    lineDataSymbolSize: 8,
    catAxisLabelColor: colors.secondary,
    catAxisLabelFontSize: 10,
    valAxisLabelColor: colors.secondary,
    valAxisLabelFontSize: 10,
    valAxisDisplayUnit: 'billions',
    showLegend: false,
    fill: colors.emerald,
  });

  // Stats cards on right side
  const stats = [
    { label: '2024E Revenue', value: '$1.44B', color: colors.emerald },
    { label: 'YoY Growth', value: '+20%', color: colors.emerald },
    { label: 'CAGR (3Y)', value: '20.0%', color: colors.blue },
  ];

  stats.forEach((stat, idx) => {
    const y = 1.5 + idx * 1.4;

    slide.addShape('roundRect', {
      x: 8.5, y, w: 3.8, h: 1.1,
      fill: { color: colors.cardBg },
      line: { color: colors.border, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(stat.label, {
      x: 8.7, y: y + 0.15, w: 3.4, h: 0.3,
      fontSize: 10, color: colors.secondary,
    });
    slide.addText(stat.value, {
      x: 8.7, y: y + 0.5, w: 3.4, h: 0.5,
      fontSize: 20, bold: true, color: stat.color, fontFace: 'Courier New',
    });
  });
}

// Revenue by Segment Slide
function generateSegmentSlide(slide: pptxgen.Slide) {
  // Title
  slide.addText('Revenue by Segment', {
    x: 0.6, y: 0.5, w: 10, h: 0.5,
    fontSize: 26, bold: true, color: colors.primary,
  });
  slide.addText('Product vs Service Mix', {
    x: 0.6, y: 0.95, w: 10, h: 0.3,
    fontSize: 12, color: colors.secondary,
  });

  // Donut chart
  slide.addChart('doughnut', [
    {
      name: 'Revenue Mix',
      labels: ['Product', 'Service'],
      values: [70, 30],
    },
  ], {
    x: 0.6, y: 1.5, w: 5.5, h: 4.5,
    chartColors: [colors.blue, colors.emerald],
    showLegend: false,
    holeSize: 60,
  });

  // Center text for donut
  slide.addText('$1.44B', {
    x: 2.1, y: 3.4, w: 2, h: 0.5,
    fontSize: 22, bold: true, color: colors.primary, fontFace: 'Courier New',
    align: 'center',
  });
  slide.addText('Total Revenue', {
    x: 2.1, y: 3.85, w: 2, h: 0.3,
    fontSize: 9, color: colors.secondary, align: 'center',
  });

  // Segment detail cards
  const segments = [
    { name: 'Product Revenue', value: '$1,008M', pct: '70%', color: colors.blue },
    { name: 'Service Revenue', value: '$432M', pct: '30%', color: colors.emerald },
  ];

  segments.forEach((seg, idx) => {
    const y = 2.0 + idx * 1.8;

    slide.addShape('roundRect', {
      x: 7, y, w: 5.3, h: 1.5,
      fill: { color: colors.cardBg },
      line: { color: colors.border, width: 1 },
      rectRadius: 0.1,
    });

    // Color indicator
    slide.addShape('ellipse', {
      x: 7.2, y: y + 0.25, w: 0.25, h: 0.25,
      fill: { color: seg.color },
    });

    slide.addText(seg.name, {
      x: 7.55, y: y + 0.2, w: 3, h: 0.3,
      fontSize: 12, color: colors.primary,
    });
    slide.addText(seg.value, {
      x: 7.2, y: y + 0.7, w: 2.5, h: 0.5,
      fontSize: 18, bold: true, color: colors.primary, fontFace: 'Courier New',
    });
    slide.addText(seg.pct, {
      x: 10.5, y: y + 0.8, w: 1.5, h: 0.4,
      fontSize: 12, color: colors.secondary, fontFace: 'Courier New', align: 'right',
    });
  });
}

// Profitability Analysis Slide
function generateMarginsSlide(slide: pptxgen.Slide) {
  // Title
  slide.addText('Profitability Analysis', {
    x: 0.6, y: 0.5, w: 10, h: 0.5,
    fontSize: 26, bold: true, color: colors.primary,
  });
  slide.addText('Margin Performance FY 2024E', {
    x: 0.6, y: 0.95, w: 10, h: 0.3,
    fontSize: 12, color: colors.secondary,
  });

  // Horizontal bar chart
  slide.addChart('bar', [
    {
      name: 'Margins',
      labels: ['Gross', 'EBITDA', 'Net'],
      values: [65, 30, 18],
    },
  ], {
    x: 0.6, y: 1.4, w: 11.3, h: 3.2,
    barDir: 'bar',
    chartColors: [colors.emerald, colors.blue, colors.purple],
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelColor: colors.primary,
    dataLabelFontSize: 11,
    dataLabelFontBold: true,
    catAxisLabelColor: colors.primary,
    catAxisLabelFontSize: 12,
    valAxisMaxVal: 100,
    valAxisLabelColor: colors.secondary,
    showLegend: false,
    barGapWidthPct: 50,
  });

  // Margin summary cards at bottom
  const margins = [
    { label: 'Gross Margin', value: '65.0%', color: colors.emerald },
    { label: 'EBITDA Margin', value: '30.0%', color: colors.blue },
    { label: 'Net Margin', value: '18.0%', color: colors.purple },
  ];

  const cardWidth = 3.5;
  margins.forEach((m, idx) => {
    const x = 0.6 + idx * (cardWidth + 0.4);

    slide.addShape('roundRect', {
      x, y: 5.0, w: cardWidth, h: 1.0,
      fill: { color: colors.cardBg },
      line: { color: colors.border, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(m.label, {
      x, y: 5.1, w: cardWidth, h: 0.3,
      fontSize: 10, color: colors.secondary, align: 'center',
    });
    slide.addText(m.value, {
      x, y: 5.45, w: cardWidth, h: 0.45,
      fontSize: 18, bold: true, color: m.color, fontFace: 'Courier New', align: 'center',
    });
  });
}

// Forward Guidance Slide
function generateGuidanceSlide(slide: pptxgen.Slide) {
  // Title
  slide.addText('Forward Guidance', {
    x: 0.6, y: 0.5, w: 10, h: 0.5,
    fontSize: 26, bold: true, color: colors.primary,
  });
  slide.addText('FY 2025-2026 Outlook', {
    x: 0.6, y: 0.95, w: 10, h: 0.3,
    fontSize: 12, color: colors.secondary,
  });

  // Year forecast cards - 2 columns
  const forecasts = [
    { year: '2025E', revenue: '$1.73B', growth: '+20% YoY' },
    { year: '2026E', revenue: '$2.07B', growth: '+20% YoY' },
  ];

  forecasts.forEach((fc, idx) => {
    const x = 0.6 + idx * 6;

    slide.addShape('roundRect', {
      x, y: 1.4, w: 5.5, h: 1.6,
      fill: { color: colors.cardBg },
      line: { color: colors.border, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(fc.year, {
      x: x + 0.2, y: 1.55, w: 2, h: 0.35,
      fontSize: 13, bold: true, color: colors.blue,
    });
    slide.addText(fc.revenue, {
      x: x + 0.2, y: 2.0, w: 4, h: 0.6,
      fontSize: 26, bold: true, color: colors.primary, fontFace: 'Courier New',
    });
    slide.addText(fc.growth, {
      x: x + 0.2, y: 2.6, w: 2, h: 0.3,
      fontSize: 12, color: colors.emerald, fontFace: 'Courier New',
    });
  });

  // Strategic Priorities section
  slide.addShape('roundRect', {
    x: 0.6, y: 3.3, w: 11.3, h: 2.7,
    fill: { color: colors.cardBg },
    line: { color: colors.border, width: 1 },
    rectRadius: 0.1,
  });

  slide.addText('Strategic Priorities', {
    x: 0.8, y: 3.5, w: 10, h: 0.4,
    fontSize: 13, bold: true, color: colors.primary,
  });

  const priorities = [
    { text: 'Expand product portfolio with AI-native features', color: colors.emerald },
    { text: 'Increase enterprise market penetration', color: colors.blue },
    { text: 'Optimize operating costs through automation', color: colors.purple },
  ];

  priorities.forEach((p, idx) => {
    const y = 4.0 + idx * 0.6;

    // Bullet point
    slide.addShape('ellipse', {
      x: 0.9, y: y + 0.08, w: 0.12, h: 0.12,
      fill: { color: p.color },
    });

    slide.addText(p.text, {
      x: 1.15, y, w: 10, h: 0.4,
      fontSize: 12, color: colors.secondary,
    });
  });
}
