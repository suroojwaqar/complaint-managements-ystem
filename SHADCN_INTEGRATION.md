# shadcn/ui Integration Guide

This document outlines the complete integration of shadcn/ui into the Complaint Management System.

## 🎉 What's Been Implemented

### Core Components Added
- ✅ **Button** - Replaced custom `.btn-primary` and `.btn-secondary` classes
- ✅ **Input** - Replaced raw HTML inputs with consistent styling
- ✅ **Label** - Form labels with proper accessibility
- ✅ **Card** - Replaced custom `.card` class with composable Card components
- ✅ **Badge** - Replaced custom badge classes with variant-based badges
- ✅ **Select** - Accessible dropdown component
- ✅ **Dialog/AlertDialog** - Modal components for future use
- ✅ **Form** - React Hook Form integration with validation
- ✅ **Textarea** - Styled textarea component
- ✅ **Toaster** - Toast notifications using Sonner

### Pages Refactored
1. **Login Page** (`/app/login/page.tsx`)
   - Form components with validation
   - Proper error handling with toast notifications
   - Consistent styling with shadcn/ui

2. **Admin Dashboard** (`/app/admin/dashboard/page.tsx`)
   - Card components for stats
   - Badge variants for user roles and complaint statuses
   - Button components with proper variants

3. **Dashboard Layout** (`/components/layout/DashboardLayout.tsx`)
   - Button components for navigation
   - Badge for user role display
   - Consistent spacing and styling

4. **Complaint Card** (`/components/client/ComplaintCard.tsx`)
   - Card component structure
   - Badge variants for complaint status
   - Button components for actions

## 🔧 Configuration Files

### components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### package.json Updates
Added all necessary Radix UI primitives and dependencies for shadcn/ui components.

### globals.css Changes
- Removed custom component classes (`.btn-primary`, `.card`, `.badge-*`)
- Kept shadcn/ui CSS variables
- Added utility class for line clamping

## 📦 New Dependencies Added

```json
{
  "@hookform/resolvers": "^3.3.2",
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-alert-dialog": "^1.0.5",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-popover": "^1.0.7",
  "@radix-ui/react-progress": "^1.0.3",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.5",
  "@radix-ui/react-tooltip": "^1.0.7",
  "class-variance-authority": "^0.7.0",
  "cmdk": "^0.2.0",
  "date-fns": "^2.30.0",
  "embla-carousel-react": "^8.0.0",
  "react-day-picker": "^8.9.1",
  "react-resizable-panels": "^0.0.55",
  "sonner": "^1.2.4",
  "vaul": "^0.7.9"
}
```

## 🚀 How to Install

1. Run the installation script:
   ```bash
   chmod +x install-shadcn.sh
   ./install-shadcn.sh
   ```

2. Or manually install dependencies:
   ```bash
   npm install
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## 🎨 Component Usage Examples

### Button
```tsx
import { Button } from "@/components/ui/button";

// Primary button
<Button>Click me</Button>

// Secondary button
<Button variant="secondary">Secondary</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge";

// Status badges
<Badge variant="new">New</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="closed">Closed</Badge>
```

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Form
```tsx
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="Enter email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

## 📋 Still TODO

1. **Remaining Pages** - Apply shadcn/ui to all other pages:
   - User management pages
   - Department management
   - Complaint creation/editing forms
   - Employee and Manager dashboards

2. **Additional Components** - Add more shadcn/ui components as needed:
   - Table component for lists
   - Dropdown Menu for user actions
   - Tabs for organizing content
   - Progress bars for file uploads
   - Tooltip for additional information

3. **Form Enhancements** - Replace all custom forms with shadcn/ui Form components

4. **Data Tables** - Implement shadcn/ui Table component for:
   - User lists
   - Complaint lists
   - Department lists
   - History logs

5. **Navigation Improvements** - Add:
   - Dropdown menus for user actions
   - Command palette for quick navigation
   - Breadcrumb improvements

## 🔄 Migration Strategy

To complete the shadcn/ui integration across your entire application:

### Phase 1: Core Pages (COMPLETED ✅)
- [x] Login page
- [x] Admin dashboard 
- [x] Dashboard layout
- [x] Complaint card component

### Phase 2: Form Pages (TODO 📝)
- [ ] User creation/editing forms
- [ ] Department creation/editing forms
- [ ] Complaint creation/editing forms
- [ ] Nature type management

### Phase 3: List/Table Pages (TODO 📝)
- [ ] Users list page
- [ ] Complaints list page
- [ ] Departments list page
- [ ] History/audit logs

### Phase 4: Enhanced Components (TODO 📝)
- [ ] File upload component with shadcn/ui
- [ ] Loading states and skeletons
- [ ] Error boundaries
- [ ] Search and filters

## 🛠️ Development Guidelines

### 1. Component Standards
- Always import components from `@/components/ui/`
- Use proper variant props instead of custom CSS classes
- Leverage compound components (Card + CardHeader + CardContent)
- Maintain consistent spacing with Tailwind classes

### 2. Form Handling
- Use React Hook Form with shadcn/ui Form components
- Implement proper validation with `@hookform/resolvers`
- Show toast notifications for form feedback
- Handle loading states with disabled buttons

### 3. Accessibility
- All shadcn/ui components come with accessibility built-in
- Ensure proper ARIA labels and descriptions
- Test with keyboard navigation
- Check color contrast for custom elements

### 4. Theming
- Customize CSS variables in `globals.css` for brand colors
- Use semantic color tokens (primary, secondary, destructive, etc.)
- Consider adding custom variants to existing components

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/components/ui/...'" 
**Solution:** Ensure the path alias is correctly configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Components not styled correctly
**Solution:** Check that:
1. `globals.css` is imported in the root layout
2. Tailwind CSS variables are properly defined
3. The component is imported from the correct path

### Issue: Form validation not working
**Solution:** Ensure you're using the Form provider:
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* FormField components */}
  </form>
</Form>
```

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Class Variance Authority](https://cva.style/docs)

## 🤝 Contributing

When adding new components or pages:

1. Use existing shadcn/ui components first
2. If custom components are needed, follow the shadcn/ui patterns
3. Add proper TypeScript interfaces
4. Include accessibility considerations
5. Test responsive design
6. Update this documentation

---

**Note**: This integration provides a solid foundation for a modern, accessible, and maintainable UI. Continue migrating the remaining pages following the established patterns for consistency.
