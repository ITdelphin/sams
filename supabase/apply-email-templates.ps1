param(
  [Parameter(Mandatory = $true)]
  [string]$SupabaseAccessToken,
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

$api = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"
$headers = @{
  "Authorization" = "Bearer $SupabaseAccessToken"
  "Content-Type" = "application/json"
}

$backupPath = Join-Path $PSScriptRoot "auth-config-backup.json"
Write-Host "Backing up current auth config to $backupPath ..."
Invoke-RestMethod -Method Get -Uri $api -Headers $headers | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $backupPath -Encoding utf8

function Get-Escaped([string]$path) {
  $raw = (Get-Content -LiteralPath $path -Raw).Trim()
  return $raw.Replace('\', '\\').Replace('"', '\"').Replace("`r`n", '\n').Replace("`n", '\n').Replace("`t", '\t')
}

$recoveryEsc = Get-Escaped (Join-Path $PSScriptRoot "email-templates/reset-password.html")
$inviteEsc = Get-Escaped (Join-Path $PSScriptRoot "email-templates/invite-user.html")

$body = '{"mailer_subjects_recovery":"Reset your SAMS password","mailer_templates_recovery_content":"' + $recoveryEsc + '","mailer_subjects_invite":"Your SAMS account is ready","mailer_templates_invite_content":"' + $inviteEsc + '"}'

Write-Host "Applying email templates ..."
$result = Invoke-RestMethod -Method Patch -Uri $api -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

Write-Host "Done. Confirmed values:"
Write-Host "  - subject[recovery]: $($result.mailer_subjects_recovery)"
Write-Host "  - template[recovery] length: $($result.mailer_templates_recovery_content.Length)"
Write-Host "  - subject[invite]:   $($result.mailer_subjects_invite)"
Write-Host "  - template[invite]   length: $($result.mailer_templates_invite_content.Length)"
