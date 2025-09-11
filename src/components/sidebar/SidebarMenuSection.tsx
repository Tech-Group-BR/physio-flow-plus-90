
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { MenuItem } from "./SidebarMenuItems";

interface SidebarMenuSectionProps {
  label: string;
  items: MenuItem[];
}

export function SidebarMenuSection({ label, items }: SidebarMenuSectionProps) {
  const location = useLocation();

  console.log('📋 SidebarMenuSection render:', {
    label,
    itemsCount: items?.length || 0,
    currentPath: location.pathname
  });

  // Validação mais robusta
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log('⚠️ No items to render for section:', label);
    return null;
  }

  return (
    <SidebarGroup className="py-0">
      <SidebarGroupLabel className="px-2 py-2 text-xs font-medium text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item, index) => {
            // Validação individual de cada item
            if (!item || !item.title || !item.url || !item.icon) {
              console.log('⚠️ Invalid item at index:', index, item);
              return null;
            }

            const isActive = location.pathname === item.url;
            
            console.log('🎯 Menu item:', {
              title: item.title,
              url: item.url,
              isActive,
              currentPath: location.pathname
            });
            
            return (
              <SidebarMenuItem key={`${item.title}-${index}`}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className="w-full"
                >
                  <Link to={item.url} className="flex items-center gap-2 px-2 py-2">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
