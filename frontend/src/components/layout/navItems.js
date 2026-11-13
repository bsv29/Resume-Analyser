import {
  BarChart3,
  FileSearch,
  GitCompareArrows,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListOrdered,
  Settings,
  Sparkles,
} from "lucide-react";

// One list drives the sidebar sections and the page title in the top bar.
export const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Your overview" },
      { to: "/analyze", label: "New analysis", icon: FileSearch, hint: "Score one resume" },
      { to: "/rank", label: "Rank resumes", icon: ListOrdered, hint: "Order up to 10 by fit" },
      { to: "/history", label: "History", icon: History, hint: "Every saved analysis" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/skills", label: "Skills insights", icon: Sparkles, hint: "Strengths and gaps" },
      { to: "/compare", label: "Compare", icon: GitCompareArrows, hint: "Two analyses side by side" },
      { to: "/reports", label: "Reports", icon: BarChart3, hint: "Trends and exports" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: Settings, hint: "Profile and appearance" },
      { to: "/help", label: "Help & guide", icon: LifeBuoy, hint: "How scoring works" },
    ],
  },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export function pageForPath(pathname) {
  if (pathname.startsWith("/results/")) {
    return { label: "Analysis result", section: "Workspace" };
  }
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((navItem) => pathname.startsWith(navItem.to));
    if (item) return { ...item, section: section.label };
  }
  return { label: "Shortlist", section: "" };
}

export function titleForPath(pathname) {
  return pageForPath(pathname).label;
}
