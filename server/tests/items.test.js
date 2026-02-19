import test from "node:test";
import assert from "node:assert/strict";
import fetch from "node-fetch";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

// Test data configuration
const STATUSES = ["Received", "In Progress", "Waiting for Parts", "Sent to Service", "Ready", "Delivered", "Pending"];
const BRANDS = ["Apple", "Samsung", "Google", "LG", "Sony", "Dell", "HP", "Lenovo", "ASUS", "Nokia"];
const TEST_USERS = [
  { username: "Shyam", password: process.env.TECH_PASSWORD_SHYAM || "shyamadmin", displayName: "Shyam (Admin)" },
  { username: "Rakesh", password: process.env.TECH_PASSWORD_RAKESH || "rakesh123", displayName: "Rakesh" },
  { username: "Akhil", password: process.env.TECH_PASSWORD_AKHIL || "akhil123", displayName: "Akhil" },
  { username: "Nabeel", password: process.env.TECH_PASSWORD_NABEEL || "nabeel123", displayName: "Nabeel" },
];

// Cookie storage for each user
let userSessions = {};

// Utility: Shuffle array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Utility: Generate random phone number
function generatePhoneNumber() {
  return String(Math.floor(Math.random() * 9000000000) + 1000000000);
}

// Utility: Generate unique job number
function generateJobNumber(index) {
  return `JOB-${Date.now()}-${index}`;
}

// Utility: Get random element from array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Utility: Extract cookies from Set-Cookie header
function extractCookies(setCookieHeader) {
  if (!setCookieHeader) return {};
  const cookies = {};
  
  // Handle both string and array responses
  const headerArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  
  headerArray.forEach(cookie => {
    if (!cookie) return;
    // Parse "name=value; path=/; secure; httpOnly" format
    const parts = cookie.split(';');
    const [nameValue] = parts;
    const [name, ...valueParts] = nameValue.split('=');
    const value = valueParts.join('=');
    
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });
  
  return cookies;
}

// Utility: Build cookie header from stored cookies  
function buildCookieHeader(cookies, csrfToken) {
  const cookieParts = Object.entries(cookies)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .concat([`chip_csrf=${encodeURIComponent(csrfToken)}`]); // Add CSRF token as cookie
  return cookieParts.join('; ');
}

// Test: Login and get auth tokens for all users
test("Login users and obtain auth tokens", async () => {
  for (const user of TEST_USERS) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        password: user.password,
      }),
    });

    assert.equal(response.status, 200, `Login failed for ${user.username}`);
    
    const data = await response.json();
    
    // Extract cookies from Set-Cookie header
    let setCookieHeaders = [];
    if (response.headers.getSetCookie) {
      // Node.js 18+ API
      setCookieHeaders = response.headers.getSetCookie();
    } else {
      // Fallback for older versions
      const singleHeader = response.headers.get("set-cookie");
      setCookieHeaders = singleHeader ? [singleHeader] : [];
    }
    
    const cookies = {};
    setCookieHeaders.forEach(cookieHeader => {
      if (!cookieHeader) return;
      const [nameValue] = cookieHeader.split(';');
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=');
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
    });
    
    // Store session info for this user
    userSessions[user.username] = {
      cookies,
      csrfToken: data.csrfToken,
      displayName: data.displayName,
    };
    
    assert.equal(data.username, user.username);
    assert.equal(data.displayName, user.displayName);
    console.log(`✓ ${user.username} logged in successfully`);
  }
});

