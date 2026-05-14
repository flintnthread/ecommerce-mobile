const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'app', 'home.tsx');
let text = fs.readFileSync(file, 'utf8');

// Try pattern with different line ending variations
const patterns = [
  { old: '  productCard: {\n    marginBottom: 0,\n  },\n\n\n  productImageWrap: {', new: '  productCard: {\n    marginBottom: 0,\n    backgroundColor: "#fff",\n    borderRadius: 18,\n    borderWidth: StyleSheet.hairlineWidth,\n    borderColor: "#E5E7EB",\n    shadowColor: "#000",\n    shadowOpacity: 0.08,\n    shadowRadius: 10,\n    shadowOffset: { width: 0, height: 6 },\n    elevation: 3,\n  },\n\n\n  productImageWrap: {' },
  { old: '  productCard: {\r\n    marginBottom: 0,\r\n  },\r\n\r\n\r\n  productImageWrap: {', new: '  productCard: {\r\n    marginBottom: 0,\r\n    backgroundColor: "#fff",\r\n    borderRadius: 18,\r\n    borderWidth: StyleSheet.hairlineWidth,\r\n    borderColor: "#E5E7EB",\r\n    shadowColor: "#000",\r\n    shadowOpacity: 0.08,\r\n    shadowRadius: 10,\r\n    shadowOffset: { width: 0, height: 6 },\r\n    elevation: 3,\r\n  },\r\n\r\n\r\n  productImageWrap: {' }
];

let found = false;
for (const p of patterns) {
  if (text.includes(p.old)) {
    text = text.replace(p.old, p.new);
    found = true;
    console.log('✓ First replacement done');
    break;
  }
}
if (!found) { throw 'productCard block not found'; }

// Second pattern
const patterns2 = [
  { old: '  ratingText: {\n    fontSize: 12,\n    fontWeight: "700",\n    color: "#333",\n  },\n\n\n  productName: {', new: '  ratingText: {\n    fontSize: 12,\n    fontWeight: "700",\n    color: "#111",\n    marginLeft: 4,\n  },\n\n  productImageOverlay: {\n    position: "absolute",\n    top: 10,\n    left: 10,\n    right: 10,\n    flexDirection: "row",\n    justifyContent: "space-between",\n    alignItems: "center",\n  },\n\n  offerBadge: {\n    backgroundColor: "#dc2626",\n    borderRadius: 12,\n    paddingHorizontal: 8,\n    paddingVertical: 4,\n  },\n\n  offerBadgeText: {\n    fontSize: 11,\n    fontWeight: "700",\n    color: "#fff",\n  },\n\n  discountTag: {\n    fontSize: 11,\n    fontWeight: "700",\n    color: "#dc2626",\n    backgroundColor: "#FEE2E2",\n    paddingHorizontal: 6,\n    paddingVertical: 2,\n    borderRadius: 8,\n    marginLeft: 8,\n  },\n\n  productName: {' },
  { old: '  ratingText: {\r\n    fontSize: 12,\r\n    fontWeight: "700",\r\n    color: "#333",\r\n  },\r\n\r\n\r\n  productName: {', new: '  ratingText: {\r\n    fontSize: 12,\r\n    fontWeight: "700",\r\n    color: "#111",\r\n    marginLeft: 4,\r\n  },\r\n\r\n  productImageOverlay: {\r\n    position: "absolute",\r\n    top: 10,\r\n    left: 10,\r\n    right: 10,\r\n    flexDirection: "row",\r\n    justifyContent: "space-between",\r\n    alignItems: "center",\r\n  },\r\n\r\n  offerBadge: {\r\n    backgroundColor: "#dc2626",\r\n    borderRadius: 12,\r\n    paddingHorizontal: 8,\r\n    paddingVertical: 4,\r\n  },\r\n\r\n  offerBadgeText: {\r\n    fontSize: 11,\r\n    fontWeight: "700",\r\n    color: "#fff",\r\n  },\r\n\r\n  discountTag: {\r\n    fontSize: 11,\r\n    fontWeight: "700",\r\n    color: "#dc2626",\r\n    backgroundColor: "#FEE2E2",\r\n    paddingHorizontal: 6,\r\n    paddingVertical: 2,\r\n    borderRadius: 8,\r\n    marginLeft: 8,\r\n  },\r\n\r\n  productName: {' }
];

found = false;
for (const p of patterns2) {
  if (text.includes(p.old)) {
    text = text.replace(p.old, p.new);
    found = true;
    console.log('✓ Second replacement done');
    break;
  }
}
if (!found) { throw 'ratingText block not found'; }

fs.writeFileSync(file, text, 'utf8');
console.log('✓ patched home.tsx successfully');

