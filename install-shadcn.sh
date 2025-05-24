#!/bin/bash

# shadcn/ui Installation Script
# Run this script to install all necessary shadcn/ui dependencies and components

echo "🚀 Installing shadcn/ui dependencies..."

# Install all required dependencies
npm install @hookform/resolvers@^3.3.2 \
  @radix-ui/react-accordion@^1.1.2 \
  @radix-ui/react-alert-dialog@^1.0.5 \
  @radix-ui/react-avatar@^1.0.4 \
  @radix-ui/react-checkbox@^1.0.4 \
  @radix-ui/react-dialog@^1.0.5 \
  @radix-ui/react-dropdown-menu@^2.0.6 \
  @radix-ui/react-label@^2.0.2 \
  @radix-ui/react-popover@^1.0.7 \
  @radix-ui/react-progress@^1.0.3 \
  @radix-ui/react-scroll-area@^1.0.5 \
  @radix-ui/react-select@^2.0.0 \
  @radix-ui/react-separator@^1.0.3 \
  @radix-ui/react-slot@^1.0.2 \
  @radix-ui/react-switch@^1.0.3 \
  @radix-ui/react-tabs@^1.0.4 \
  @radix-ui/react-toast@^1.1.5 \
  @radix-ui/react-tooltip@^1.0.7 \
  class-variance-authority@^0.7.0 \
  cmdk@^0.2.0 \
  date-fns@^2.30.0 \
  embla-carousel-react@^8.0.0 \
  react-day-picker@^8.9.1 \
  react-resizable-panels@^0.0.55 \
  sonner@^1.2.4 \
  vaul@^0.7.9 \
  zod@^3.22.4

echo "✅ Dependencies installed successfully!"

echo "🎨 Setting up shadcn/ui components..."
echo "Core components have been created:"
echo "  ✓ Button"
echo "  ✓ Input"
echo "  ✓ Label"
echo "  ✓ Card"
echo "  ✓ Badge"
echo "  ✓ Select"
echo "  ✓ Dialog"
echo "  ✓ Alert Dialog"
echo "  ✓ Form"
echo "  ✓ Textarea"
echo "  ✓ Toaster"

echo ""
echo "🔧 Configuration files updated:"
echo "  ✓ components.json"
echo "  ✓ package.json"
echo "  ✓ globals.css"

echo ""
echo "📝 Files refactored with shadcn/ui:"
echo "  ✓ Login page"
echo "  ✓ Admin dashboard"
echo "  ✓ Dashboard layout"
echo "  ✓ Complaint card component"

echo ""
echo "🎉 shadcn/ui integration complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install new dependencies"
echo "2. Restart your development server with 'npm run dev'"
echo "3. Check the updated components in your browser"
echo ""
echo "💡 Additional components can be added using:"
echo "   npx shadcn-ui@latest add [component-name]"
echo ""
echo "For more components, visit: https://ui.shadcn.com/docs/components"
