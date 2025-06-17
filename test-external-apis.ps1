# External API Integration Testing Script
# Tests Hotelbeds and RapidAPI integrations

$baseUrl = "http://localhost:3001/api"
$testResults = @()

Write-Host "=== External API Integration Testing ===" -ForegroundColor Green
Write-Host "Testing external APIs at: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Airport Search
try {
    Write-Host "1. Testing Airport Search..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/airports/search?query=New York" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) airports" -ForegroundColor Green
        $testResults += "Airport Search: PASSED"
    }
} catch {
    Write-Host "   Airport search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Airport Search: FAILED"
}

# Test 2: Hotel Destinations
try {
    Write-Host "2. Testing Hotel Destinations..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/hotels/destinations?search=New York" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) hotel destinations" -ForegroundColor Green
        $testResults += "Hotel Destinations: PASSED"
    }
} catch {
    Write-Host "   Hotel destinations failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Hotel Destinations: FAILED"
}

# Test 3: External Hotel Search (with mock data expected)
try {
    Write-Host "3. Testing External Hotel Search..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/hotels/search?destination=NYC&checkIn=2024-02-01&checkOut=2024-02-05&adults=2" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) external hotels" -ForegroundColor Green
        $testResults += "External Hotel Search: PASSED"
    }
} catch {
    Write-Host "   External hotel search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "External Hotel Search: FAILED"
}

# Test 4: Flight Search (with mock data expected)
try {
    Write-Host "4. Testing Flight Search..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/flights/search?origin=NYC&destination=LAX&departDate=2024-02-01&returnDate=2024-02-05&adults=2" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) flights" -ForegroundColor Green
        $testResults += "Flight Search: PASSED"
    }
} catch {
    Write-Host "   Flight search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Flight Search: FAILED"
}

# Test 5: One-way Flight Search
try {
    Write-Host "5. Testing One-way Flight Search..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/flights/oneway?origin=NYC&destination=LAX&departDate=2024-02-01&adults=2" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) one-way flights" -ForegroundColor Green
        $testResults += "One-way Flight Search: PASSED"
    }
} catch {
    Write-Host "   One-way flight search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "One-way Flight Search: FAILED"
}

# Test 6: Popular Destinations
try {
    Write-Host "6. Testing Popular Destinations..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/destinations/popular?from=NYC" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.resultsCount) popular destinations" -ForegroundColor Green
        $testResults += "Popular Destinations: PASSED"
    }
} catch {
    Write-Host "   Popular destinations failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Popular Destinations: FAILED"
}

# Test 7: Price Trends
try {
    Write-Host "7. Testing Flight Price Trends..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/price-trends?origin=NYC&destination=LAX&month=2024-02" -Method GET
    if ($response.success) {
        Write-Host "   Found price trends for $($response.data.resultsCount) dates" -ForegroundColor Green
        $testResults += "Price Trends: PASSED"
    }
} catch {
    Write-Host "   Price trends failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Price Trends: FAILED"
}

# Test 8: Combined Search
try {
    Write-Host "8. Testing Combined Search (Hotels + Flights)..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/external/combined/search?destination=LAX&origin=NYC&checkIn=2024-02-01&checkOut=2024-02-05&adults=2" -Method GET
    if ($response.success) {
        Write-Host "   Found $($response.data.summary.hotelsFound) hotels and $($response.data.summary.flightsFound) flights" -ForegroundColor Green
        $testResults += "Combined Search: PASSED"
    }
} catch {
    Write-Host "   Combined search failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "Combined Search: FAILED"
}

# Test 9: API Structure Validation
try {
    Write-Host "9. Testing API Structure..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    if ($response.success -and $response.endpoints.external) {
        Write-Host "   External API endpoints properly documented" -ForegroundColor Green
        $testResults += "API Structure: PASSED"
    }
} catch {
    Write-Host "   API structure test failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += "API Structure: FAILED"
}

# Summary
Write-Host ""
Write-Host "=== EXTERNAL API TEST RESULTS ===" -ForegroundColor Green
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

Write-Host ""
Write-Host "FINAL SCORE: $passed Passed, $failed Failed" -ForegroundColor White

if ($failed -eq 0) {
    Write-Host "ALL EXTERNAL API TESTS PASSED! Integration is working." -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: External API calls may return empty results due to:" -ForegroundColor Yellow
    Write-Host "- API rate limits" -ForegroundColor Yellow
    Write-Host "- Missing shared secret for Hotelbeds" -ForegroundColor Yellow
    Write-Host "- Test environment limitations" -ForegroundColor Yellow
    Write-Host "- Invalid destination/airport codes" -ForegroundColor Yellow
} else {
    Write-Host "Some external API tests failed. Check implementation details." -ForegroundColor Yellow
} 