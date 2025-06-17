# Test Authentication Endpoints

Write-Host "Testing Wanderlust Travel API Authentication" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Test 1: Register new user
Write-Host "`n1. Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "password123"
    firstName = "John"
    lastName = "Doe"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "Registration SUCCESS:" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 3
    $token = $registerResponse.data.token
} catch {
    Write-Host "Registration FAILED:" -ForegroundColor Red
    $_.Exception.Message
}

# Test 2: Login with the same user
Write-Host "`n2. Testing User Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "Login SUCCESS:" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 3
    if (-not $token) { $token = $loginResponse.data.token }
} catch {
    Write-Host "Login FAILED:" -ForegroundColor Red
    $_.Exception.Message
}

# Test 3: Get profile (requires token)
Write-Host "`n3. Testing Get Profile (Protected Route)..." -ForegroundColor Yellow
if ($token) {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method GET -Headers $headers
        Write-Host "Profile SUCCESS:" -ForegroundColor Green
        $profileResponse | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "Profile FAILED:" -ForegroundColor Red
        $_.Exception.Message
    }
} else {
    Write-Host "No token available - skipping profile test" -ForegroundColor Red
}

# Test 4: Try to access profile without token (should fail)
Write-Host "`n4. Testing Protected Route Without Token (should fail)..." -ForegroundColor Yellow
try {
    $noTokenResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method GET
    Write-Host "Unexpected SUCCESS (this should have failed):" -ForegroundColor Red
    $noTokenResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Expected FAILURE (good!):" -ForegroundColor Green
    $_.Exception.Message
}

Write-Host "`nAuthentication testing complete!" -ForegroundColor Green 