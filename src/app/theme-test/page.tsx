'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function ThemeTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Theme Test Page</h1>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Light Mode</CardTitle>
              <CardDescription>
                This card should look great in light mode with proper contrast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dark Mode</CardTitle>
              <CardDescription>
                This card should look great in dark mode with proper contrast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Testing various color combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-primary text-primary-foreground rounded">
                  Primary Background
                </div>
                <div className="p-3 bg-secondary text-secondary-foreground rounded">
                  Secondary Background
                </div>
                <div className="p-3 bg-muted text-muted-foreground rounded">
                  Muted Background
                </div>
                <div className="p-3 bg-accent text-accent-foreground rounded">
                  Accent Background
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Theme Instructions</CardTitle>
            <CardDescription>
              How to use the light and dark mode system
            </CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h3>Features Implemented:</h3>
            <ul>
              <li>✅ Automatic system theme detection</li>
              <li>✅ Manual light/dark/system toggle</li>
              <li>✅ Smooth transitions between themes</li>
              <li>✅ Theme persistence across sessions</li>
              <li>✅ Hydration-safe theme toggle</li>
              <li>✅ Theme toggle in dashboard layout</li>
              <li>✅ Theme toggle on public pages (login, home)</li>
              <li>✅ Adaptive favicon for light/dark modes</li>
            </ul>

            <h3>How to Use:</h3>
            <p>
              The theme system automatically detects your system preference by default. 
              You can manually switch between light, dark, and system modes using the 
              theme toggle button in the top navigation.
            </p>

            <h3>For Developers:</h3>
            <p>
              Use the CSS variables defined in <code>globals.css</code> for consistent 
              theming. All shadcn/ui components automatically adapt to the current theme.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
