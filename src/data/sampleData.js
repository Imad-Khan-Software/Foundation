// Sample / placeholder data for Phase 1 (Public Website UI only).
// Nothing here is real. All names, numbers, and contact details are
// placeholders and will be replaced by real content managed through
// the admin panel once Supabase is connected in a later phase.

export const foundation = {
  name: "Ikhlass Welfare Foundation",
  shortName: "Ikhlass",
  tagline: "Sincerity in service, transparency in trust.",
  intro:
    "Ikhlass Welfare Foundation works across education, health, and care to support families who need it most. Every rupee is tracked, every project is reported, and every branch answers to the communities it serves.",
  mission:
    "To deliver dignified, sustainable support in education, health, and care — built on transparency the community can verify for itself.",
  vision:
    "A future where no family in our communities has to choose between school, treatment, or a safe place to turn.",
  history:
    "Ikhlass Welfare Foundation began as a small volunteer effort supporting a handful of students and patients. It has since grown into three branches coordinating education sponsorships, health camps, and welfare support for families across the region.",
  objectives: [
    "Sponsor school fees, books, and supplies for students who would otherwise drop out.",
    "Run free and subsidised health camps, and support urgent medical costs.",
    "Provide welfare aid — food, shelter support, and emergency relief — to families in crisis.",
    "Publish verified, itemised financial reports for every rupee donated and spent.",
  ],
  phone: "[Foundation Phone]",
  whatsapp: "[Foundation WhatsApp]",
  email: "[Foundation Email]",
  address: "[Foundation Address, City, Pakistan]",
  social: {
    facebook: "[Facebook URL]",
    instagram: "[Instagram URL]",
    youtube: "[YouTube URL]",
  },
};

export const pillars = [
  {
    key: "education",
    label: "Education",
    color: "education",
    summary:
      "School fee sponsorships, books, uniforms, and tuition support so no child's education stops because of money.",
    stat: "[XX] students sponsored",
  },
  {
    key: "health",
    label: "Health",
    color: "health",
    summary:
      "Free medical camps, subsidised treatment, and emergency medical aid for families without access to care.",
    stat: "[XX] patients treated",
  },
  {
    key: "care",
    label: "Care",
    color: "care",
    summary:
      "Food support, emergency relief, and welfare aid for families facing hardship or crisis.",
    stat: "[XX] families supported",
  },
];

export const executives = [
  {
    name: "[Executive Name]",
    role: "Founder & President",
    branch: "Head Office",
    bio: "[Short placeholder bio — background and role at the foundation.]",
  },
  {
    name: "[Executive Name]",
    role: "General Secretary",
    branch: "Head Office",
    bio: "[Short placeholder bio — background and role at the foundation.]",
  },
  {
    name: "[Executive Name]",
    role: "Finance Director",
    branch: "Head Office",
    bio: "[Short placeholder bio — background and role at the foundation.]",
  },
];

export const members = [
  { name: "[Member Name]", role: "Education Coordinator", branch: "Branch 1" },
  { name: "[Member Name]", role: "Health Coordinator", branch: "Branch 1" },
  { name: "[Member Name]", role: "Field Volunteer", branch: "Branch 2" },
  { name: "[Member Name]", role: "Field Volunteer", branch: "Branch 2" },
  { name: "[Member Name]", role: "Outreach Coordinator", branch: "Branch 3" },
  { name: "[Member Name]", role: "Field Volunteer", branch: "Branch 3" },
];

export const branches = [
  {
    name: "[Branch 1 Name]",
    city: "[City]",
    address: "[Branch 1 Address]",
    phone: "[Branch 1 Phone]",
    lead: "[Branch Lead Name]",
    focus: "Education & Health",
  },
  {
    name: "[Branch 2 Name]",
    city: "[City]",
    address: "[Branch 2 Address]",
    phone: "[Branch 2 Phone]",
    lead: "[Branch Lead Name]",
    focus: "Health & Care",
  },
  {
    name: "[Branch 3 Name]",
    city: "[City]",
    address: "[Branch 3 Address]",
    phone: "[Branch 3 Phone]",
    lead: "[Branch Lead Name]",
    focus: "Education & Care",
  },
];

