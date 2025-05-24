#!/bin/bash

echo "🔧 Installing missing shadcn/ui dependencies..."

# Install missing dependencies
npm install class-variance-authority@^0.7.0 \
  @hookform/resolvers@^3.3.2 \
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
  cmdk@^0.2.0 \
  date-fns@^2.30.0 \
  embla-carousel-react@^8.0.0 \
  react-day-picker@^8.9.1 \
  react-resizable-panels@^0.0.55 \
  sonner@^1.2.4 \
  vaul@^0.7.9 \
  zod@^3.22.4

echo "✅ Dependencies installed successfully!"
echo "🚀 Try running 'npm run dev' again."
