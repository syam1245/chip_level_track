# Comprehensive Item Management Test Suite

## Overview

This test suite provides comprehensive testing for the chip-level tracking webapp with 100 test entries. It validates:

- **Data Input**: Creating items via all 4 users
- **Data Retrieval**: Fetching items with pagination and search
- **Status Management**: Testing all 7 status values (shuffled)
- **Permission Controls**: Verifying user roles and permissions
- **Data Integrity**: Validating that data matches expectations
- **Search & Filter**: Testing search by customer, brand, job number, phone
- **Status Group Filtering**: Testing inProgress, ready, and pending filters

## Test Users

The suite uses all 4 configured users:
1. **Shyam (Admin)** - Full permissions (create, read, update, delete)
2. **Rakesh (Normal User)** - Limited permissions (create, read, update)
3. **Akhil (Normal User)** - Limited permissions (create, read, update)
4. **Nabeel (Normal User)** - Limited permissions (create, read, update)

## Test Statuses

All 7 status values are tested and shuffled throughout the test:
- Received
- In Progress
- Waiting for Parts
- Sent to Service
- Ready
- Delivered
- Pending

## Test Entry Details

**100 items** are created with all required fields filled:
- **jobNumber**: Unique identifier (JOB-{timestamp}-{index})
- **customerName**: Customer Name {index}
- **brand**: Random from 10 brands (Apple, Samsung, Google, LG, Sony, Dell, HP, Lenovo, ASUS, Nokia)
- **phoneNumber**: Valid 10-digit phone number
- **status**: Shuffled from all 7 status values
- **repairNotes**: Descriptive notes about the repair needed
- **technicianName**: Automatically set from logged-in user's displayName

## Running the Tests

### Prerequisites

1. **Environment Variables**: Set these before running tests
   ```bash
   # Backend user passwords
   set TECH_PASSWORD_SHYAM=shyamadmin
   set TECH_PASSWORD_RAKESH=rakesh123
   set TECH_PASSWORD_AKHIL=akhil123
   set TECH_PASSWORD_NABEEL=nabeel123
   
   # Test server URL (default: http://localhost:5000)
   set TEST_BASE_URL=http://localhost:5000
   ```

2. **Backend Running**: Ensure your server is running
   ```bash
   cd server
   npm install
   npm start
   ```

3. **Database Ready**: MongoDB should be running and initialized
   ```bash
   # The seed.js will automatically create users on first run
   ```

### Run the Tests

```bash
# Navigate to server directory
cd server

# Run the test suite
npm test -- tests/items.test.js

# Or run with Node.js directly
node --test tests/items.test.js
```

### Expected Output

```
✓ Login users and obtain auth tokens (4 users)
✓ Create 100 items with all fields filled and shuffled statuses
✓ Update items with all status values and verify data integrity
✓ Retrieve all items and verify completion of 100 entries
✓ Search items by various fields (customer, brand, job number, phone)
✓ Filter items by status groups (inProgress, ready, pending)
✓ Verify all 7 status values are represented in the dataset
✓ Verify normal user cannot delete items (items:delete permission)
✓ Verify data integrity of all 100 created items
✓ Batch update verification - update 20 items with new statuses
✓ Validate phone number format enforcement (10 digits required)
✓ Generate and verify summary statistics
```

## Test Details

### Test 1: Login Users
- Authenticates all 4 users
- Verifies credentials are correct
- Stores auth tokens for subsequent requests

### Test 2: Create 100 Items
- Creates 100 items distributed across all 4 users
- Each item has all required fields filled
- Verifies technicianName matches logged-in user's displayName
- Validates status is initially set to "Received"

### Test 3: Update Items with Status Changes
- Updates all 100 items with shuffled statuses
- Verifies status history is tracked
- Validates status changes are persisted

### Test 4: Retrieve All Items
- Tests pagination (10 items per page)
- Verifies all 100+ items are retrievable
- Checks structure of each retrieved item
- Validates all required fields are present

### Test 5: Search Functionality
- Tests text search across multiple fields
- Searches 10 sample items by:
  - Customer name
  - Brand
  - Job number
  - Phone number

### Test 6: Status Group Filtering
- Tests inProgress filter (Received, In Progress, Waiting for Parts, Sent to Service)
- Tests ready filter (Ready, Delivered)
- Tests pending filter (Pending)

### Test 7: Status Value Verification
- Confirms all 7 status values are present in the database
- Ensures no invalid statuses exist

### Test 8: Permission Control
- Verifies normal users cannot delete items
- Confirms only admin (Shyam) has deletion rights

### Test 9: Data Integrity
- Validates all 100 created items
- Verifies core fields match original data
- Ensures no data corruption during retrieval

### Test 10: Batch Updates
- Updates 20 items with new statuses
- Verifies update success rate
- Confirms status changes are persisted

### Test 11: Phone Number Validation
- Tests invalid phone formats are rejected:
  - 9 digits
  - 11 digits
  - Dashes or special characters
  - Letters
  - Empty values

### Test 12: Summary Statistics
- Retrieves and validates stats endpoint
- Verifies total count ≥ 100
- Validates status group counts (inProgress, ready, pending)
- Confirms sums match totals

## Database State After Tests

After running tests:
- **100 items created** across 4 users
- **All 7 statuses represented**
- **Searchable data** with customer names, brands, job numbers, phone numbers
- **Full status history** for each item
- **Valid metadata** (browser, OS, device info)

## Troubleshooting

### "Connection refused" error
- Ensure backend server is running on the configured TEST_BASE_URL
- Check that MongoDB is running

### "Invalid credentials" during login
- Verify environment variables match your configured user passwords
- Check that users exist in the database (seed.js should create them)

### "Phone number must be exactly 10 digits" error
- All test phone numbers are generated as 10 digits
- If custom tests fail, ensure phone numbers are 10 digits

### "Job number already exists" error
- Test job numbers are unique based on timestamp
- Clear items collection before re-running if needed

## Cleanup

To remove test data and revert to clean state:
```bash
# In MongoDB shell or MongoDB Compass
db.items.deleteMany({ "repairNotes": { "$regex": "for comprehensive testing" } })
```

Or delete items created after a specific timestamp:
```bash
db.items.deleteMany({ "createdAt": { "$gt": ISODate("2024-01-01") } })
```

## Next Steps

Consider extending tests with:
- Admin-only operations (delete, backup export)
- Bulk import testing
- Performance testing with larger datasets
- API response time benchmarking
- Concurrent user testing
- Export/backup functionality testing
