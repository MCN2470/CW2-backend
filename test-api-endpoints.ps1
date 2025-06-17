# Wanderlust API Testing Script
# Tests all major endpoints to verify functionality

$baseUrl = "http://localhost:3001/api"
$testResults = @()

Write-Host "=== Wanderlust API Endpoint Testing ===" -ForegroundColor Green
Write-Host "Testing server at: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
try {
    Write-Host "1. Testing Health Check..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    if ($response.status -eq "OK") {
        Write-Host "   ✓ Health check passed" -ForegroundColor Green
        $testResults += "Health Check: PASSED"
    }
} catch {
    Write-Host "   ✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Health Check: FAILED"
}

# Test 2: Get All Hotels
try {
    Write-Host "2. Testing Get All Hotels..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/hotels" -Method GET
    if ($response.success -and $response.data.hotels.Count -gt 0) {
        Write-Host "   ✓ Found $($response.data.hotels.Count) hotels" -ForegroundColor Green
        $testResults += "Get Hotels: PASSED"
    }
} catch {
    Write-Host "   ✗ Get hotels failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Get Hotels: FAILED"
}

# Test 3: Get Hotel by ID
try {
    Write-Host "3. Testing Get Hotel by ID..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/hotels/1" -Method GET
    if ($response.success -and $response.data.id -eq 1) {
        Write-Host "   ✓ Retrieved hotel: $($response.data.name)" -ForegroundColor Green
        $testResults += "Get Hotel by ID: PASSED"
    }
} catch {
    Write-Host "   ✗ Get hotel by ID failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Get Hotel by ID: FAILED"
}

# Test 4: User Registration
try {
    Write-Host "4. Testing User Registration..." -ForegroundColor Cyan
    $registerBody = @{
        username = "apitest$(Get-Random)"
        email = "apitest$(Get-Random)@example.com"
        password = "testpass123"
        firstName = "API"
        lastName = "Test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✓ User registration successful" -ForegroundColor Green
        $testResults += "User Registration: PASSED"
        $testEmail = ($registerBody | ConvertFrom-Json).email
    }
} catch {
    Write-Host "   ✗ User registration failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "User Registration: FAILED"
    $testEmail = "test@example.com"  # Fallback to existing user
}

# Test 5: User Login
try {
    Write-Host "5. Testing User Login..." -ForegroundColor Cyan
    $loginBody = @{
        email = $testEmail
        password = "testpass123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    if ($response.success -and $response.data.token) {
        Write-Host "   ✓ Login successful, JWT token received" -ForegroundColor Green
        $testResults += "User Login: PASSED"
        $authToken = $response.data.token
    }
} catch {
    Write-Host "   ✗ User login failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "User Login: FAILED"
}

# Test 6: Protected Route (Get Profile)
if ($authToken) {
    try {
        Write-Host "6. Testing Protected Route (Get Profile)..." -ForegroundColor Cyan
        $headers = @{ Authorization = "Bearer $authToken" }
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET -Headers $headers
        if ($response.success -and $response.data.user) {
            Write-Host "   ✓ Profile access successful for user: $($response.data.user.username)" -ForegroundColor Green
            $testResults += "Protected Route: PASSED"
        }
    } catch {
        Write-Host "   ✗ Protected route failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "Protected Route: FAILED"
    }
} else {
    Write-Host "6. Skipping Protected Route Test (no auth token)" -ForegroundColor Yellow
    $testResults += "Protected Route: SKIPPED"
}

# Test 7: Hotel Search with Filter
try {
    Write-Host "7. Testing Hotel Search with Price Filter..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/hotels?limit=5&sortBy=price" -Method GET
    if ($response.success) {
        Write-Host "   ✓ Hotel search completed, found $($response.data.hotels.Count) results" -ForegroundColor Green
        $testResults += "Hotel Search: PASSED"
    }
} catch {
    Write-Host "   ✗ Hotel search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Hotel Search: FAILED"
}

# Test 8: Booking Endpoints (if authenticated)
if ($authToken) {
    try {
        Write-Host "8. Testing Get My Bookings..." -ForegroundColor Cyan
        $headers = @{ Authorization = "Bearer $authToken" }
        $response = Invoke-RestMethod -Uri "$baseUrl/bookings/my" -Method GET -Headers $headers
        if ($response.success) {
            Write-Host "   ✓ Bookings retrieved: $($response.data.pagination.totalItems) bookings" -ForegroundColor Green
            $testResults += "Get Bookings: PASSED"
        }
    } catch {
        Write-Host "   ✗ Get bookings failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "Get Bookings: FAILED"
    }
} else {
    Write-Host "8. Skipping Booking Test (no auth token)" -ForegroundColor Yellow
    $testResults += "Get Bookings: SKIPPED"
}

# Summary
Write-Host ""
Write-Host "=== TEST RESULTS SUMMARY ===" -ForegroundColor Green
Write-Host ""
foreach ($result in $testResults) {
    if ($result -like "*PASSED*") {
        Write-Host "   $result" -ForegroundColor Green
    } elseif ($result -like "*FAILED*") {
        Write-Host "   $result" -ForegroundColor Red
    } else {
        Write-Host "   $result" -ForegroundColor Yellow
    }
}

$passed = ($testResults | Where-Object { $_ -like "*PASSED*" }).Count
$failed = ($testResults | Where-Object { $_ -like "*FAILED*" }).Count
$skipped = ($testResults | Where-Object { $_ -like "*SKIPPED*" }).Count

Write-Host ""
Write-Host "FINAL SCORE: $passed Passed, $failed Failed, $skipped Skipped" -ForegroundColor White
if ($failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! API is working correctly." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the output above for details." -ForegroundColor Yellow
} 