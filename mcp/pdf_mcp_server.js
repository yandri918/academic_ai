#!/usr/bin/env node

/**
 * AcademAI PDF Parser — Model Context Protocol (MCP) Server
 * Standard MCP JSON-RPC 2.0 Server over stdio
 * Allows AI agents (Claude, Antigravity, Cursor) to parse, search, and ingest PDF files
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const ACADEMAI_API_URL = process.env.ACADEMAI_URL || 'http://localhost:3000';

// Available Tools Definition according to MCP Specification
const TOOLS = [
  {
    name: 'parse_pdf',
    description: 'Ekstrak teks lengkap, jumlah halaman, jumlah kata, dan metadata dari file PDF lokal.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path absolut atau relatif ke file PDF lokal (contoh: c:/Users/.../jurnal.pdf)'
        },
        maxPages: {
          type: 'number',
          description: 'Batas maksimal halaman yang diekstrak (default: seluruh halaman)'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'search_pdf',
    description: 'Cari kata kunci atau frasa tertentu di dalam file PDF dan ambil bagian paragraf yang relevan.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path ke file PDF'
        },
        query: {
          type: 'string',
          description: 'Kata kunci pencarian (misal: "metode penelitian", "motorik halus", "loose parts")'
        },
        contextLines: {
          type: 'number',
          description: 'Jumlah baris konteks sebelum dan sesudah temuan (default: 3)'
        }
      },
      required: ['filePath', 'query']
    }
  },
  {
    name: 'pdf_to_academai_memory',
    description: 'Ekstrak file PDF dan langsung kirimkan ke Memori Konteks AcademAI lokal agar menjadi rujukan aktif bagi penulisan skripsi.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path ke file PDF yang ingin dimasukkan ke memori riset'
        },
        sessionId: {
          type: 'string',
          description: 'Session ID AcademAI (default: default_session)'
        },
        title: {
          type: 'string',
          description: 'Judul dokumen memori (opsional, jika kosong menggunakan nama file)'
        }
      },
      required: ['filePath']
    }
  }
];

// Helper: Parse PDF from file path
async function parsePdfFile(filePath, maxPages = null) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File PDF tidak ditemukan di path: ${resolvedPath}`);
  }

  const dataBuffer = fs.readFileSync(resolvedPath);
  const parser = new PDFParse({ data: dataBuffer });
  const textResult = await parser.getText();
  const info = await parser.getInfo();

  let pages = textResult.pages || [];
  if (maxPages && maxPages > 0) {
    pages = pages.slice(0, maxPages);
  }

  const fullText = pages.map(p => p.text).join('\n\n') || textResult.text || '';
  const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  return {
    filePath: resolvedPath,
    fileName: path.basename(resolvedPath),
    totalPageCount: textResult.total || 1,
    extractedPageCount: pages.length || textResult.total || 1,
    wordCount,
    text: cleanText,
    metadata: info?.info || {}
  };
}

// Tool Handlers
async function handleCallTool(name, args) {
  switch (name) {
    case 'parse_pdf': {
      const result = await parsePdfFile(args.filePath, args.maxPages);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              fileName: result.fileName,
              pageCount: result.totalPageCount,
              wordCount: result.wordCount,
              metadata: result.metadata,
              textSnippet: result.text.substring(0, 1500) + '...',
              fullTextLength: result.text.length
            }, null, 2)
          }
        ]
      };
    }

    case 'search_pdf': {
      const result = await parsePdfFile(args.filePath);
      const query = (args.query || '').toLowerCase();
      const lines = result.text.split('\n');
      const matches = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query)) {
          const start = Math.max(0, i - (args.contextLines || 3));
          const end = Math.min(lines.length, i + (args.contextLines || 3) + 1);
          matches.push({
            lineNumber: i + 1,
            snippet: lines.slice(start, end).join('\n')
          });
          if (matches.length >= 10) break;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              query,
              fileName: result.fileName,
              matchCount: matches.length,
              matches
            }, null, 2)
          }
        ]
      };
    }

    case 'pdf_to_academai_memory': {
      const result = await parsePdfFile(args.filePath);
      const title = args.title || result.fileName.replace(/\.pdf$/i, '');
      const sessionId = args.sessionId || 'default_session';

      // Post to AcademAI Server Memory API
      const response = await fetch(`${ACADEMAI_API_URL}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          title,
          content: result.text,
          type: 'pdf_upload'
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal menyimpan ke AcademAI API (${response.status}): ${await response.text()}`);
      }

      const memoryRes = await response.json();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `✅ PDF "${result.fileName}" berhasil diparse dan disimpan ke memori AcademAI (${sessionId})!`,
              documentId: memoryRes.document?.id,
              pageCount: result.totalPageCount,
              wordCount: result.wordCount
            }, null, 2)
          }
        ]
      };
    }

    default:
      throw new Error(`Tool "${name}" tidak ditemukan pada MCP PDF Server.`);
  }
}

// ── JSON-RPC 2.0 stdio Interface ─────────────────
process.stdin.setEncoding('utf-8');

let buffer = '';
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep unfinished line in buffer

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line.trim());
      const response = await handleRpcMessage(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse Error: ${e.message}` }
      }) + '\n');
    }
  }
});

async function handleRpcMessage(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'academai-pdf-parser',
          version: '1.0.0'
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null; // No response needed
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      const toolResult = await handleCallTool(name, args || {});
      return {
        jsonrpc: '2.0',
        id,
        result: toolResult
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method "${method}" not found` }
  };
}

console.error('[AcademAI PDF MCP Server] Started on stdio.');
