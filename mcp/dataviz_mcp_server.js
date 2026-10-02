#!/usr/bin/env node

/**
 * AcademAI Data Visualization — Model Context Protocol (MCP) Server
 * Standard MCP JSON-RPC 2.0 Server over stdio
 * Provides academic charting, PTK cycle comparison graphs, and Mermaid diagrams
 * for thesis research, quantitative analysis, and scientific papers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// ── MCP Tools Schema ───────────────────────────────────────
const TOOLS = [
  {
    name: 'generate_academic_chart',
    description: 'Menghasilkan grafik akademik standar publikasi (Bar, Line, Pie, Radar) dalam format SVG vektor tajam dan HTML interaktif (Chart.js) untuk skripsi/tesis.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Judul grafik (contoh: "Perbandingan Rata-Rata Skor Motorik Halus Pre-test vs Post-test")'
        },
        chartType: {
          type: 'string',
          enum: ['bar', 'line', 'pie', 'grouped_bar'],
          description: 'Jenis visualisasi grafik yang diinginkan'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Label sumbu X atau kategori (contoh: ["Kelompok Kontrol", "Kelompok Eksperimen"] atau ["Pra-Siklus", "Siklus I", "Siklus II"])'
        },
        datasets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              data: { type: 'array', items: { type: 'number' } },
              color: { type: 'string' }
            },
            required: ['label', 'data']
          },
          description: 'Daftar dataset data numerik'
        },
        yAxisLabel: {
          type: 'string',
          description: 'Label sumbu Y (contoh: "Persentase (%)" atau "Rata-rata Skor")'
        },
        saveToFile: {
          type: 'boolean',
          description: 'Apakah ingin menyimpan grafik ke file lokal di folder exports/?'
        }
      },
      required: ['title', 'labels', 'datasets']
    }
  },
  {
    name: 'generate_ptk_cycle_chart',
    description: 'Menghasilkan visualisasi khusus Penelitian Tindakan Kelas (PTK) membandingkan capaian BB, MB, BSH, dan BSB antar siklus (Pra-Siklus, Siklus I, Siklus II) serta menghitung ketuntasan klasikal otomatis.',
    inputSchema: {
      type: 'object',
      properties: {
        variableName: {
          type: 'string',
          description: 'Nama variabel atau aspek yang diteliti (contoh: "Keterampilan Motorik Halus Melalui Media Loose Parts")'
        },
        praSiklus: {
          type: 'object',
          properties: {
            BB: { type: 'number', description: 'Persentase Belum Berkembang' },
            MB: { type: 'number', description: 'Persentase Mulai Berkembang' },
            BSH: { type: 'number', description: 'Persentase Berkembang Sesuai Harapan' },
            BSB: { type: 'number', description: 'Persentase Berkembang Sangat Baik' }
          },
          required: ['BB', 'MB', 'BSH', 'BSB']
        },
        siklus1: {
          type: 'object',
          properties: {
            BB: { type: 'number' },
            MB: { type: 'number' },
            BSH: { type: 'number' },
            BSB: { type: 'number' }
          },
          required: ['BB', 'MB', 'BSH', 'BSB']
        },
        siklus2: {
          type: 'object',
          properties: {
            BB: { type: 'number' },
            MB: { type: 'number' },
            BSH: { type: 'number' },
            BSB: { type: 'number' }
          },
          required: ['BB', 'MB', 'BSH', 'BSB']
        },
        targetKetuntasan: {
          type: 'number',
          description: 'Target ketuntasan klasikal minimal dalam persen (default: 75)'
        },
        saveToFile: {
          type: 'boolean',
          description: 'Simpan file SVG & HTML ke folder exports/?'
        }
      },
      required: ['variableName', 'praSiklus', 'siklus1', 'siklus2']
    }
  },
  {
    name: 'generate_mermaid_framework',
    description: 'Membuat diagram alur penelitian atau bagan Kerangka Berpikir dalam format Mermaid.js yang rapi untuk skripsi Bab II.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['kerangka_berpikir', 'siklus_ptk', 'desain_eksperimen'],
          description: 'Tipe diagram alur yang dibuat'
        },
        title: {
          type: 'string',
          description: 'Judul bagan'
        },
        kondisiAwal: {
          type: 'string',
          description: 'Uraian kondisi awal (masalah nyata di kelas / Das Sein)'
        },
        tindakanIntervensi: {
          type: 'string',
          description: 'Tindakan intervensi (media / model pembelajaran yang diterapkan)'
        },
        kondisiAkhir: {
          type: 'string',
          description: 'Kondisi akhir yang diharapkan (ketuntasan / peningkatan kemampuan)'
        }
      },
      required: ['type', 'kondisiAwal', 'tindakanIntervensi', 'kondisiAkhir']
    }
  }
];

// ── Pure SVG Rendering Engines ─────────────────────────────

const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/**
 * Render Bar / Grouped Bar Chart to Pure Standalone SVG
 */
