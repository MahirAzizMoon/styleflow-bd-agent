export const STORE = {
  name: "StyleFlow BD",
  currency: "BDT",
  contact: {
    facebookPage: "StyleFlow BD Demo Boutique",
    phone: "+880 1700-000000",
    hours: "10:00 AM–10:00 PM, every day",
  },
  delivery: {
    dhaka: { charge: 80, estimate: "1–2 business days" },
    outsideDhaka: { charge: 130, estimate: "3–5 business days" },
  },
  paymentMethods: ["Cash on delivery", "bKash", "Nagad"],
  exchangePolicy:
    "Exchange requests are accepted within 3 days of delivery for unworn items with the tag and invoice. The customer pays return delivery unless the item was damaged or incorrect.",
  returnPolicy:
    "Change-of-mind refunds are not offered. A damaged or incorrect item may be returned after the customer contacts the store within 24 hours with an unboxing video.",
  orderPolicy:
    "The assistant can prepare an order summary but cannot confirm payment or place an order. A human seller must confirm the final order, address, phone number, and stock.",
};

function catalogueItem(id, name, category, description, occasions, price, colors, sizes, stockSeed) {
  return {
    id,
    name,
    category,
    description,
    occasions,
    price,
    variants: colors.flatMap((color, colorIndex) =>
      sizes.map((size, sizeIndex) => ({
        color,
        size,
        stock: ((stockSeed + colorIndex * 2 + sizeIndex) % 7) + 1,
      }))
    ),
  };
}