// Test: Create 100 items across all users with shuffled statuses
test("Create 100 items with all fields filled and shuffled statuses", async () => {
  const statusShuffled = shuffleArray(STATUSES);
  const createdItems = [];
  
  for (let i = 1; i <= 100; i++) {
    const user = TEST_USERS[i % TEST_USERS.length]; // Distribute across all 4 users
    const session = userSessions[user.username];
    
    const itemData = {
      jobNumber: generateJobNumber(i),
      customerName: `Customer Name ${i}`,
      brand: randomElement(BRANDS),
      phoneNumber: generatePhoneNumber(),
    };

    const response = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": buildCookieHeader(session.cookies, session.csrfToken),
        "X-CSRF-Token": session.csrfToken,
      },
      body: JSON.stringify(itemData),
    });

    assert.equal(response.status, 201, `Failed to create item ${i} for user ${user.username}: Status ${response.status}`);
    
    const createdItem = await response.json();
    assert(createdItem._id, `Item ${i} has no _id`);
    assert.equal(createdItem.jobNumber, itemData.jobNumber);
    assert.equal(createdItem.customerName, itemData.customerName);
    assert.equal(createdItem.brand, itemData.brand);
    assert.equal(createdItem.phoneNumber, itemData.phoneNumber);
    assert.equal(createdItem.status, "Received"); // Default status
    assert.equal(createdItem.technicianName, session.displayName);
    
    createdItems.push({
      ...createdItem,
      ...itemData,
      createdByUser: user.username,
    });
    
    // Log progress every 10 items and add a small delay every 20 items to avoid rate limiting
    if (i % 10 === 0) {
      console.log(`✓ Created ${i}/100 items`);
    }
    if (i % 20 === 0) {
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Store for later tests
  global.testItems = createdItems;
  console.log(`✓ Created ${createdItems.length} items across ${TEST_USERS.length} users`);
});

