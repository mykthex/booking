# Database Maintenance Cron Jobs
# Add these to your crontab to prevent database corruption

# Run database health check every hour
# 0 * * * * cd /Users/adammy/sites/express-api/server && npm run db:health > /tmp/db-health.log 2>&1

# Run database maintenance daily at 2 AM
# 0 2 * * * cd /Users/adammy/sites/express-api/server && npm run db:maintenance > /tmp/db-maintenance.log 2>&1

# Clean up old log files weekly
# 0 3 * * 0 find /tmp -name "db-*.log" -mtime +7 -delete

# To install these cron jobs, run:
# crontab -e
# Then add the uncommented lines above (remove the # symbols)

# Alternative: Use a simple script for development
# You can run this script manually or add it to your development workflow

#!/bin/bash
echo "$(date): Running scheduled database maintenance..."
cd "$(dirname "$0")"
npm run db:maintenance
echo "$(date): Database maintenance completed"