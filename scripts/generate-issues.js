#!/usr/bin/env node

/**
 * Generate GitHub issues from milestone spec files
 * 
 * Usage:
 *   node scripts/generate-issues.js [milestone]
 *   
 * Examples:
 *   node scripts/generate-issues.js M1          # Generate M1 issues only
 *   node scripts/generate-issues.js --all       # Generate all milestone issues
 *   node scripts/generate-issues.js --dry-run   # Preview without creating
 *   node scripts/generate-issues.js M1 --force  # Update existing issues in-place
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const MILESTONES = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5'];
const SPEC_DIR = path.join(__dirname, '../docs/milestones');
const LABEL_DEFINITIONS = {
  'user-story': {
    color: '0E8A16',
    description: 'Auto-generated user story from milestone spec'
  },
  m0: { color: '1F77B4', description: 'Milestone M0: Foundation' },
  m1: { color: 'FF7F0E', description: 'Milestone M1: Account & Privacy' },
  m2: { color: '2CA02C', description: 'Milestone M2: Habits & Tracking' },
  m3: { color: 'D62728', description: 'Milestone M3: Social' },
  m4: { color: '9467BD', description: 'Milestone M4: Identity & Analytics' },
  m5: { color: '8C564B', description: 'Milestone M5: Future' }
};

const MILESTONE_METADATA = {
  M0: { title: 'M0 - Foundation', description: 'Milestone M0: Foundation scope' },
  M1: { title: 'M1 - Account & Privacy', description: 'Milestone M1: Account setup, friends, privacy' },
  M2: { title: 'M2 - Habits & Tracking', description: 'Milestone M2: Goals, habits, streaks, dashboard' },
  M3: { title: 'M3 - Social', description: 'Milestone M3: Feed, posts, reactions, nudges' },
  M4: { title: 'M4 - Identity & Analytics', description: 'Milestone M4: Identities, journal, analytics' },
  M5: { title: 'M5 - Future', description: 'Milestone M5: Future roadmap experiments' }
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Spec directory not found at ${dirPath}. Run this script from the repository root.`);
    process.exit(1);
  }
}

function ensureGhCliAvailable() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('GitHub CLI (gh) is required. Install it from https://cli.github.com/.');
    process.exit(1);
  }
}

function ensureGhAuthenticated() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch (error) {
    console.error('GitHub CLI is not authenticated. Run `gh auth login` and try again.');
    process.exit(1);
  }
}

function getRepoSlug() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/[:/]([^/]+\/[^/]+?)(\.git)?$/);
    if (!match) {
      throw new Error(`Cannot parse repository from remote URL: ${remoteUrl}`);
    }
    return match[1].replace(/\.git$/, '');
  } catch (error) {
    console.error('Unable to determine git remote. Ensure this repo has an "origin" remote.');
    process.exit(1);
  }
}

function loadExistingIssues() {
  try {
    const output = execSync('gh issue list --state all --label user-story --limit 500 --json number,title', {
      encoding: 'utf-8'
    });
    const issues = JSON.parse(output);
    const issueMap = new Map();
    issues.forEach(issue => {
      if (!issue.title) return;
      const match = issue.title.match(/\[(M\d+-\d+\.\d+)\]/i);
      if (match) {
        issueMap.set(match[1].toUpperCase(), { number: issue.number, title: issue.title });
      }
    });
    return issueMap;
  } catch (error) {
    console.error('Failed to load existing issues. Run `gh auth login` and ensure you have access.');
    process.exit(1);
  }
}

function loadExistingLabels(repoSlug) {
  try {
    const output = execSync(`gh label list --repo ${repoSlug} --limit 200 --json name,color,description`, { encoding: 'utf-8' });
    const labels = JSON.parse(output) || [];
    const labelMap = new Map();
    labels.forEach(label => {
      labelMap.set(label.name.toLowerCase(), {
        name: label.name,
        color: (label.color || '').toUpperCase(),
        description: label.description || ''
      });
    });
    return labelMap;
  } catch (error) {
    console.error('Failed to load repository labels. Ensure `gh` has repo scope.');
    process.exit(1);
  }
}

function ensureProjectLabels(repoSlug, labelMap) {
  Object.entries(LABEL_DEFINITIONS).forEach(([label, meta]) => {
    const existing = labelMap.get(label);
    if (!existing) {
      try {
        execSync(
          `gh label create "${label}" --color ${meta.color} --description "${meta.description}" --repo ${repoSlug}`,
          { stdio: 'inherit' }
        );
        labelMap.set(label, { name: label, color: meta.color, description: meta.description });
      } catch (error) {
        const message = error.stderr ? error.stderr.toString() : '';
        if (message.includes('already exists')) {
          labelMap.set(label, { name: label, color: meta.color, description: meta.description });
          return;
        }
        console.error(`Failed to create label ${label}: ${error.message}`);
        process.exit(1);
      }
      return;
    }

    const currentColor = (existing.color || '').toUpperCase();
    const currentDescription = (existing.description || '').trim();
    const desiredDescription = meta.description.trim();

    if (currentColor === meta.color && currentDescription === desiredDescription) {
      return;
    }

    try {
      execSync(
        `gh label edit "${existing.name}" --color ${meta.color} --description "${meta.description}" --repo ${repoSlug}`,
        { stdio: 'inherit' }
      );
      labelMap.set(label, { name: existing.name, color: meta.color, description: meta.description });
    } catch (error) {
      console.error(`Failed to update label ${existing.name}: ${error.message}`);
      process.exit(1);
    }
  });
}

function loadExistingMilestones(repoSlug) {
  try {
    const output = execSync(`gh api repos/${repoSlug}/milestones?state=all`, { encoding: 'utf-8' });
    const milestones = JSON.parse(output) || [];
    const map = new Map();
    milestones.forEach(milestone => {
      map.set(milestone.title, {
        number: milestone.number,
        state: milestone.state,
        description: milestone.description || ''
      });
    });
    return map;
  } catch (error) {
    console.error('Failed to load repository milestones. Ensure `gh` has repo scope.');
    process.exit(1);
  }
}

function ensureRepoMilestones(repoSlug, existingMilestones) {
  const resultMap = new Map();
  Object.entries(MILESTONE_METADATA).forEach(([key, meta]) => {
    const current = existingMilestones.get(meta.title);
    if (!current) {
      try {
        const output = execSync(
          `gh api repos/${repoSlug}/milestones -f title="${meta.title}" -f description="${meta.description}" -f state=open`,
          { encoding: 'utf-8' }
        );
        const created = JSON.parse(output);
        resultMap.set(key, { number: created.number, title: meta.title });
      } catch (error) {
        console.error(`Failed to create milestone ${meta.title}: ${error.message}`);
        process.exit(1);
      }
      return;
    }

    // Update description if missing/mismatched
    const currentDescription = (current.description || '').trim();
    const desiredDescription = (meta.description || '').trim();
    if (currentDescription !== desiredDescription) {
      try {
        execSync(
          `gh api repos/${repoSlug}/milestones/${current.number} -X PATCH -f description="${meta.description}"`,
          { stdio: 'ignore' }
        );
      } catch (error) {
        console.error(`Failed to update milestone ${meta.title}: ${error.message}`);
        process.exit(1);
      }
    }
    // Ensure milestone open
    if (current.state !== 'open') {
      try {
        execSync(
          `gh api repos/${repoSlug}/milestones/${current.number} -X PATCH -f state=open`,
          { stdio: 'ignore' }
        );
      } catch (error) {
        console.error(`Failed to reopen milestone ${meta.title}: ${error.message}`);
        process.exit(1);
      }
    }
    resultMap.set(key, { number: current.number, title: meta.title });
  });
  return resultMap;
}

function withTempBodyFile(bodyContent, callback) {
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  const tempPath = path.join(os.tmpdir(), `issue-body-${id}.md`);
  fs.writeFileSync(tempPath, bodyContent, 'utf-8');
  try {
    return callback(tempPath);
  } finally {
    try {
      fs.unlinkSync(tempPath);
    } catch (error) {
      // ignore cleanup errors
    }
  }
}

// Parse milestone file to extract user stories
function parseMilestoneFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const milestone = fileName.split('-')[0].toUpperCase(); // M0, M1, etc.
  
  const stories = [];
  const lines = content.split('\n');
  
  let currentStory = null;
  let inAcceptanceCriteria = false;
  let inTechnicalReqs = false;
  let inPrivacyNotes = false;
  let inSecurityNotes = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match user story headers: ### X.Y Story Title
    const storyMatch = line.match(/^### (\d+\.\d+) (.+)$/);
    if (storyMatch) {
      if (currentStory) {
        stories.push(currentStory);
      }
      
      currentStory = {
        id: `${milestone}-${storyMatch[1]}`,
        milestone,
        number: storyMatch[1],
        title: storyMatch[2],
        description: '',
        acceptanceCriteria: [],
        technicalReqs: [],
        privacyNotes: [],
        securityNotes: [],
        apiContract: '',
        cost: '',
        labels: [milestone.toLowerCase(), 'user-story']
      };
      
      inAcceptanceCriteria = false;
      inTechnicalReqs = false;
      inPrivacyNotes = false;
      inSecurityNotes = false;
      continue;
    }
    
    if (!currentStory) continue;
    
    // Extract story description (first paragraph after story header)
    if (line.startsWith('**Story:**')) {
      currentStory.description = line.replace('**Story:**', '').trim();
      continue;
    }
    
    // Start of acceptance criteria
    if (line.startsWith('**Acceptance Criteria:**')) {
      inAcceptanceCriteria = true;
      inTechnicalReqs = false;
      continue;
    }
    
    // Start of technical requirements
    if (line.startsWith('**Technical Requirements:**')) {
      inTechnicalReqs = true;
      inAcceptanceCriteria = false;
      inPrivacyNotes = false;
      inSecurityNotes = false;
      continue;
    }
    
    // Start of privacy notes
    if (line.startsWith('**Privacy Notes:**')) {
      inPrivacyNotes = true;
      inAcceptanceCriteria = false;
      inTechnicalReqs = false;
      inSecurityNotes = false;
      continue;
    }
    
    // Start of security notes
    if (line.startsWith('**Security Notes:**')) {
      inSecurityNotes = true;
      inAcceptanceCriteria = false;
      inTechnicalReqs = false;
      inPrivacyNotes = false;
      continue;
    }
    
    // Extract cost
    if (line.startsWith('**Cost:**')) {
      currentStory.cost = line.replace('**Cost:**', '').trim();
      continue;
    }
    
    // End sections on next bold header
    if (line.startsWith('**') && !line.startsWith('**Story:**')) {
      inAcceptanceCriteria = false;
      inTechnicalReqs = false;
      inPrivacyNotes = false;
      inSecurityNotes = false;
    }
    
    // Collect acceptance criteria
    if (inAcceptanceCriteria && line.match(/^- \[ \]/)) {
      const criterion = line.replace(/^- \[ \]/, '').trim();
      currentStory.acceptanceCriteria.push(criterion);
    }
    
    // Collect technical requirements
    if (inTechnicalReqs && line.match(/^- /)) {
      const req = line.replace(/^- /, '').trim();
      currentStory.technicalReqs.push(req);
    }
    
    // Collect privacy notes
    if (inPrivacyNotes && line.match(/^- /)) {
      const note = line.replace(/^- /, '').trim();
      currentStory.privacyNotes.push(note);
    }
    
    // Collect security notes
    if (inSecurityNotes && line.match(/^- /)) {
      const note = line.replace(/^- /, '').trim();
      currentStory.securityNotes.push(note);
    }
    
    // Extract API contract
    if (line.startsWith('**API Contract:**')) {
      let contractLines = [];
      for (let j = i + 1; j < lines.length && !lines[j].startsWith('**'); j++) {
        contractLines.push(lines[j]);
      }
      currentStory.apiContract = contractLines.join('\n').trim();
    }
  }
  
  if (currentStory) {
    stories.push(currentStory);
  }
  
  return stories;
}

// Generate issue body from story
function generateIssueBody(story) {
  let body = `## User Story\n\n${story.description}\n\n`;
  
  if (story.acceptanceCriteria.length > 0) {
    body += `## Acceptance Criteria\n\n`;
    story.acceptanceCriteria.forEach(criterion => {
      body += `- [ ] ${criterion}\n`;
    });
    body += '\n';
  }
  
  if (story.technicalReqs.length > 0) {
    body += `## Technical Requirements\n\n`;
    story.technicalReqs.forEach(req => {
      body += `- ${req}\n`;
    });
    body += '\n';
  }
  
  if (story.apiContract) {
    body += `## API Contract\n\n\`\`\`\n${story.apiContract}\n\`\`\`\n\n`;
  }
  
  if (story.privacyNotes.length > 0) {
    body += `## Privacy Notes\n\n`;
    story.privacyNotes.forEach(note => {
      body += `- ${note}\n`;
    });
    body += '\n';
  }
  
  if (story.securityNotes.length > 0) {
    body += `## Security Notes\n\n`;
    story.securityNotes.forEach(note => {
      body += `- ${note}\n`;
    });
    body += '\n';
  }
  
  if (story.cost) {
    body += `**Cost**: ${story.cost}\n\n`;
  }
  
  body += `---\n\n`;
  body += `**Spec Reference**: \`docs/milestones/${story.milestone}-*.md\` (Story ${story.number})\n`;
  body += `**Milestone**: ${story.milestone}\n`;
  
  return body;
}

// Create or update GitHub issue
function createIssue(story, { dryRun = false, forceUpdate = false, existingIssues, milestoneNumbers }) {
  const title = `[${story.id}] ${story.title}`;
  const body = generateIssueBody(story);
  const labels = story.labels.join(',');
  const storyKey = story.id.toUpperCase();
  const existingIssue = existingIssues.get(storyKey);
  const milestoneInfo = milestoneNumbers.get(story.milestone);

  const describeExisting = existingIssue ? ` (issue #${existingIssue.number})` : '';

  if (dryRun) {
    const action = existingIssue ? 'update' : 'create';
    console.log(`\nDRY RUN - Would ${action} issue${describeExisting}:`);
    console.log(`Title: ${title}`);
    console.log(`Labels: ${labels}`);
    console.log(`Milestone: ${milestoneInfo ? milestoneInfo.title : '(none)'}`);
    console.log(`Body:\n${body}`);
    console.log('---');
    return existingIssue ? 'would-update' : 'would-create';
  }

  try {
    if (existingIssue) {
      if (!forceUpdate) {
        console.log(`Skipping ${story.id} - issue #${existingIssue.number} already exists. Use --force to update it.`);
        return 'skipped';
      }

      withTempBodyFile(body, bodyFile => {
        let command = `gh issue edit ${existingIssue.number} --title "${title}" --body-file "${bodyFile}" --add-label "${labels}"`;
        if (milestoneInfo) {
          command += ` --milestone "${milestoneInfo.title}"`;
        }
        execSync(command, { stdio: 'inherit' });
      });
      console.log(`Updated existing issue #${existingIssue.number}`);
      return 'updated';
    }

    let issueUrl = '';
    withTempBodyFile(body, bodyFile => {
      let command = `gh issue create --title "${title}" --body-file "${bodyFile}" --label "${labels}"`;
      if (milestoneInfo) {
        command += ` --milestone "${milestoneInfo.title}"`;
      }
      issueUrl = execSync(command, { encoding: 'utf-8' }).trim();
    });

    const numberMatch = issueUrl.match(/\/issues\/(\d+)$/);
    if (numberMatch) {
      existingIssues.set(storyKey, { number: parseInt(numberMatch[1], 10), title });
    }

    console.log(`Created: ${title}`);
    console.log(`   ${issueUrl}`);
    return 'created';
  } catch (error) {
    console.error(`Failed to process issue ${story.id}: ${error.message}`);
    return 'error';
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const generateAll = args.includes('--all');
  const forceUpdate = args.includes('--force');
  const targetMilestone = args.find(arg => !arg.startsWith('--'));

  // Determine which milestones to process
  let milestonesToProcess = [];
  if (generateAll) {
    milestonesToProcess = MILESTONES;
  } else if (targetMilestone) {
    const normalized = targetMilestone.toUpperCase();
    if (MILESTONES.includes(normalized)) {
      milestonesToProcess = [normalized];
    } else {
      console.error(`Invalid milestone: ${targetMilestone}`);
      console.error(`   Valid options: ${MILESTONES.join(', ')}`);
      process.exit(1);
    }
  } else {
    console.log('Usage: node scripts/generate-issues.js [milestone|--all] [--dry-run]');
    console.log('\nExamples:');
    console.log('  node scripts/generate-issues.js M1          # Generate M1 issues');
    console.log('  node scripts/generate-issues.js --all       # Generate all issues');
    console.log('  node scripts/generate-issues.js M2 --dry-run  # Preview M2 issues');
    process.exit(0);
  }

  ensureDirectoryExists(SPEC_DIR);
  ensureGhCliAvailable();
  ensureGhAuthenticated();
  const repoSlug = getRepoSlug();
  console.log(`Repository: ${repoSlug}`);
  const existingLabels = loadExistingLabels(repoSlug);
  ensureProjectLabels(repoSlug, existingLabels);
  const repoMilestones = loadExistingMilestones(repoSlug);
  const milestoneNumbers = ensureRepoMilestones(repoSlug, repoMilestones);
  const existingIssues = loadExistingIssues();
  console.log(`Loaded ${existingIssues.size} existing user-story issues for duplicate detection.`);
  
  console.log(`\nGenerating issues for: ${milestonesToProcess.join(', ')}`);
  if (dryRun) {
    console.log('DRY RUN MODE - No issues will be created\n');
  }
  
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    previewCreate: 0,
    previewUpdate: 0
  };
  
  for (const milestone of milestonesToProcess) {
    const files = fs.readdirSync(SPEC_DIR);
    const fileName = files.find(f => f.toLowerCase().startsWith(milestone.toLowerCase()));
    
    if (!fileName) {
      console.warn(`No spec file found for ${milestone}`);
      continue;
    }
    
    const filePath = path.join(SPEC_DIR, fileName);
    console.log(`\nProcessing: ${fileName}`);
    
    const stories = parseMilestoneFile(filePath);
    if (stories.length === 0) {
      console.warn(`   No user stories found in ${fileName}. Skipping.`);
      continue;
    }
    console.log(`   Found ${stories.length} user stories\n`);
    
    for (const story of stories) {
      const status = createIssue(story, { dryRun, forceUpdate, existingIssues, milestoneNumbers });
      if (dryRun) {
        if (status === 'would-create') {
          stats.previewCreate++;
        } else if (status === 'would-update') {
          stats.previewUpdate++;
        }
        continue;
      }
      if (status === 'created') stats.created++;
      else if (status === 'updated') stats.updated++;
      else if (status === 'skipped') stats.skipped++;
      else if (status === 'error') stats.errors++;
    }
  }
  
  console.log(`\nSummary:`);
  if (dryRun) {
    console.log(`   Would create ${stats.previewCreate} new issues`);
    console.log(`   Would update ${stats.previewUpdate} existing issues`);
    console.log('   Run without --dry-run to apply changes');
  } else {
    console.log(`   Created ${stats.created} new issues`);
    console.log(`   Updated ${stats.updated} existing issues`);
    console.log(`   Skipped ${stats.skipped} duplicates (use --force to update)`);
    console.log(`   Errors: ${stats.errors}`);
    console.log('   Issues will be auto-added to Project #3 by project-automation.yml');
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
