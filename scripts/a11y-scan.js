#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * HTMLファイルをスキャンして、アクセシビリティ違反を検出・レポート
 * 
 * 使用方法: node scripts/a11y-scan.js [--fix] [--html] [--json]
 * 
 * オプション:
 *   --fix   修正可能な問題の自動修正提案を含める
 *   --html  HTML形式のレポートを出力
 *   --json  JSON形式のレポートを出力
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const HTML_DIR = path.join(__dirname, '../html');
const REPORT_DIR = path.join(__dirname, '../a11y-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Accessibility issues to scan for
const ISSUES = {
  missingAlt: {
    pattern: /<img(?![^>]*alt=)/gi,
    severity: 'error',
    description: '画像にalt属性がありません',
    fix: 'alt属性を追加してください（装飾画像の場合は alt=""）'
  },
  emptyAlt: {
    pattern: /alt=""\s*(?!aria-hidden)/gi,
    severity: 'warning',
    description: 'alt=""（空）が設定されています。aria-hidden="true"で装飾画像を明示するか、意味ある説明を追加してください',
    fix: '装飾画像なら aria-hidden="true" を親要素に追加'
  },
  emptyButton: {
    pattern: /<button[^>]*>\s*<\/button>/gi,
    severity: 'error',
    description: '空のbutton要素があります',
    fix: 'buttonにテキストまたはaria-labelを追加'
  },
  emptyLink: {
    pattern: /<a[^>]*>\s*<\/a>/gi,
    severity: 'error',
    description: '空のa要素があります',
    fix: 'リンクテキストまたはaria-labelを追加'
  },
  submitNoValue: {
    pattern: /<input[^>]*type="submit"[^>]*value=""\s*\/?>/gi,
    severity: 'error',
    description: 'submit ボタンにvalueが設定されていません',
    fix: 'value属性を設定するか aria-label を追加'
  },
  inputNoLabel: {
    pattern: /<input(?!.*(?:id|aria-label|aria-labelledby))[^>]*>/gi,
    severity: 'warning',
    description: 'input要素にlabelが関連付けられていません',
    fix: 'id属性を追加するか、aria-labelを設定'
  },
  positiveTabindex: {
    pattern: /tabindex="[1-9]/gi,
    severity: 'warning',
    description: '正のtabindex値は推奨されません',
    fix: 'tabindex="0" または tabindex="-1" を使用してください'
  },
  missingLang: {
    pattern: /<html(?![^>]*lang=)/gi,
    severity: 'error',
    description: '<html>要素にlang属性がありません',
    fix: '<html lang="ja"> を設定'
  }
};

// Initialize report directory
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

/**
 * Scan HTML files for accessibility issues
 */
function scanHTMLFiles() {
  const files = getAllHTMLFiles(HTML_DIR);
  const results = {
    timestamp: TIMESTAMP,
    totalFiles: files.length,
    issuesFound: 0,
    files: []
  };

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(HTML_DIR, file);
    const fileResult = {
      file: relPath,
      issues: []
    };

    Object.entries(ISSUES).forEach(([issueKey, issueDef]) => {
      const matches = [...content.matchAll(issueDef.pattern)];
      
      matches.forEach((match, index) => {
        const lineNum = content.substring(0, match.index).split('\n').length;
        fileResult.issues.push({
          type: issueKey,
          severity: issueDef.severity,
          line: lineNum,
          description: issueDef.description,
          fix: issueDef.fix,
          snippet: match[0].substring(0, 100)
        });
        results.issuesFound++;
      });
    });

    if (fileResult.issues.length > 0) {
      results.files.push(fileResult);
    }
  });

  return results;
}

/**
 * Get all HTML files in directory
 */
function getAllHTMLFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'node_modules') {
      getAllHTMLFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.html')) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * Generate text report
 */
function generateTextReport(results) {
  let report = '';
  report += `\n${'='.repeat(70)}\n`;
  report += `  Accessibility Audit Report\n`;
  report += `${'='.repeat(70)}\n`;
  report += `Timestamp: ${results.timestamp}\n`;
  report += `Total Files Scanned: ${results.totalFiles}\n`;
  report += `Issues Found: ${results.issuesFound}\n\n`;

  if (results.issuesFound === 0) {
    report += '✅ 違反は見つかりません！\n';
  } else {
    results.files.forEach(fileResult => {
      report += `\n📄 ${fileResult.file}\n`;
      report += `${'-'.repeat(70)}\n`;

      fileResult.issues.forEach((issue, idx) => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️ ';
        report += `\n${idx + 1}. ${icon} [${issue.type}] (Line ${issue.line})\n`;
        report += `   Severity: ${issue.severity.toUpperCase()}\n`;
        report += `   Issue: ${issue.description}\n`;
        report += `   Fix: ${issue.fix}\n`;
        report += `   Code: ${issue.snippet}\n`;
      });
    });
  }

  report += `\n${'='.repeat(70)}\n`;
  return report;
}

