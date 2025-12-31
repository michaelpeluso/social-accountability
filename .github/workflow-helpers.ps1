# GitHub Workflow Automation Scripts
# Add these to your PowerShell profile for instant access

# Quick issue creation
function New-GitHubIssue {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Title,
        [string]$Body = "",
        [string]$Label = "",
        [switch]$AssignMe
    )
    
    $cmd = "gh issue create --title '$Title' --body '$Body'"
    if ($Label) { $cmd += " --label $Label" }
    if ($AssignMe) { $cmd += " --assignee '@me'" }
    
    Invoke-Expression $cmd
}

# Quick PR creation
function New-GitHubPR {
    param(
        [switch]$Fill,
        [switch]$AssignMe
    )
    
    $cmd = "gh pr create"
    if ($Fill) { $cmd += " --fill" }
    if ($AssignMe) { $cmd += " --assignee '@me'" }
    
    Invoke-Expression $cmd
}

# Quick merge
function Merge-GitHubPR {
    param(
        [int]$Number,
        [switch]$DeleteBranch = $true
    )
    
    $cmd = "gh pr merge $Number --squash"
    if ($DeleteBranch) { $cmd += " --delete-branch" }
    
    Invoke-Expression $cmd
}

# Complete workflow: issue → branch → work
function Start-Feature {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Title,
        [string]$Body = "",
        [string]$Label = ""
    )
    
    Write-Host "Creating issue..." -ForegroundColor Yellow
    $issue = New-GitHubIssue -Title $Title -Body $Body -Label $Label -AssignMe
    
    if ($issue -match '#(\d+)') {
        $issueNumber = $Matches[1]
        Write-Host "Issue #$issueNumber created!" -ForegroundColor Green
        
        Write-Host "Creating branch..." -ForegroundColor Yellow
        gh issue develop $issueNumber --checkout
        
        Write-Host "`nReady to code! When done:" -ForegroundColor Cyan
        Write-Host "  1. git add . && git commit -m 'feat: description (closes #$issueNumber)'" -ForegroundColor Gray
        Write-Host "  2. git push" -ForegroundColor Gray
        Write-Host "  3. New-GitHubPR -Fill -AssignMe" -ForegroundColor Gray
    }
}

# Check CI status
function Get-PRStatus {
    gh pr checks
}

# View current work
function Get-MyWork {
    Write-Host "`n=== My Open Issues ===" -ForegroundColor Cyan
    gh issue list --assignee @me --state open
    
    Write-Host "`n=== My Open PRs ===" -ForegroundColor Cyan
    gh pr list --author @me --state open
}

# Quick commit with hooks
function Commit-Feature {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [int]$Closes
    )
    
    git add .
    
    if ($Closes) {
        git commit -m "$Message (closes #$Closes)"
    } else {
        git commit -m $Message
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nCommit successful! Push when ready:" -ForegroundColor Green
        Write-Host "  git push" -ForegroundColor Gray
    }
}

# Aliases for quick access
Set-Alias -Name ghi -Value New-GitHubIssue
Set-Alias -Name ghpr -Value New-GitHubPR
Set-Alias -Name ghm -Value Merge-GitHubPR
Set-Alias -Name ghst -Value Get-PRStatus
Set-Alias -Name work -Value Get-MyWork
Set-Alias -Name feat -Value Start-Feature
Set-Alias -Name done -Value Commit-Feature

Write-Host "GitHub workflow aliases loaded!" -ForegroundColor Green
Write-Host "Try: feat 'Add habit form' -Label M2" -ForegroundColor Cyan