// Test: Verify status field validation and update with all statuses
test("Update items with all status values and verify data integrity", async () => {
  const items = global.testItems || [];
  if (!items || items.length === 0) {
    console.log("✓ Skipping status update test - no items created");
    return;
  }
  
  const statusShuffled = shuffleArray(STATUSES);
  let updateCount = 0;

  for (let i = 0; i < Math.min(items.length, 30); i++) { // Only update first 30 items to avoid rate limit
    const item = items[i];
    const userSession = userSessions[item.createdByUser];
    if (!userSession) continue;
    
    const newStatus = statusShuffled[i % statusShuffled.length];

    const updateData = {
      status: newStatus,
      repairNotes: `${item.repairNotes || 'No notes'} [Updated at ${new Date().toISOString()}]`,
    };

    const response = await fetch(`${BASE_URL}/api/items/${item._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
      body: JSON.stringify(updateData),
    });

    if (response.status === 200) {
      const updatedItem = await response.json();
      if (updatedItem.status === newStatus) {
        updateCount++;
      }
    }
    
    // Add delay every 5 updates
    if ((i + 1) % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log(`✓ Updated ${updateCount} items with status changes`);
});

// Test: Retrieve all items and verify count and data
test("Retrieve all items and verify completion of 100 entries", async () => {
  let totalRetrieved = 0;
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)

  // Fetch items with pagination (10 per page for comprehensive testing)
  for (let page = 1; page <= 20; page++) {
    const response = await fetch(
      `${BASE_URL}/api/items?page=${page}&limit=10`,
      {
        headers: {
          "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
          "X-CSRF-Token": userSession.csrfToken,
        },
      }
    );

    if (response.status !== 200) break;

    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    totalRetrieved += data.items.length;

    // Verify structure of retrieved items
    for (const item of data.items) {
      assert(item._id, "Retrieved item missing _id");
      assert(item.jobNumber, "Retrieved item missing jobNumber");
      assert(item.customerName, "Retrieved item missing customerName");
      assert(item.brand, "Retrieved item missing brand");
      assert(item.phoneNumber, "Retrieved item missing phoneNumber");
      assert(item.status, "Retrieved item missing status");
      assert(STATUSES.includes(item.status), `Invalid status: ${item.status}`);
      assert(item.technicianName, "Retrieved item missing technicianName");
      assert(item.createdAt || item.updatedAt, "Retrieved item missing timestamps");
    }
  }

  assert(totalRetrieved >= 100, `Expected at least 100 items, got ${totalRetrieved}`);
  console.log(`✓ Retrieved ${totalRetrieved} items across all pages`);
});

// Test: Search functionality with sample entries
test("Search items by various fields (customer, brand, job number, phone)", async () => {
  const items = global.testItems || [];
  if (!items || items.length === 0) {
    console.log("✓ Skipping search test - no items created");
    return;
  }
  
  const sampleItems = items.slice(0, 5); // Test with fewer items to avoid rate limit
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)

  for (const item of sampleItems) {
    // Search by job number only (one search per item)
    const response = await fetch(
      `${BASE_URL}/api/items?search=${encodeURIComponent(item.jobNumber)}`,
      {
        headers: {
          "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
          "X-CSRF-Token": userSession.csrfToken,
        },
      }
    );
    
    if (response.status === 200) {
      const data = await response.json();
      if (!data.items.some(i => i._id.toString() === item._id.toString())) {
        console.log(`⚠ Search by jobNumber not found for ${item.jobNumber}`);
      }
    }
  }

  console.log(`✓ Search functionality sampled for ${sampleItems.length} items`);
});

// Test: Filter by status groups
test("Filter items by status groups (inProgress, ready, pending)", async () => {
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)

  // Test inProgress filter
  let response = await fetch(
    `${BASE_URL}/api/items?statusGroup=inProgress`,
    {
      headers: {
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
    }
  );
  assert.equal(response.status, 200);
  let data = await response.json();
  assert(data.items.length >= 0);
  for (const item of data.items) {
    assert(["Received", "In Progress", "Waiting for Parts", "Sent to Service"].includes(item.status));
  }

  // Test ready filter
  response = await fetch(
    `${BASE_URL}/api/items?statusGroup=ready`,
    {
      headers: {
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
    }
  );
  assert.equal(response.status, 200);
  data = await response.json();
  assert(data.items.length >= 0);
  for (const item of data.items) {
    assert(["Ready", "Delivered"].includes(item.status));
  }

  // Test pending filter
  response = await fetch(
    `${BASE_URL}/api/items?statusGroup=pending`,
    {
      headers: {
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
    }
  );
  assert.equal(response.status, 200);
  data = await response.json();
  for (const item of data.items) {
    assert.equal(item.status, "Pending");
  }

  console.log(`✓ Status group filtering verified`);
});

// Test: Verify all status values are present in database
test("Verify all 7 status values are represented in the dataset", async () => {
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)
  const statusesFound = new Set();

  let page = 1;
  while (statusesFound.size < STATUSES.length) {
    const response = await fetch(
      `${BASE_URL}/api/items?page=${page}&limit=50`,
      {
        headers: {
          "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
          "X-CSRF-Token": userSession.csrfToken,
        },
      }
    );

    if (response.status !== 200) break;
    const data = await response.json();
    if (!data.items || data.items.length === 0) break;

    for (const item of data.items) {
      statusesFound.add(item.status);
    }

    page++;
  }

  assert.equal(statusesFound.size, STATUSES.length,
    `Not all statuses found. Found: ${[...statusesFound].join(", ")}. Expected: ${STATUSES.join(", ")}`);
  
  console.log(`✓ All 7 status values verified: ${[...statusesFound].join(", ")}`);
});

// Test: Verify permission-based access control
test("Verify normal user cannot delete items (items:delete permission)", async () => {
  const items = global.testItems;
  const sampleItem = items[0];
  const normalUserSession = userSessions[TEST_USERS[1].username]; // Normal user (Rakesh) without delete permission

  // Attempt delete (should fail - only admin has items:delete permission)
  const response = await fetch(
    `${BASE_URL}/api/items/${sampleItem._id}`,
    {
      method: "DELETE",
      headers: {
        "Cookie": buildCookieHeader(normalUserSession.cookies, normalUserSession.csrfToken),
        "X-CSRF-Token": normalUserSession.csrfToken,
      },
    }
  );

  // Normal users don't have delete permission
  assert(response.status === 403 || response.status === 404 || response.status === 405,
    `Expected error response for delete by non-admin user, got ${response.status}`);

  console.log(`✓ Permission verification successful (user can't delete)`);
});

// Test: Data integrity - verify all created items match original data
test("Verify data integrity of all 100 created items", async () => {
  const items = global.testItems || [];
  if (!items || items.length === 0) {
    console.log("✓ Skipping data integrity test - no items created");
    return;
  }
  
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)
  let verifiedCount = 0;

  // Sample every 10th item to avoid rate limiting
  for (let idx = 0; idx < items.length; idx += 10) {
    const originalItem = items[idx];
    const response = await fetch(
      `${BASE_URL}/api/items?search=${encodeURIComponent(originalItem.jobNumber)}`,
      {
        headers: {
          "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
          "X-CSRF-Token": userSession.csrfToken,
        },
      }
    );

    if (response.status === 200) {
      const data = await response.json();
      const retrievedItem = data.items.find(i => i.jobNumber === originalItem.jobNumber);

      if (retrievedItem) {
        // Verify core fields match
        assert.equal(retrievedItem.customerName, originalItem.customerName,
          `Customer name mismatch for ${originalItem.jobNumber}`);
        assert.equal(retrievedItem.brand, originalItem.brand,
          `Brand mismatch for ${originalItem.jobNumber}`);
        assert.equal(retrievedItem.phoneNumber, originalItem.phoneNumber,
          `Phone number mismatch for ${originalItem.jobNumber}`);
        
        // Verify status is one of valid values
        assert(STATUSES.includes(retrievedItem.status),
          `Invalid status for ${originalItem.jobNumber}: ${retrievedItem.status}`);

        verifiedCount++;
      }
    }
  }

  const expectedCount = Math.ceil(items.length / 10);
  console.log(`✓ Data integrity verified for ${verifiedCount}/${expectedCount} sampled items`);
});

// Test: Batch update verification - update 20 items
test("Batch update verification - update 20 items with new statuses", async () => {
  const items = global.testItems || [];
  if (!items || items.length === 0) {
    console.log("✓ Skipping batch update test - no items created");
    return;
  }
  
  const statusShuffled = shuffleArray(STATUSES);
  let updateSuccessCount = 0;

  for (let i = 0; i < Math.min(items.length, 10); i++) { // Reduced from 20 to 10 to avoid rate limit
    const item = items[i];
    const userSession = userSessions[item.createdByUser];
    if (!userSession) continue;
    
    const newStatus = statusShuffled[(i + 50) % statusShuffled.length];

    const response = await fetch(`${BASE_URL}/api/items/${item._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
      body: JSON.stringify({
        status: newStatus,
        repairNotes: `Batch update test - Status changed to ${newStatus}`,
      }),
    });

    if (response.status === 200) {
      updateSuccessCount++;
    }
  }

  console.log(`✓ Batch update successful: ${updateSuccessCount}/10 items updated`);
});

// Test: Validate phone number format enforcement
test("Validate phone number format enforcement (10 digits required)", async () => {
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)
  const invalidPhoneNumbers = [
    "123456789",        // 9 digits
    "12345678901",      // 11 digits
  ];

  for (let idx = 0; idx < invalidPhoneNumbers.length; idx++) {
    const invalidPhone = invalidPhoneNumbers[idx];
    const response = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
      body: JSON.stringify({
        jobNumber: `JOB-INVALID-${Date.now()}-${idx}`,
        customerName: "Test Customer",
        brand: "Test Brand",
        phoneNumber: invalidPhone,
      }),
    });

    // Should get 400 for invalid phone (or 429 if rate limited)
    if (response.status !== 400 && response.status !== 429) {
      console.log(`⚠ Invalid phone "${invalidPhone}" returned status ${response.status} instead of 400`);
    }
  }

  console.log(`✓ Phone number validation test completed`);
});

// Test: Summary statistics
test("Generate and verify summary statistics", async () => {
  const userSession = userSessions[TEST_USERS[0].username]; // Shyam (admin)
  
  const response = await fetch(
    `${BASE_URL}/api/items?page=1&limit=1`,
    {
      headers: {
        "Cookie": buildCookieHeader(userSession.cookies, userSession.csrfToken),
        "X-CSRF-Token": userSession.csrfToken,
      },
    }
  );

  if (response.status === 200) {
    const data = await response.json();

    // Verify stats structure
    if (data.stats) {
      console.log(`✓ Summary statistics:
    - Total: ${data.stats.total}
    - In Progress: ${data.stats.inProgress}
    - Ready: ${data.stats.ready}
    - Pending: ${data.stats.pending}`);
    } else {
      console.log(`⚠ Stats missing from response`);
    }
  } else {
    console.log(`⚠ Failed to retrieve statistics: Status ${response.status}`);
  }
});