/**
 * Generate JSON report
 */
function generateJSONReport(results) {
  return JSON.stringify(results, null, 2);
}

/**
 * Generate HTML report
 */
function generateHTMLReport(results) {
  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
    .summary-item { padding: 20px; background: #f9f9f9; border-left: 4px solid #ddd; border-radius: 4px; }
    .summary-item.errors { border-color: #d32f2f; }
    .summary-item.warnings { border-color: #f57f17; }
    .summary-item h3 { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
    .summary-item .number { font-size: 32px; font-weight: bold; color: #333; }
    .file-section { margin-top: 40px; page-break-inside: avoid; }
    .file-title { background: #2c3e50; color: white; padding: 15px; border-radius: 4px 4px 0 0; }
    .issues-list { border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px; overflow: hidden; }
    .issue { padding: 20px; border-bottom: 1px solid #eee; }
    .issue:last-child { border-bottom: none; }
    .issue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .issue-type { background: #f0f0f0; padding: 5px 10px; border-radius: 3px; font-weight: bold; font-size: 12px; }
    .issue.error .issue-type { background: #ffebee; color: #d32f2f; }
    .issue.warning .issue-type { background: #fff3e0; color: #f57f17; }
    .issue-line { color: #666; font-size: 12px; }
    .issue-description { color: #333; margin: 10px 0; }
    .issue-fix { background: #e8f5e9; padding: 10px; border-left: 3px solid #4caf50; margin: 10px 0; border-radius: 3px; font-size: 13px; }
    .issue-code { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; font-size: 12px; overflow-x: auto; margin: 10px 0; }
    .no-issues { padding: 40px; text-align: center; color: #4caf50; font-size: 18px; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>アクセシビリティ監査レポート</h1>
    <p style="color: #666; margin-bottom: 20px;">生成日時: ${new Date(results.timestamp.replace(/-/g, ':').replace('T', ' ')).toLocaleString('ja-JP')}</p>
    
    <div class="summary">
      <div class="summary-item errors">
        <h3>エラー</h3>
        <div class="number">${results.files.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'error').length, 0)}</div>
      </div>
      <div class="summary-item warnings">
        <h3>警告</h3>
        <div class="number">${results.files.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'warning').length, 0)}</div>
      </div>
      <div class="summary-item">
        <h3>スキャンファイル</h3>
        <div class="number">${results.totalFiles}</div>
      </div>
      <div class="summary-item">
        <h3>問題のあるファイル</h3>
        <div class="number">${results.files.length}</div>
      </div>
    </div>
`;

  if (results.issuesFound === 0) {
    html += '<div class="no-issues">✅ 違反は見つかりません！</div>';
  } else {
    results.files.forEach(fileResult => {
      html += `
    <div class="file-section">
      <div class="file-title">📄 ${fileResult.file}</div>
      <div class="issues-list">
`;
      fileResult.issues.forEach(issue => {
        html += `
        <div class="issue ${issue.severity}">
          <div class="issue-header">
            <span class="issue-type">${issue.type}</span>
            <span class="issue-line">Line ${issue.line}</span>
          </div>
          <div class="issue-description"><strong>${issue.description}</strong></div>
          <div class="issue-fix">💡 ${issue.fix}</div>
          <div class="issue-code">${issue.snippet}</div>
        </div>
`;
      });
      html += `
      </div>
    </div>
`;
    });
  }

  html += `
    <footer>
      <p>このレポートは自動生成されました。詳細は各ファイルを確認してください。</p>
    </footer>
  </div>
</body>
</html>
`;
  return html;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    html: args.includes('--html'),
    json: args.includes('--json'),
    text: !args.includes('--html') && !args.includes('--json')
  };

  console.log('🔍 Scanning HTML files for accessibility issues...\n');
  
  const results = scanHTMLFiles();

  // Text output (always)
  const textReport = generateTextReport(results);
  console.log(textReport);
  fs.writeFileSync(
    path.join(REPORT_DIR, `a11y-report-${TIMESTAMP}.txt`),
    textReport
  );

  // JSON output (if requested)
  if (options.json) {
    const jsonReport = generateJSONReport(results);
    fs.writeFileSync(
      path.join(REPORT_DIR, `a11y-report-${TIMESTAMP}.json`),
      jsonReport
    );
    console.log(`📊 JSON report saved: a11y-reports/a11y-report-${TIMESTAMP}.json`);
  }

  // HTML output (if requested)
  if (options.html) {
    const htmlReport = generateHTMLReport(results);
    fs.writeFileSync(
      path.join(REPORT_DIR, `a11y-report-${TIMESTAMP}.html`),
      htmlReport
    );
    console.log(`📊 HTML report saved: a11y-reports/a11y-report-${TIMESTAMP}.html`);
  }

  // Exit with error code if critical issues found
  const errorCount = results.files.reduce((sum, f) => sum + f.issues.filter(i => i.severity === 'error').length, 0);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