const ADDITIONAL_PRODUCTS = [
  catalogueItem("SF-KURTI-103", "Shapla Block-Print Kurti", "kurti", "Cotton block-print kurti with side pockets and a comfortable straight cut.", ["casual", "university", "pohela boishakh"], 1450, ["mustard", "brick red"], ["S", "M", "L", "XL"], 2),
  catalogueItem("SF-KURTI-104", "Bristi Indigo Kurti", "kurti", "Indigo-dyed cotton kurti with subtle geometric motifs and three-quarter sleeves.", ["office", "casual", "travel"], 1650, ["indigo", "charcoal"], ["S", "M", "L", "XL"], 3),
  catalogueItem("SF-KURTI-105", "Chandni Festive Kurti", "kurti", "Light festive kurti with delicate gold accents and a flattering A-line shape.", ["eid", "festival", "dinner"], 2150, ["emerald", "purple"], ["M", "L", "XL"], 4),
  catalogueItem("SF-KURTI-106", "Kashful White Kurti", "kurti", "Crisp cotton kurti with blue floral embroidery inspired by autumn kash fields.", ["casual", "pohela boishakh", "family gathering"], 1750, ["white and blue", "white and red"], ["S", "M", "L", "XL"], 5),
  catalogueItem("SF-KURTI-107", "Prokriti Long Kurti", "kurti", "Flowing long kurti in soft viscose with leafy prints and a modest silhouette.", ["everyday", "office", "modest wear"], 1950, ["sage green", "rust"], ["M", "L", "XL", "XXL"], 1),

  catalogueItem("SF-THREE-202", "Sonali Jacquard Three-Piece", "three-piece", "Jacquard kameez with coordinated trousers and an airy organza dupatta.", ["eid", "wedding guest", "festival"], 3250, ["gold beige", "deep maroon"], ["M", "L", "XL"], 2),
  catalogueItem("SF-THREE-203", "Bela Lawn Three-Piece", "three-piece", "Printed lawn set designed for warm days with a lightweight cotton dupatta.", ["casual", "summer", "family gathering"], 2350, ["lemon yellow", "aqua"], ["S", "M", "L", "XL"], 3),
  catalogueItem("SF-THREE-204", "Mayabi Chiffon Three-Piece", "three-piece", "Elegant chiffon set with embroidered panels and a matching flowing dupatta.", ["wedding guest", "party", "eid"], 3650, ["dusty rose", "midnight blue"], ["M", "L", "XL"], 4),
  catalogueItem("SF-THREE-205", "Nokshi Cotton Three-Piece", "three-piece", "Comfortable cotton set featuring nakshi-inspired printed borders.", ["office", "casual", "pohela boishakh"], 2550, ["terracotta", "navy"], ["S", "M", "L", "XL"], 5),
  catalogueItem("SF-THREE-206", "Tara Luxury Three-Piece", "three-piece", "Premium festive set with bead detailing, tailored trousers, and a soft dupatta.", ["eid", "engagement", "party"], 4250, ["champagne", "wine"], ["M", "L", "XL"], 1),

  catalogueItem("SF-SAREE-302", "Padma Tangail Saree", "saree", "Traditional Tangail weave with a fine striped body and decorative anchal.", ["festival", "office", "family gathering"], 2750, ["coral", "royal blue"], ["FREE"], 2),
  catalogueItem("SF-SAREE-303", "Boishakhi Cotton Saree", "saree", "Red-and-white cotton saree created for comfortable Bengali celebrations.", ["pohela boishakh", "cultural event", "festival"], 1950, ["red and white", "black and red"], ["FREE"], 3),
  catalogueItem("SF-SAREE-304", "Raat Silk Saree", "saree", "Smooth silk-blend saree with a luminous border for evening occasions.", ["wedding guest", "party", "dinner"], 3450, ["midnight blue", "plum"], ["FREE"], 4),
  catalogueItem("SF-SAREE-305", "Mrittika Khadi Saree", "saree", "Textured handwoven khadi saree in earthy tones for understated styling.", ["office", "cultural event", "casual"], 2600, ["clay brown", "olive"], ["FREE"], 5),
  catalogueItem("SF-SAREE-306", "Rajkonna Katan Saree", "saree", "Rich katan-inspired festive saree with woven motifs and a statement border.", ["wedding", "eid", "engagement"], 4950, ["ruby red", "emerald"], ["FREE"], 1),

  catalogueItem("SF-ABAYA-402", "Safa Pleated Abaya", "abaya", "Flowing nida abaya with soft front pleats and discreet cuff details.", ["everyday", "modest wear", "dinner"], 2750, ["mocha", "black"], ["M", "L", "XL", "XXL"], 2),
  catalogueItem("SF-ABAYA-403", "Liyana Kimono Abaya", "abaya", "Open kimono-style abaya with wide sleeves, inner belt, and clean piping.", ["party", "travel", "modest wear"], 3150, ["navy", "taupe"], ["M", "L", "XL"], 3),
  catalogueItem("SF-ABAYA-404", "Haya Embroidered Abaya", "abaya", "Formal abaya with tonal embroidery at the sleeves and front panel.", ["eid", "formal", "modest wear"], 3650, ["black", "deep green"], ["M", "L", "XL", "XXL"], 4),
  catalogueItem("SF-ABAYA-405", "Rania Travel Abaya", "abaya", "Wrinkle-resistant front-zip abaya with practical pockets for travel.", ["travel", "everyday", "modest wear"], 2950, ["charcoal", "sand"], ["S", "M", "L", "XL"], 5),

  catalogueItem("SF-SHIRT-502", "Dheu Oxford Shirt", "shirt", "Classic unisex Oxford shirt with a neat collar and regular fit.", ["office", "smart casual", "university"], 1750, ["white", "powder blue"], ["S", "M", "L", "XL"], 2),
  catalogueItem("SF-SHIRT-503", "Shitol Cotton Shirt", "shirt", "Lightweight short-sleeve cotton shirt made for hot summer days.", ["summer", "casual", "travel"], 1250, ["mint", "off-white"], ["S", "M", "L", "XL"], 3),
  catalogueItem("SF-SHIRT-504", "Naksha Camp-Collar Shirt", "shirt", "Relaxed camp-collar shirt with a locally inspired geometric print.", ["casual", "festival", "travel"], 1450, ["navy print", "rust print"], ["M", "L", "XL"], 4),
  catalogueItem("SF-SHIRT-505", "Nagar Denim Shirt", "shirt", "Soft lightweight denim shirt for easy layering and everyday wear.", ["casual", "university", "travel"], 1850, ["light blue", "dark blue"], ["S", "M", "L", "XL"], 5),

  catalogueItem("SF-PANJABI-601", "Shurjo Cotton Panjabi", "panjabi", "Breathable cotton panjabi with minimal embroidery at the placket.", ["eid", "friday prayer", "casual"], 1950, ["cream", "mustard"], ["M", "L", "XL", "XXL"], 2),
  catalogueItem("SF-PANJABI-602", "Nawab Jacquard Panjabi", "panjabi", "Textured jacquard panjabi with a structured collar for formal celebrations.", ["wedding", "eid", "formal"], 2950, ["maroon", "navy"], ["M", "L", "XL", "XXL"], 3),
  catalogueItem("SF-PANJABI-603", "Aakash Linen Panjabi", "panjabi", "Linen-blend panjabi offering a relaxed fit and subtle contrast buttons.", ["summer", "family gathering", "friday prayer"], 2250, ["sky blue", "sage"], ["S", "M", "L", "XL"], 4),
  catalogueItem("SF-PANJABI-604", "Bijoy Embroidered Panjabi", "panjabi", "Festive panjabi with tonal chest embroidery and premium finishing.", ["eid", "engagement", "festival"], 3350, ["black", "bottle green"], ["M", "L", "XL"], 5),

  catalogueItem("SF-DRESS-701", "Golap Midi Dress", "dress", "Floral midi dress with a gathered waist and softly flared skirt.", ["brunch", "casual", "birthday"], 2250, ["pink floral", "blue floral"], ["S", "M", "L", "XL"], 2),
  catalogueItem("SF-DRESS-702", "Nodi Maxi Dress", "dress", "Modest ankle-length maxi dress with full sleeves and a removable belt.", ["dinner", "travel", "modest wear"], 2650, ["teal", "burgundy"], ["S", "M", "L", "XL"], 3),
  catalogueItem("SF-DRESS-703", "Tithi Wrap Dress", "dress", "Adjustable wrap-style dress with a comfortable drape and V neckline.", ["office", "dinner", "party"], 2450, ["forest green", "navy"], ["S", "M", "L"], 4),
  catalogueItem("SF-DRESS-704", "Utsab Embellished Dress", "dress", "Festive long dress with restrained sequin work and a layered skirt.", ["eid", "party", "wedding guest"], 3850, ["lavender", "deep red"], ["M", "L", "XL"], 5),

  catalogueItem("SF-TOP-801", "Komol Everyday Top", "top", "Soft cotton everyday top with a round neck and curved hem.", ["casual", "university", "everyday"], 950, ["peach", "white"], ["S", "M", "L", "XL"], 2),
  catalogueItem("SF-TOP-802", "Rong Office Blouse", "top", "Polished woven blouse with cuffed sleeves for office-ready styling.", ["office", "smart casual", "dinner"], 1350, ["ivory", "wine"], ["S", "M", "L", "XL"], 3),
  catalogueItem("SF-TOP-803", "Alpona Peplum Top", "top", "Printed peplum top with alpona-inspired motifs and a side zip.", ["festival", "casual", "pohela boishakh"], 1550, ["red print", "indigo print"], ["S", "M", "L"], 4),
];