export const projects = [
  {
    title: "[Project Name] — School Fee Sponsorship",
    category: "education",
    status: "active",
    branch: "[Branch 1 Name]",
    summary:
      "Ongoing sponsorship covering tuition, books, and uniforms for students in [Area Name].",
    raised: '',
    goal: '',
  },
  {
    title: "[Project Name] — Free Health Camp",
    category: "health",
    status: "active",
    branch: "[Branch 2 Name]",
    summary:
      "Monthly free medical camp offering consultations, medicine, and basic diagnostics.",
    raised: 0,
    goal: 0,
  },
  {
    title: "[Project Name] — Winter Relief Drive",
    category: "care",
    status: "completed",
    branch: "[Branch 3 Name]",
    summary:
      "Distributed blankets, warm clothing, and food packages to families ahead of winter.",
    raised: 0,
    goal: 0,
  },
  {
    title: "[Project Name] — Scholarship Fund",
    category: "education",
    status: "completed",
    branch: "[Branch 1 Name]",
    summary:
      "Merit and need-based scholarships awarded to students entering higher education.",
    raised: 0,
    goal: 0,
  },
  {
    title: "[Project Name] — Emergency Medical Aid",
    category: "health",
    status: "active",
    branch: "[Branch 2 Name]",
    summary:
      "Rapid-response fund covering urgent surgeries and treatment costs for families in crisis.",
    raised: 0,
    goal: 0,
  },
  {
    title: "[Project Name] — Family Welfare Support",
    category: "care",
    status: "active",
    branch: "[Branch 3 Name]",
    summary:
      "Monthly ration and welfare support for families facing sudden loss of income.",
    raised: 0,
    goal: 0,
  },
];

export const donationMethods = [
  {
    method: "Bank Transfer",
    details: [
      { label: "Account Title", value: "[Foundation Account Title]" },
      { label: "Account Number", value: "[Donation Account Number]" },
      { label: "Bank", value: "[Bank Name]" },
      { label: "IBAN", value: "[IBAN Number]" },
    ],
  },
  {
    method: "Easypaisa",
    details: [{ label: "Account Number", value: "[Easypaisa Number]" }],
  },
  {
    method: "JazzCash",
    details: [{ label: "Account Number", value: "[JazzCash Number]" }],
  },
];

export const transparency = {
  totalDonations: 0,
  totalExpenses: 0,
  categories: [
    { label: "Education", amount: 0, color: "education" },
    { label: "Health", amount: 0, color: "health" },
    { label: "Care", amount: 0, color: "care" },
    { label: "Administration", amount: 0, color: "pine" },
  ],
  reports: [
    { period: "Q2 2026", label: "April – June 2026 Report" },
    { period: "Q1 2026", label: "January – March 2026 Report" },
    { period: "Q4 2025", label: "October – December 2025 Report" },
  ],
};

export const galleryItems = [
  { caption: "Free health camp, [Branch Name]", category: "health" },
  { caption: "School supply distribution, [Area Name]", category: "education" },
  { caption: "Winter relief drive, [Area Name]", category: "care" },
  { caption: "Scholarship award ceremony", category: "education" },
  { caption: "Mobile medical unit visit", category: "health" },
  { caption: "Ration distribution, [Area Name]", category: "care" },
];

export const activities = [
  {
    date: "[Month] 2026",
    title: "Free eye camp held in [Area Name]",
    summary: "[XX] patients received free checkups and glasses.",
  },
  {
    date: "[Month] 2026",
    title: "New academic year sponsorships confirmed",
    summary: "[XX] students enrolled for the coming school year.",
  },
  {
    date: "[Month] 2026",
    title: "Emergency relief delivered after flooding",
    summary: "[XX] families received food and shelter support.",
  },
];