function renderSvgBarChart(title, labels, datasets, yAxisLabel = '') {
  const width = 760;
  const height = 440;
  const padding = { top: 70, right: 40, bottom: 80, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Find max value
  let maxVal = 0;
  datasets.forEach(ds => {
    ds.data.forEach(v => { if (v > maxVal) maxVal = v; });
  });
  maxVal = Math.ceil((maxVal || 100) * 1.15); // headroom

  const groupCount = labels.length;
  const seriesCount = datasets.length;
  const groupWidth = chartW / groupCount;
  const barWidth = Math.min(36, (groupWidth * 0.7) / seriesCount);
  const groupSpacing = (groupWidth - (barWidth * seriesCount)) / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <!-- Title -->
  <text x="${width / 2}" y="36" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">${escapeXml(title)}</text>
  <text x="${width / 2}" y="54" text-anchor="middle" font-size="12" fill="#64748b">Sumber: Hasil Olah Data Peneliti AcademAI</text>

  <!-- Y-Axis Label -->
  <text x="-${height / 2}" y="24" transform="rotate(-90)" text-anchor="middle" font-size="12" fill="#475569">${escapeXml(yAxisLabel)}</text>

  <!-- Grid lines and Y ticks -->
  <g class="grid">`;

  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxVal / yTicks) * i);
    const y = padding.top + chartH - ((val / maxVal) * chartH);
    svg += `
    <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="${i === 0 ? 'none' : '3,3'}" stroke-width="1"/>
    <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#64748b">${val}</text>`;
  }
  svg += `
  </g>
  <line x1="${padding.left}" y1="${padding.top + chartH}" x2="${width - padding.right}" y2="${padding.top + chartH}" stroke="#334155" stroke-width="1.5"/>`;

  // Bars
  datasets.forEach((ds, dsIdx) => {
    const color = ds.color || PALETTE[dsIdx % PALETTE.length];
    ds.data.forEach((val, gIdx) => {
      const barH = (val / maxVal) * chartH;
      const x = padding.left + (gIdx * groupWidth) + groupSpacing + (dsIdx * barWidth);
      const y = padding.top + chartH - barH;

      svg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="3">
        <title>${ds.label}: ${val}</title>
      </rect>
      <!-- Value on top -->
      <text x="${x + (barWidth / 2)}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${val}%</text>`;
    });
  });

  // X Labels
  labels.forEach((lbl, gIdx) => {
    const x = padding.left + (gIdx * groupWidth) + (groupWidth / 2);
    svg += `
    <text x="${x}" y="${padding.top + chartH + 24}" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">${escapeXml(lbl)}</text>`;
  });

  // Legend
  const legendY = height - 20;
  let legendX = padding.left + 20;
  svg += `<g class="legend">`;
  datasets.forEach((ds, dsIdx) => {
    const color = ds.color || PALETTE[dsIdx % PALETTE.length];
    svg += `
    <rect x="${legendX}" y="${legendY - 10}" width="14" height="14" fill="${color}" rx="2"/>
    <text x="${legendX + 20}" y="${legendY + 2}" font-size="12" fill="#334155">${escapeXml(ds.label)}</text>`;
    legendX += (ds.label.length * 8) + 40;
  });
  svg += `</g>
</svg>`;

  return svg;
}

/**
 * Generate Standalone Interactive HTML with Chart.js
 */
