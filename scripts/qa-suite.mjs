// Comprehensive QA Edge-Case & Security Suite
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runQaSuite() {
  console.log(`\n===============================================================`);
  console.log(`  QA TEST RUNNER & EDGE-CASE VALIDATION SUITE`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`===============================================================\n`);

  // SECTION 1: PROTOCOL & MALICIOUS URL FILTERING
  console.log(`[Suite 1] Protocol Whitelisting & Malicious URL Injection:`);

  const maliciousPayloads = [
    { url: "javascript:alert(document.cookie)", desc: "XSS scheme javascript:" },
    { url: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==", desc: "Phishing scheme data:" },
    { url: "file:///etc/passwd", desc: "Local file disclosure scheme file:" },
    { url: "ftp://files.example.com", desc: "Unsupported scheme ftp:" },
    { url: "http://", desc: "Empty HTTP scheme" },
    { url: "https://", desc: "Empty HTTPS scheme" },
    { url: "", desc: "Empty string" },
    { url: "   ", desc: "Whitespace-only string" },
    { url: "not-a-valid-url-at-all", desc: "Plain word without domain" },
  ];

  for (const item of maliciousPayloads) {
    const res = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: item.url }),
    });
    assert(res.status === 400, `Block ${item.desc}`, `Received HTTP ${res.status}`);
  }

  // Missing or non-string body
  const emptyBodyRes = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(emptyBodyRes.status === 400, `Block missing url field in request body`, `HTTP ${emptyBodyRes.status}`);

  // Max length check (> 2048 chars)
  const giantUrl = "https://example.com/" + "a".repeat(2500);
  const giantRes = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: giantUrl }),
  });
  assert(giantRes.status === 400, `Block URL exceeding 2048 characters`, `HTTP ${giantRes.status}`);


  // SECTION 2: LOOPBACK & SELF-REFERENTIAL PREVENTION
  console.log(`\n[Suite 2] Infinite Redirect Loopback Prevention:`);
  const loopbackHosts = [
    "http://localhost:3000/some-code",
    "http://127.0.0.1:3000/xyz",
    "http://0.0.0.0:3000/xyz",
  ];

  for (const loopUrl of loopbackHosts) {
    const res = await fetch(`${BASE_URL}/api/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: loopUrl }),
    });
    assert(res.status === 400, `Block loopback target "${loopUrl}"`, `HTTP ${res.status}`);
  }


  // SECTION 3: URL NORMALIZATION & VALID SHORTENING
  console.log(`\n[Suite 3] URL Normalization & Parameter Preservation:`);

  // Trimming and protocol auto-prepend
  const untrimmed = "   duckduckgo.com/test?q=search%20term&filter=1#heading   ";
  const normRes = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: untrimmed }),
  });
  const normData = await normRes.json();
  assert(normRes.ok && normData.success, `Shorten un-prefixed & padded URL`);
  assert(
    normData.originalUrl === "https://duckduckgo.com/test?q=search%20term&filter=1#heading",
    `Normalized to valid HTTPS with preserved query and fragment`,
    `Got: ${normData.originalUrl}`
  );


  // SECTION 4: RESERVED SLUG SHIELDING & SQL INJECTION RESISTANCE
  console.log(`\n[Suite 4] Reserved Slug Shielding & Injection Hardening:`);
  const reservedPaths = ['api', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'analytics', 'dashboard', 'static'];
  for (const slug of reservedPaths) {
    const res = await fetch(`${BASE_URL}/${slug}`);
    assert(res.status === 404, `Protect reserved path "/${slug}" from being handled as short URL`, `HTTP ${res.status}`);
  }

  // SQL Injection and XSS route attacks
  const injectionAttempts = [
    "' OR 1=1 --",
    "'; DROP TABLE urls; --",
    "<script>alert(1)</script>",
    "../../etc/passwd",
  ];
  for (const payload of injectionAttempts) {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(payload)}`);
    assert(res.status === 404, `Safely reject injection attempt "${payload}"`, `HTTP ${res.status}`);
  }


  // SECTION 5: REDIRECT PROTOCOL & CACHE HEADERS
  console.log(`\n[Suite 5] HTTP 307 Redirect & Cache-Busting Headers:`);
  const redirectRes = await fetch(`${BASE_URL}/${normData.code}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'QA-Test-Agent/1.0', 'Referer': 'https://testsuite.local' },
  });
  assert(redirectRes.status === 307, `Returns HTTP 307 Temporary Redirect`, `Got HTTP ${redirectRes.status}`);

  const cacheControl = redirectRes.headers.get('cache-control') || '';
  assert(
    cacheControl.includes('no-store') && cacheControl.includes('no-cache'),
    `Cache-Control header explicitly prevents redirect caching ("${cacheControl}")`
  );
  assert(redirectRes.headers.get('location') === normData.originalUrl, `Location header matches exact destination`);


  // SECTION 6: BOT & PREFETCH SKEW HANDLING
  console.log(`\n[Suite 6] Bot & Browser Prefetch Discrimination:`);
  // Fetch initial analytics count
  const initialAnalytics = await (await fetch(`${BASE_URL}/api/urls/${normData.code}/analytics`)).json();
  const baseClicks = initialAnalytics.analytics.totalClicks;

  // Visit with Purpose: prefetch (simulating Chrome link preloading)
  await fetch(`${BASE_URL}/${normData.code}`, {
    redirect: 'manual',
    headers: { 'Purpose': 'prefetch' },
  });
  await fetch(`${BASE_URL}/${normData.code}`, {
    redirect: 'manual',
    headers: { 'Sec-Purpose': 'prefetch' },
  });

  const postPrefetchAnalytics = await (await fetch(`${BASE_URL}/api/urls/${normData.code}/analytics`)).json();
  assert(
    postPrefetchAnalytics.analytics.totalClicks === baseClicks,
    `Prefetch requests do not inflate click metrics`,
    `Before: ${baseClicks}, After: ${postPrefetchAnalytics.analytics.totalClicks}`
  );


  // SECTION 7: CONCURRENCY & SQLITE WAL RESILIENCE
  console.log(`\n[Suite 7] Concurrency Stress & ACID Non-Blocking Writes:`);
  const concurrentShortenCount = 10;
  const promises = [];
  for (let i = 0; i < concurrentShortenCount; i++) {
    promises.push(
      fetch(`${BASE_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://example.com/concurrent-${Date.now()}-${i}` }),
      }).then(r => r.json())
    );
  }

  const results = await Promise.all(promises);
  const allSuccessful = results.every(r => r.success === true && typeof r.code === 'string');
  assert(allSuccessful, `Successfully processed ${concurrentShortenCount} parallel URL creations without SQLITE_BUSY`);

  // Verify unique codes generated across all concurrent requests
  const codes = results.map(r => r.code);
  const uniqueCodes = new Set(codes);
  assert(uniqueCodes.size === concurrentShortenCount, `All ${concurrentShortenCount} generated short codes are unique`);


  // SUMMARY
  console.log(`\n===============================================================`);
  console.log(`  QA SUITE EXECUTION SUMMARY:`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runQaSuite().catch(err => {
  console.error("Fatal error in QA runner:", err);
  process.exit(1);
});
