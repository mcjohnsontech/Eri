[CmdletBinding()]
param(
  [string]$GatewayUrl = "http://localhost:3000",
  [int]$PollSeconds = 2,
  [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw "ASSERTION FAILED: $Message"
  }
  Write-Host "PASS: $Message" -ForegroundColor Green
}

function Invoke-Api {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,
    [string]$Uri,
    [object]$Body,
    [hashtable]$Headers = @{},
    [int]$ExpectedStatus = 200
  )

  $request = @{
    Method = $Method
    Uri = $Uri
    Headers = $Headers
    ErrorAction = "Stop"
  }
  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
  }

  try {
    $response = Invoke-WebRequest @request
  } catch {
    $status = $null
    if ($null -ne $_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
    }
    throw "HTTP $Method $Uri failed with status $status`: $($_.Exception.Message)"
  }

  Assert-True ([int]$response.StatusCode -eq $ExpectedStatus) `
    "$Method $Uri returned HTTP $ExpectedStatus"

  if ([string]::IsNullOrWhiteSpace($response.Content)) {
    return $null
  }
  return ($response.Content | ConvertFrom-Json)
}

function Invoke-ExpectedFailure {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body,
    [int]$ExpectedStatus
  )

  try {
    Invoke-Api -Method $Method -Uri $Uri -Body $Body -ExpectedStatus $ExpectedStatus | Out-Null
    throw "Expected HTTP $ExpectedStatus from $Method $Uri, but the request succeeded."
  } catch {
    if ($_.Exception.Message -notmatch "HTTP $Method $Uri failed with status $ExpectedStatus") {
      throw
    }
    Write-Host "PASS: $Method $Uri rejected with HTTP $ExpectedStatus" -ForegroundColor Green
  }
}

function New-SignedHeaders([string]$BodyJson) {
  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  $secret = if ($env:WEBHOOK_HMAC_SECRET) { $env:WEBHOOK_HMAC_SECRET } else { "change_me_in_development" }
  $hmac = [System.Security.Cryptography.HMACSHA256]::new(
    [Text.Encoding]::UTF8.GetBytes($secret)
  )
  $digest = [Convert]::ToHexString(
    $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$timestamp.$BodyJson"))
  ).ToLowerInvariant()
  return @{
    "x-eri-timestamp" = $timestamp
    "x-eri-signature" = $digest
  }
}

function Get-CaseUntilTerminal([string]$CaseId) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $case = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/cases/$CaseId"
    Write-Host ("  status={0}, derived_state={1}" -f $case.status, $case.derived_state)
    if ($case.status -in @("CLOSED", "PENDING_HUMAN", "FAILED")) {
      return $case
    }
    Start-Sleep -Seconds $PollSeconds
  } while ((Get-Date) -lt $deadline)
  throw "Case $CaseId did not reach a terminal state within $TimeoutSeconds seconds."
}

Write-Step "Checking gateway health"
$health = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/health"
Assert-True ($health.status -eq "ok") "gateway is healthy"
Assert-True ($health.database -eq "ok") "gateway can reach PostgreSQL"

Write-Step "Checking active policy and metrics endpoints"
$policies = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/policies/active"
Assert-True ($policies.policies.Count -gt 0) "active policy is available"
$metrics = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/metrics/summary"
Assert-True ($null -ne $metrics.total) "metrics summary is available"

Write-Step "Checking simulator health endpoints"
foreach ($port in @(4001, 4002, 4003, 4004)) {
  $simHealth = Invoke-Api -Method GET -Uri "http://localhost:$port/health"
  Assert-True ($simHealth.status -match "OK|ok") "simulator $port is healthy"
}

Write-Step "Checking invalid batch and review requests"
Invoke-ExpectedFailure -Method POST -Uri "$GatewayUrl/v1/batches" -Body @{ refs = @() } -ExpectedStatus 400
Invoke-ExpectedFailure -Method POST -Uri "$GatewayUrl/v1/cases/not-a-case/review" `
  -Body @{ decision = "APPROVED"; reason = ""; reviewer_id = "smoke-test" } -ExpectedStatus 400

Write-Step "Testing HMAC-protected dispute ingestion"
$dispute = @{
  external_id = "SMOKE-TX1004-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
  amount = 50
  currency = "USD"
  reason = "Debit posted but beneficiary was not credited."
  customer_id = "SMOKE-CUSTOMER"
  transaction_ref = "TX1004"
  dispute_ref = "SMOKE-DSP-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
  channel = "smoke-test"
  category_hint = "DEBIT_NO_CREDIT"
}
$disputeJson = $dispute | ConvertTo-Json -Depth 10 -Compress
$headers = New-SignedHeaders -BodyJson $disputeJson
$accepted = Invoke-Api -Method POST -Uri "$GatewayUrl/v1/disputes" -Body $dispute -Headers $headers -ExpectedStatus 202
Assert-True (-not [string]::IsNullOrWhiteSpace($accepted.case_id)) "dispute returned a case id"

Write-Step "Waiting for deterministic confirmed-failure resolution"
$case = Get-CaseUntilTerminal -CaseId $accepted.case_id
Assert-True ($case.status -eq "CLOSED") "confirmed failure case closed automatically"
Assert-True ($case.derived_state -eq "FAILED_REVERSED") "confirmed failure was reversed and verified"

Write-Step "Checking evidence, clocks, audit, and idempotent action result"
$evidence = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/cases/$($accepted.case_id)/evidence"
Assert-True ($evidence.evidence.Count -ge 2) "case contains evidence records"
Assert-True ($evidence.timeline.Count -ge 1) "case contains timeline events"

$clocks = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/cases/$($accepted.case_id)/clocks"
Assert-True ($null -ne $clocks.clocks) "case clocks endpoint is available"

$audit = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/cases/$($accepted.case_id)/audit"
Assert-True ($audit.verification.valid -eq $true) "audit hash chain is valid"
Assert-True ($audit.audit_trail.Count -ge 2) "audit trail contains lifecycle entries"

Write-Step "Testing batch creation and duplicate protection"
$batchRef = "TX1001"
$firstBatch = Invoke-Api -Method POST -Uri "$GatewayUrl/v1/batches" `
  -Body @{ refs = @($batchRef) } -ExpectedStatus 202
$secondBatch = Invoke-Api -Method POST -Uri "$GatewayUrl/v1/batches" `
  -Body @{ refs = @($batchRef) } -ExpectedStatus 202
Assert-True ($firstBatch.status -eq "ACCEPTED") "batch request accepted"
Assert-True ($secondBatch.case_ids.Count -eq 0) "duplicate batch reference was ignored"

Write-Step "Testing review queue endpoint"
$queue = Invoke-Api -Method GET -Uri "$GatewayUrl/v1/review-queue"
Assert-True ($null -ne $queue.cases) "review queue is available"

Write-Host "`nAll Eri smoke tests passed." -ForegroundColor Green
