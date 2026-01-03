#!/bin/bash
# Interactive workflow helper
# Usage: npm run workflow

set -e

clear
echo "Choose your workflow:"
echo ""
echo "  1) Start Dev Server (daily workflow)"
echo "  2) Clean Reinstall (fix dependency issues)"
echo "  3) Run Diagnostics (troubleshoot problems)"
echo "  4) Kill Port 8081 (server won't start)"
echo "  5) Start Story (select & start working on a story)"
echo "  6) Create PR (run PR validator and create)"
echo "  7) Generate Issues from Milestones"
echo "  8) Exit"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        echo ""
        bash scripts/dev.sh
        ;;
    2)
        echo ""
        bash scripts/clean-install.sh
        ;;
    3)
        echo ""
        bash scripts/doctor.sh
        ;;
    4)
        echo ""
        bash scripts/kill-port.sh
        echo ""
        echo "Port cleared. Run 'npm run dev' to start server."
        ;;
    5)
        echo ""
        bash scripts/start-story.sh
        ;;
    6)
        echo ""
        bash scripts/create-pr.sh
        ;;
    7)
        echo ""
        echo "Generate issues helper"
        echo "  1) Dry run (preview changes)"
        echo "  2) Apply (create/update issues)"
        echo "  3) Cancel"
        read -p "Choose mode [1-3]: " gen_mode
        case $gen_mode in
          1)
            read -p "Enter milestone (e.g., M1) or press Enter for --all dry-run: " gen_target
            if [ -z "$gen_target" ]; then
              node scripts/generate-issues.js --all --dry-run
            else
              node scripts/generate-issues.js "$gen_target" --dry-run
            fi
            ;;
          2)
            read -p "Enter milestone (e.g., M1) or press Enter for --all: " gen_target
            if [ -z "$gen_target" ]; then
              node scripts/generate-issues.js --all
            else
              node scripts/generate-issues.js "$gen_target"
            fi
            ;;
          *)
            echo "Cancelled."
            ;;
        esac
        ;;
    8)
        echo "Goodbye."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run again."
        exit 1
        ;;
esac