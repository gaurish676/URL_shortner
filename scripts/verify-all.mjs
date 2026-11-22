// End-to-end verification script for Next.js URL Shortener & Analytics Dashboard
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runVerification() {
  console.log(`\n======================================================`);
  console.log(`Running End-to-End Verification on ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Step 1: Health / Page check
  console.log(`[Test 1] Fetching root dashboard...`);
  const rootRes = await fetch(`${BASE_URL}/`);
  if (!rootRes.ok) {
    throw new Error(`Failed to load homepage: ${rootRes.status} ${rootRes.statusText}`);
  }
  console.log(`  ✓ Homepage loaded successfully (status ${rootRes.status})\n`);

  // Step 2: Shorten URL
  const targetUrl = `https://news.ycombinator.com/item?id=${Date.now()}`;
  console.log(`[Test 2] Shortening URL: "${targetUrl}"...`);
  const shortenRes = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl }),
  });

  const shortenData = await shortenRes.json();
  if (!shortenRes.ok || !shortenData.success) {
    throw new Error(`Failed to shorten URL: ${JSON.stringify(shortenData)}`);
  }

  const { code, shortUrl } = shortenData;
  console.log(`  ✓ Generated short code: "${code}"`);
  console.log(`  ✓ Full short URL: "${shortUrl}"\n`);

  // Step 3: Test Redirection and Click Tracking
  console.log(`[Test 3] Simulating 3 clicks on short code "${code}"...`);
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'curl/8.4.0',
  ];

  for (let i = 0; i < userAgents.length; i++) {
    const ua = userAgents[i];
    console.log(`  Visiting click ${i + 1}/3 with User-Agent: ${ua.slice(0, 30)}...`);

    // Use redirect: 'manual' to verify 307 redirect status and Location header without auto-following
    const clickRes = await fetch(`${BASE_URL}/${code}`, {
      redirect: 'manual',
      headers: {
        'User-Agent': ua,
        'Referer': i === 0 ? 'https://twitter.com' : 'https://google.com',
      },
    });

    if (clickRes.status !== 307) {
      throw new Error(`Expected redirect status 307, received ${clickRes.status}`);
    }

    const redirectLocation = clickRes.headers.get('location');
    const expectedUrl = new URL(targetUrl).toString();
    if (redirectLocation !== expectedUrl && redirectLocation !== targetUrl) {
      throw new Error(`Expected Location "${expectedUrl}", received "${redirectLocation}"`);
    }

    console.log(`    -> Redirect 307 verified -> Location: ${redirectLocation}`);
  }
  console.log(`  ✓ All 3 visits generated and redirected successfully\n`);

  // Step 4: Verify Analytics API
  console.log(`[Test 4] Querying detailed analytics for code "${code}"...`);
  const analyticsRes = await fetch(`${BASE_URL}/api/urls/${code}/analytics`);
  const analyticsData = await analyticsRes.json();

  if (!analyticsRes.ok || !analyticsData.success) {
    throw new Error(`Failed to fetch analytics: ${JSON.stringify(analyticsData)}`);
  }

  const { totalClicks, clicks } = analyticsData.analytics;
  console.log(`  ✓ Total clicks reported: ${totalClicks}`);
  if (totalClicks !== 3) {
    throw new Error(`Expected totalClicks === 3, got ${totalClicks}`);
  }

  if (!Array.isArray(clicks) || clicks.length !== 3) {
    throw new Error(`Expected clicks array of length 3, got ${clicks?.length}`);
  }

  console.log(`  ✓ Detailed click logs:`);
  clicks.forEach((clk, idx) => {
    console.log(`    [${idx + 1}] ID: ${clk.id} | Timestamp: ${clk.timestamp} | Referer: ${clk.referer}`);
  });

  // Verify timestamps order (newest to oldest)
  const t0 = new Date(clicks[0].timestamp).getTime();
  const t1 = new Date(clicks[1].timestamp).getTime();
  const t2 = new Date(clicks[2].timestamp).getTime();
  if (t0 < t1 || t1 < t2) {
    throw new Error(`Clicks are not sorted from newest to oldest!`);
  }
  console.log(`  ✓ Timestamps confirmed in descending chronological order\n`);

  // Step 5: Test Non-existent code (404 handling)
  console.log(`[Test 5] Verifying 404 behavior for invalid code...`);
  const notFoundRes = await fetch(`${BASE_URL}/nonExistentCodeXYZ123`);
  if (notFoundRes.status !== 404) {
    throw new Error(`Expected 404 for nonexistent code, got ${notFoundRes.status}`);
  }
  console.log(`  ✓ Friendly 404 status confirmed for invalid links\n`);

  // Step 6: Test Malformed URL input
  console.log(`[Test 6] Verifying validation rejection for malformed URL...`);
  const malformedRes = await fetch(`${BASE_URL}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'javascript:alert(1)' }),
  });
  if (malformedRes.status !== 400) {
    throw new Error(`Expected 400 Bad Request for malicious scheme, got ${malformedRes.status}`);
  }
  console.log(`  ✓ Malformed URL successfully blocked with HTTP 400\n`);

  console.log(`======================================================`);
  console.log(`ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!`);
  console.log(`======================================================\n`);
}

runVerification().catch((err) => {
  console.error(`\n❌ VERIFICATION FAILED:`, err);
  process.exit(1);
});
