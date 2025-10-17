#!/usr/bin/env bash
# Script to rename The Long Nights to The Long Nights across all project files
# Option B: Selective replacement - preserves CHANGELOG and historical docs

echo "🔄 Renaming The Long Nights to The Long Nights (preserving history)..."

# Count before
BEFORE=$(grep -r "The Long Nights" --exclude-dir="node_modules" --exclude-dir=".git" --exclude-dir="dist" --exclude-dir="dist-electron" . 2>/dev/null | wc -l)
echo "📊 Found $BEFORE occurrences of 'The Long Nights'"

# Backup important files
echo "💾 Creating backups..."
cp package.json package.json.backup 2>/dev/null || true
cp package-lock.json package-lock.json.backup 2>/dev/null || true

echo ""
echo "🔧 Step 1: Replacing in SOURCE CODE files..."

# Replace in JavaScript files
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/dist-electron/*" \
  -not -path "*/user-data/*" \
  -not -path "*/*.backup" \
  \( -name "*.js" -o -name "*.cjs" \) \
  -exec sed -i 's/The Long Nights/The Long Nights/g' {} \;

echo "   ✅ Updated JavaScript files"

# Replace in HTML files
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/dist-electron/*" \
  -name "*.html" \
  -exec sed -i 's/The Long Nights/The Long Nights/g' {} \;

echo "   ✅ Updated HTML files"

# Replace in CSS files
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/dist-electron/*" \
  -name "*.css" \
  -exec sed -i 's/The Long Nights/The Long Nights/g' {} \;

echo "   ✅ Updated CSS files"

echo ""
echo "🔧 Step 2: Replacing in ACTIVE DOCUMENTATION..."

# Replace in docs, but EXCLUDE CHANGELOG files
find ./docs -type f \
  -name "*.md" \
  -not -name "CHANGELOG*" \
  -not -name "*HISTORY*" \
  -not -name "*ARCHIVE*" \
  -exec sed -i 's/The Long Nights/The Long Nights/g' {} \;

echo "   ✅ Updated documentation (preserved CHANGELOGs)"

echo ""
echo "🔧 Step 3: Updating localStorage keys and references..."

# Update localStorage keys: voxelWorld_ -> longNights_
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/dist-electron/*" \
  -not -path "*/*.backup" \
  \( -name "*.js" -o -name "*.cjs" -o -name "*.html" \) \
  -exec sed -i 's/voxelWorld_/longNights_/g' {} \;

echo "   ✅ Updated localStorage keys (voxelWorld_ → longNights_)"

echo ""
echo "🔧 Step 4: Updating shell scripts and configs..."

# Update shell scripts and desktop files
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/dist-electron/*" \
  \( -name "*.sh" -o -name "*.desktop" \) \
  -not -name "*CHANGELOG*" \
  -exec sed -i 's/thelongnights/thelongnights/g' {} \; \
  -exec sed -i 's/The Long Nights/The Long Nights/g' {} \;

echo "   ✅ Updated shell scripts"

# Count after
AFTER=$(grep -r "The Long Nights" --exclude-dir="node_modules" --exclude-dir=".git" --exclude-dir="dist" --exclude-dir="dist-electron" . 2>/dev/null | wc -l)
REPLACED=$(($BEFORE - $AFTER))

echo ""
echo "✨ COMPLETE! Summary:"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Replaced: $REPLACED occurrences"
echo "  📊 Remaining: $AFTER (in CHANGELOGs/history)"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ Source code (.js, .html, .css)"
echo "  ✅ Active documentation (docs/*.md)"
echo "  ✅ Shell scripts and configs"
echo "  ✅ LocalStorage keys (voxelWorld_ → longNights_)"
echo ""
echo "  ⏭️  SKIPPED (preserved history):"
echo "     • CHANGELOG*.md files"
echo "     • Historical documentation"
echo ""
echo "📝 Backups created:"
echo "  • package.json.backup"
echo "  • package-lock.json.backup"
echo ""
echo "🎯 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the game: npm start"
echo "  3. Update any remaining references manually if needed"
