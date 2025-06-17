# Wanderlust Travel API - Hotel Endpoints Test Script
Write-Host "Testing Wanderlust Hotel API..." -ForegroundColor Green

$baseUrl = "http://localhost:3001/api"

# Test 1: API Health Check
Write-Host "`n1. Testing API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ API Health: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Health failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get All Hotels (Public)
Write-Host "`n2. Testing Get All Hotels..." -ForegroundColor Yellow
try {
    $hotels = Invoke-RestMethod -Uri "$baseUrl/hotels" -Method GET
    Write-Host "✅ Found $($hotels.data.pagination.totalItems) hotels" -ForegroundColor Green
    
    if ($hotels.data.hotels.Count -gt 0) {
        $firstHotel = $hotels.data.hotels[0]
        Write-Host "   First hotel: $($firstHotel.name) in $($firstHotel.city)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Get hotels failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Search Hotels by City
Write-Host "`n3. Testing Hotel Search by City..." -ForegroundColor Yellow
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/hotels?city=New York" -Method GET
    Write-Host "✅ Found $($searchResults.data.pagination.totalItems) hotels in New York" -ForegroundColor Green
} catch {
    Write-Host "❌ Hotel search failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Hotel Details (if hotels exist)
if ($hotels.data.hotels.Count -gt 0) {
    Write-Host "`n4. Testing Get Hotel Details..." -ForegroundColor Yellow
    try {
        $hotelId = $hotels.data.hotels[0].id
        $hotelDetails = Invoke-RestMethod -Uri "$baseUrl/hotels/$hotelId" -Method GET
        Write-Host "✅ Hotel details retrieved: $($hotelDetails.data.name)" -ForegroundColor Green
        Write-Host "   Rating: $($hotelDetails.data.starRating) stars, Price: $($hotelDetails.data.pricePerNight) $($hotelDetails.data.currency)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Get hotel details failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Check Room Availability
if ($hotels.data.hotels.Count -gt 0) {
    Write-Host "`n5. Testing Room Availability Check..." -ForegroundColor Yellow
    try {
        $hotelId = $hotels.data.hotels[0].id
        $checkIn = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
        $checkOut = (Get-Date).AddDays(10).ToString("yyyy-MM-dd")
        
        $availability = Invoke-RestMethod -Uri "$baseUrl/hotels/$hotelId/availability?checkInDate=$checkIn&checkOutDate=$checkOut&rooms=1" -Method GET
        Write-Host "✅ Availability check: $($availability.message)" -ForegroundColor Green
        Write-Host "   Available rooms: $($availability.data.availableRooms), Total price: $($availability.data.totalPrice) $($availability.data.currency)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Availability check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test Advanced Search
Write-Host "`n6. Testing Advanced Hotel Search..." -ForegroundColor Yellow
try {
    $advancedSearch = Invoke-RestMethod -Uri "$baseUrl/hotels?minPrice=100&maxPrice=500&minStarRating=4&sortBy=price&sortOrder=asc" -Method GET
    Write-Host "✅ Advanced search found $($advancedSearch.data.pagination.totalItems) hotels" -ForegroundColor Green
} catch {
    Write-Host "❌ Advanced search failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Hotel API testing completed!" -ForegroundColor Green
Write-Host "📝 Note: Authentication required endpoints (create/update/delete) require admin login" -ForegroundColor Yellow 