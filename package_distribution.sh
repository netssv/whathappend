#!/bin/bash
# WhatHappened Distribution Packager
# This script creates a clean ZIP for release, excluding all files in .gitignore.

VERSION=$(grep '"version"' manifest.json | cut -d '"' -f 4)
FILE_NAME="WhatHappened_Distribution_v$VERSION.zip"
rm -f "$FILE_NAME"

echo "📦 Packaging WhatHappened v$VERSION..."

# 1. Clean up old temp if exists
rm -rf .dist_temp
mkdir .dist_temp

# 2. Export tracked files to temp dir
echo "   > Exporting tracked files..."
git archive HEAD | tar -x -C .dist_temp

# 3. Remove files that are explicitly ignored in .gitignore 
# (even if they are tracked in the repo)
echo "   > Removing tracked but ignored files..."
git ls-files -ic --exclude-standard | while read -r file; do
    echo "     - Removing ignored: $file"
    rm -f ".dist_temp/$file"
done

# 4. Create the ZIP
echo "   > Creating archive: $FILE_NAME"
cd .dist_temp
zip -r "../$FILE_NAME" . > /dev/null
cd ..

# 5. Cleanup
rm -rf .dist_temp

echo "✅ Done! Package created: $FILE_NAME"
