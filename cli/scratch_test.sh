#!/bin/bash
set -e

# Create a scratch repo
mkdir -p /tmp/scratch-repo
cd /tmp/scratch-repo
rm -rf .git
git init
git branch -M main

# Initialize dummy file and config
cat << 'EOF' > .securepush.yml
provider: "groq"
test_command: "echo 'all good'"
thresholds:
  file_shrink_max_pct: 30
EOF
git add .securepush.yml
git commit -m "Initial commit"

# Plant a hardcoded secret in a new commit
echo "const API_KEY = \"sk-live-12345abcdef\";" > config.js
git add config.js
git commit -m "Add API config"

# Now we have an unpushed commit containing the secret.
# Save commit count
COUNT_BEFORE=$(git rev-list --count HEAD)

echo "--- Running securepush verify ---"
# We need to run the CLI built locally. Assuming e:/SecurePush/cli is built.
cd e:/SecurePush/cli
npm run build || npx tsc
node dist/index.js verify || true # Since it's interactive we can't fully automate accept/reject easily here.

echo "--- Test Output ---"
echo "Commit count before: $COUNT_BEFORE"
cd /tmp/scratch-repo
COUNT_AFTER=$(git rev-list --count HEAD)
echo "Commit count after: $COUNT_AFTER"
git status
git show HEAD
