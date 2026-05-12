const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'app', 'home.tsx');
let text = fs.readFileSync(file, 'utf8');

// Check if styles already exist
if (text.includes('productImageOverlay:')) {
  console.log('✓ Styles already patched');
  process.exit(0);
}

// Find the `productCard:` style block and inject new styles after ratingText
const ratingTextRegex = /(\s+ratingText:\s*{[^}]+},)/;
const match = text.match(ratingTextRegex);

if (!match) {
  console.error('Could not find ratingText block');
  process.exit(1);
}

const newStyles = `
  productImageOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  offerBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  offerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },

  discountTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },`;

// Insert after the ratingText block
const insertion = match[1] + newStyles;
text = text.replace(match[1], insertion);

// Also update productCard to add styles
const productCardRegex = /(\s+productCard:\s*{)\s*(\n\s+marginBottom:\s*0,\s*\n\s*},)/;
const productCardMatch = text.match(productCardRegex);

if (productCardMatch) {
  const newProductCard = `$1
    marginBottom: 0,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },`;
  text = text.replace(productCardRegex, newProductCard);
  console.log('✓ Updated productCard styles');
} else {
  console.warn('⚠ Could not find productCard pattern');
}

// Update ratingBadge and ratingText
const ratingBadgeRegex = /(\s+ratingBadge:\s*{)\s*(\n\s+position:\s*"absolute",\s*\n\s+left:\s*8,\s*\n\s+bottom:\s*8,\s*\n\s+backgroundColor:\s*"#F2F2F2",\s*\n\s+borderRadius:\s*6,\s*\n\s+paddingHorizontal:\s*6,\s*\n\s+paddingVertical:\s*3,\s*\n\s*},)/;
const ratingBadgeMatch = text.match(ratingBadgeRegex);

if (ratingBadgeMatch) {
  const newRatingBadge = `$1
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },`;
  text = text.replace(ratingBadgeRegex, newRatingBadge);
  console.log('✓ Updated ratingBadge styles');
}

fs.writeFileSync(file, text, 'utf8');
console.log('✓ patched home.tsx successfully');
