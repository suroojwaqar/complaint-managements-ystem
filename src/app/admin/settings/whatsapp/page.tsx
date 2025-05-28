import { Metadata } from 'next';
import WhatsAppSettingsPanel from '@/components/admin/whatsapp/WhatsAppSettingsPanel';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WhatsApp Settings - Admin Panel',
  description: 'Configure WhatsApp notifications for the complaint management system',
};

export default function WhatsAppSettingsPage() {
  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/settings">Settings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRightIcon className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink>WhatsApp</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mt-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Settings</h1>
          <p className="text-muted-foreground">
            Configure WhatsApp notifications for complaint management
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      <WhatsAppSettingsPanel />
    </div>
  );
}
