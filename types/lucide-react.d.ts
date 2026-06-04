declare module 'lucide-react' {
  import { SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export type Icon = (props: IconProps) => JSX.Element;
  
  // Common icons used in the project
  export const Filter: Icon;
  export const Search: Icon;
  export const Plus: Icon;
  export const X: Icon;
  export const Check: Icon;
  export const AlertCircle: Icon;
  export const Clock: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const TrendingUp: Icon;
  export const GitBranch: Icon;
  export const GitMerge: Icon;
  export const MessageSquare: Icon;
  export const ThumbsUp: Icon;
  export const Share: Icon;
  export const Bookmark: Icon;
  export const Eye: Icon;
  export const Edit: Icon;
  export const Trash: Icon;
  export const MoreVertical: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ArrowUp: Icon;
  export const ArrowDown: Icon;
  export const Activity: Icon;
  export const Zap: Icon;
  export const Star: Icon;
  export const Award: Icon;
  export const Bell: Icon;
  export const Settings: Icon;
  export const LogOut: Icon;
  export const Menu: Icon;
  export const Home: Icon;
  export const Database: Icon;
  export const FileText: Icon;
  export const Layers: Icon;
  export const Network: Icon;
}