export const PRODUCTS = [
  {
    id: "SF-KURTI-101",
    name: "Nilima Embroidered Kurti",
    category: "kurti",
    description: "Blue breathable cotton kurti with white thread embroidery; suitable for Eid and casual gatherings.",
    occasions: ["eid", "casual", "family gathering"],
    price: 1850,
    variants: [
      { color: "blue", size: "S", stock: 4 },
      { color: "blue", size: "M", stock: 7 },
      { color: "blue", size: "L", stock: 5 },
      { color: "blue", size: "XL", stock: 2 },
      { color: "white", size: "M", stock: 3 },
      { color: "white", size: "L", stock: 2 },
    ],
  },
  {
    id: "SF-KURTI-102",
    name: "Meghla Printed Kurti",
    category: "kurti",
    description: "Soft printed rayon kurti with a relaxed fit for university, office, and everyday wear.",
    occasions: ["casual", "office", "university"],
    price: 1350,
    variants: [
      { color: "green", size: "S", stock: 3 },
      { color: "green", size: "M", stock: 6 },
      { color: "green", size: "L", stock: 4 },
      { color: "maroon", size: "M", stock: 2 },
      { color: "maroon", size: "L", stock: 3 },
      { color: "maroon", size: "XL", stock: 1 },
    ],
  },
  {
    id: "SF-THREE-201",
    name: "Ruposhi Three-Piece Set",
    category: "three-piece",
    description: "Festive cotton three-piece with matching dupatta and detailed neckline work.",
    occasions: ["eid", "wedding guest", "festival"],
    price: 2850,
    variants: [
      { color: "rose pink", size: "M", stock: 4 },
      { color: "rose pink", size: "L", stock: 3 },
      { color: "rose pink", size: "XL", stock: 2 },
      { color: "navy", size: "M", stock: 2 },
      { color: "navy", size: "L", stock: 4 },
      { color: "navy", size: "XL", stock: 1 },
    ],
  },
  {
    id: "SF-SAREE-301",
    name: "Jamuna Handloom Saree",
    category: "saree",
    description: "Lightweight handloom saree with a contrasting border for office events and celebrations.",
    occasions: ["office", "pohela boishakh", "festival"],
    price: 2300,
    variants: [
      { color: "red and white", size: "free", stock: 5 },
      { color: "teal and gold", size: "free", stock: 3 },
    ],
  },
  {
    id: "SF-ABAYA-401",
    name: "Noor Everyday Abaya",
    category: "abaya",
    description: "Minimal front-open nida abaya with matching belt and pockets.",
    occasions: ["everyday", "office", "modest wear"],
    price: 2450,
    variants: [
      { color: "black", size: "M", stock: 5 },
      { color: "black", size: "L", stock: 6 },
      { color: "black", size: "XL", stock: 4 },
      { color: "olive", size: "M", stock: 2 },
      { color: "olive", size: "L", stock: 3 },
      { color: "olive", size: "XL", stock: 2 },
    ],
  },
  {
    id: "SF-SHIRT-501",
    name: "Aarongya Linen Shirt",
    category: "shirt",
    description: "Unisex relaxed-fit linen-blend shirt for casual and smart-casual styling.",
    occasions: ["casual", "office", "travel"],
    price: 1550,
    variants: [
      { color: "beige", size: "S", stock: 3 },
      { color: "beige", size: "M", stock: 5 },
      { color: "beige", size: "L", stock: 5 },
      { color: "sky blue", size: "M", stock: 4 },
      { color: "sky blue", size: "L", stock: 3 },
      { color: "sky blue", size: "XL", stock: 2 },
    ],
  },
  ...ADDITIONAL_PRODUCTS,
];