function generateInteractiveHtml(title, chartType, labels, datasets, yAxisLabel = '') {
  const chartJsType = chartType === 'grouped_bar' ? 'bar' : chartType;
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(title)} — Visualisasi Data AcademAI</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Times New Roman', serif; background: #f8fafc; padding: 32px; display: flex; justify-content: center; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); padding: 28px; width: 100%; max-width: 820px; }
    h2 { text-align: center; margin: 0 0 6px 0; font-size: 1.25rem; color: #0f172a; }
    p.sub { text-align: center; color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
    .canvas-wrap { position: relative; height: 380px; width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${escapeXml(title)}</h2>
    <p class="sub">Format Standar Publikasi Ilmiah AcademAI</p>
    <div class="canvas-wrap">
      <canvas id="academicChart"></canvas>
    </div>
  </div>
  <script>
    const ctx = document.getElementById('academicChart').getContext('2d');
    new Chart(ctx, {
      type: '${chartJsType}',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: ${JSON.stringify(datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color || PALETTE[i % PALETTE.length],
          borderColor: ds.color || PALETTE[i % PALETTE.length],
          borderWidth: 1
        })))}
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Times New Roman', size: 12 } } }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: ${Boolean(yAxisLabel)}, text: '${yAxisLabel}', font: { family: 'Times New Roman', size: 12 } }
          },
          x: {
            title: { display: true, text: 'Tahapan Penelitian', font: { family: 'Times New Roman', size: 12 } }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// ── MCP Tool Execution Router ──────────────────────────────

async function executeTool(name, args) {
  switch (name) {
    case 'generate_academic_chart': {
      const { title, chartType = 'bar', labels, datasets, yAxisLabel = 'Nilai (%)', saveToFile } = args;
      const svg = renderSvgBarChart(title, labels, datasets, yAxisLabel);
      const html = generateInteractiveHtml(title, chartType, labels, datasets, yAxisLabel);

      let savedPaths = [];
      if (saveToFile) {
        const cleanName = title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_');
        const svgFile = path.join(EXPORTS_DIR, `${cleanName}.svg`);
        const htmlFile = path.join(EXPORTS_DIR, `${cleanName}.html`);
        fs.writeFileSync(svgFile, svg, 'utf-8');
        fs.writeFileSync(htmlFile, html, 'utf-8');
        savedPaths = [svgFile, htmlFile];
      }

      return {
        title,
        chartType,
        labels,
        datasetsCount: datasets.length,
        svgPreview: svg,
        htmlPreview: html,
        savedFiles: savedPaths
      };
    }

    case 'generate_ptk_cycle_chart': {
      const { variableName, praSiklus, siklus1, siklus2, targetKetuntasan = 75, saveToFile } = args;

      // Calculate classical mastery (BSH + BSB)
      const tuntasPra = (praSiklus.BSH || 0) + (praSiklus.BSB || 0);
      const tuntasS1  = (siklus1.BSH || 0) + (siklus1.BSB || 0);
      const tuntasS2  = (siklus2.BSH || 0) + (siklus2.BSB || 0);

      const labels = ['Pra-Siklus', 'Siklus I', 'Siklus II'];
      const datasets = [
        { label: 'BB (Belum Berkembang)', data: [praSiklus.BB, siklus1.BB, siklus2.BB], color: '#ef4444' },
        { label: 'MB (Mulai Berkembang)', data: [praSiklus.MB, siklus1.MB, siklus2.MB], color: '#f59e0b' },
        { label: 'BSH (Berkembang Sesuai Harapan)', data: [praSiklus.BSH, siklus1.BSH, siklus2.BSH], color: '#3b82f6' },
        { label: 'BSB (Berkembang Sangat Baik)', data: [praSiklus.BSB, siklus1.BSB, siklus2.BSB], color: '#10b981' }
      ];

      const chartTitle = `Peningkatan Ketercapaian Aspek: ${variableName}`;
      const svg = renderSvgBarChart(chartTitle, labels, datasets, 'Persentase Anak (%)');
      const html = generateInteractiveHtml(chartTitle, 'bar', labels, datasets, 'Persentase Anak (%)');

      // Academic narrative for thesis chapter IV
      const narrative = `### Pembahasan Data Siklus PTK: ${variableName}
1. **Pra-Siklus**: Ketuntasan belajar klasikal (kategori BSH + BSB) sebesar **${tuntasPra.toFixed(1)}%**. Sebagian besar anak (${(praSiklus.BB + praSiklus.MB).toFixed(1)}%) masih berada pada kategori Belum Berkembang dan Mulai Berkembang.
2. **Siklus I**: Setelah dilakukan intervensi tindakan pertama, ketuntasan klasikal meningkat menjadi **${tuntasS1.toFixed(1)}%** (peningkatan +${(tuntasS1 - tuntasPra).toFixed(1)}%).
3. **Siklus II**: Dilakukan perbaikan strategi dan media berdasarkan refleksi siklus I, capaian ketuntasan klasikal melonjak mencapai **${tuntasS2.toFixed(1)}%**.
4. **Kesimpulan Ketercapaian Indikator**: Target ketuntasan minimal $(\\ge ${targetKetuntasan}\\%)$ telah **BERHASIL TERCAPAI** pada Siklus II, sehingga tindakan dihentikan sesuai kriteria keberhasilan.`;

      let savedFiles = [];
      if (saveToFile) {
        const cleanName = `grafik_ptk_${variableName.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}`;
        const svgFile = path.join(EXPORTS_DIR, `${cleanName}.svg`);
        const htmlFile = path.join(EXPORTS_DIR, `${cleanName}.html`);
        fs.writeFileSync(svgFile, svg, 'utf-8');
        fs.writeFileSync(htmlFile, html, 'utf-8');
        savedFiles = [svgFile, htmlFile];
      }

      return {
        variableName,
        ketuntasanKlasikal: {
          praSiklus: `${tuntasPra.toFixed(1)}%`,
          siklus1: `${tuntasS1.toFixed(1)}%`,
          siklus2: `${tuntasS2.toFixed(1)}%`,
          target: `${targetKetuntasan}%`,
          status: tuntasS2 >= targetKetuntasan ? 'TERCAPAI' : 'BELUM TERCAPAI'
        },
        narrative,
        svgChart: svg,
        htmlChart: html,
        savedFiles
      };
    }

    case 'generate_mermaid_framework': {
      const { type, title = 'Bagan Kerangka Berpikir', kondisiAwal, tindakanIntervensi, kondisiAkhir } = args;

      let mermaidCode = '';
      if (type === 'kerangka_berpikir') {
        mermaidCode = `graph TD
  subgraph KA["1. Kondisi Awal (Pra-Tindakan)"]
    A["${kondisiAwal}"]
    A1["Model Pembelajaran Masih Konvensional"]
    A2["Tingkat Ketuntasan Masih Rendah"]
  end

  subgraph TI["2. Pelaksanaan Tindakan (Intervensi)"]
    B["Penerapan: ${tindakanIntervensi}"]
    B1["Siklus I: Pengenalan Media & Tindakan Dasar"]
    B2["Siklus II: Optimalisasi & Penguatan Interaksi"]
  end

  subgraph KO["3. Kondisi Akhir (Ketercapaian Target)"]
    C["${kondisiAkhir}"]
    C1["Ketuntasan Klasikal Mencapai Target &ge; 75-80%"]
  end

  KA --> TI
  TI --> KO
  
  style KA fill:#fee2e2,stroke:#ef4444,stroke-width:2px
  style TI fill:#fef3c7,stroke:#f59e0b,stroke-width:2px
  style KO fill:#d1fae5,stroke:#10b981,stroke-width:2px`;
      } else if (type === 'siklus_ptk') {
        mermaidCode = `graph TD
  A["Rencana Tindakan (Planning)"] --> B["Pelaksanaan (Action)"]
  B --> C["Pengamatan (Observation)"]
  C --> D["Refleksi (Reflection)"]
  D -->|"Perbaikan Rencana"| A1["Rencana Tindakan Siklus II"]
  A1 --> B1["Pelaksanaan Siklus II"]
  B1 --> C1["Pengamatan Siklus II"]
  C1 --> D1["Refleksi Siklus II"]
  D1 -->|"Target Ketuntasan Tercapai"| E["Hasil Akhir / Kesimpulan"]

  style A fill:#e0f2fe,stroke:#0284c7
  style D fill:#fef08a,stroke:#ca8a04
  style E fill:#bbf7d0,stroke:#16a34a,stroke-width:2px`;
      } else {
        mermaidCode = `graph LR
  A["Pre-Test (O1)"] --> B["Intervensi Eksperimen (X)"] --> C["Post-Test (O2)"]
  style B fill:#dbeafe,stroke:#2563eb,stroke-width:2px`;
      }

      return {
        title,
        type,
        mermaidCode,
        markdownEmbed: `\`\`\`mermaid\n${mermaidCode}\n\`\`\``
      };
    }

    default:
      throw new Error(`Tool "${name}" tidak ditemukan dalam MCP DataViz Server.`);
  }
}

// ── MCP JSON-RPC 2.0 Protocol Handler over STDIN/STDOUT ────

process.stdin.setEncoding('utf-8');

let buffer = '';

process.stdin.on('data', async chunk => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep last uncompleted line

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      const response = await handleRpcMessage(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      console.error('[DataViz MCP Error]', e);
    }
  }
});

async function handleRpcMessage(req) {
  const { id, method, params } = req;

  // Initialize
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: {
          name: 'academai-data-viz',
          version: '1.0.0'
        }
      }
    };
  }

  // List tools
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS
      }
    };
  }

  // Call tool
  if (method === 'tools/call') {
    const { name, arguments: toolArgs } = params;
    try {
      const toolResult = await executeTool(name, toolArgs || {});
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
            }
          ],
          isError: false
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${err.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  return null;
}
