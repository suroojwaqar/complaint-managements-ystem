// Standardized form validation rules
export const formValidationRules = {
  title: {
    required: 'Title is required',
    minLength: { value: 5, message: 'Title must be at least 5 characters' },
    maxLength: { value: 100, message: 'Title must not exceed 100 characters' }
  },
  description: {
    required: 'Description is required',
    minLength: { value: 20, message: 'Description must be at least 20 characters' },
    maxLength: { value: 1000, message: 'Description must not exceed 1000 characters' }
  },
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: { value: 6, message: 'Password must be at least 6 characters' },
    maxLength: { value: 128, message: 'Password must not exceed 128 characters' }
  },
  name: {
    required: 'Name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
    maxLength: { value: 50, message: 'Name must not exceed 50 characters' }
  },
  errorType: {
    required: 'Error type is required',
    minLength: { value: 3, message: 'Error type must be at least 3 characters' }
  },
  errorScreen: {
    required: 'Error screen is required',
    minLength: { value: 3, message: 'Error screen must be at least 3 characters' }
  },
  department: {
    required: 'Department is required'
  },
  natureType: {
    required: 'Nature type is required'
  },
  role: {
    required: 'Role is required'
  }
};

// Standardized layout classes
export const layoutClasses = {
  page: 'space-y-6 pb-10',
  container: 'container mx-auto p-4 max-w-7xl',
  section: 'space-y-4',
  header: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8',
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    stats: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    form: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  },
  card: {
    base: 'overflow-hidden',
    hover: 'hover:shadow-md transition-shadow cursor-pointer',
    gradient: 'bg-gradient-to-br',
    interactive: 'hover:shadow-md transition-all duration-200',
  },
  spacing: {
    section: 'mb-8',
    subsection: 'mb-6',
    item: 'mb-4',
  }
};

// Standardized button sizes and variants
export const buttonVariants = {
  sizes: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  },
  variants: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  }
};

// Standardized component patterns
export const componentPatterns = {
  statsCard: {
    base: 'overflow-hidden',
    gradient: {
      blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
      amber: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
      purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900',
      red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
      gray: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900',
    },
    icon: {
      blue: 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      green: 'bg-green-500/20 text-green-600 dark:bg-green-500/10 dark:text-green-400',
      amber: 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      purple: 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      red: 'bg-red-500/20 text-red-600 dark:bg-red-500/10 dark:text-red-400',
      gray: 'bg-gray-500/20 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
    }
  },
  search: {
    container: 'relative',
    input: 'pl-8 w-full md:w-60',
    icon: 'absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground',
  },
  filters: {
    container: 'grid grid-cols-1 md:grid-cols-4 gap-4',
    actions: 'flex items-center justify-between',
  }
};

// Common animation classes
export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};
