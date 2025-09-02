import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Receipt, DollarSign, Clock, Download } from 'lucide-react';

interface QuickActionsCardProps {
  onCreateInvoiceItem?: () => void;
  onCreateFromTime?: () => void;
  onMarkAsInvoiced?: () => void;
  onMarkAsPaid?: () => void;
  onExportToFortnox?: () => void;
  onExportPlainText?: () => void;
}

export function QuickActionsCard({ 
  onCreateInvoiceItem,
  onCreateFromTime,
  onMarkAsInvoiced,
  onMarkAsPaid,
  onExportToFortnox,
  onExportPlainText 
}: QuickActionsCardProps) {
  const actions = [
    {
      title: 'New Invoice Item',
      description: 'Create manual invoice item',
      icon: Plus,
      onClick: onCreateInvoiceItem,
      color: 'text-blue-600 bg-blue-100',
      disabled: false,
    },
    {
      title: 'From Time Entries',
      description: 'Convert time to invoice items',
      icon: Clock,
      onClick: onCreateFromTime,
      color: 'text-green-600 bg-green-100',
      disabled: false,
    },
    {
      title: 'Mark as Invoiced',
      description: 'Update status to invoiced',
      icon: Receipt,
      onClick: onMarkAsInvoiced,
      color: 'text-orange-600 bg-orange-100',
      disabled: false,
    },
    {
      title: 'Mark as Paid',
      description: 'Update status to paid',
      icon: DollarSign,
      onClick: onMarkAsPaid,
      color: 'text-green-600 bg-green-100',
      disabled: false,
    },
    {
      title: 'Export to Fortnox',
      description: 'Export to Fortnox API',
      icon: FileText,
      onClick: onExportToFortnox,
      color: 'text-purple-600 bg-purple-100',
      disabled: false,
    },
    {
      title: 'Export as Text',
      description: 'Download readable text files',
      icon: Download,
      onClick: onExportPlainText,
      color: 'text-teal-600 bg-teal-100',
      disabled: false,
    },
  ];

  return (
    <Card className="h-[480px]">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`h-auto p-4 justify-start ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
                onClick={action.disabled ? undefined : action.onClick}
                disabled={action.disabled}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-full ${action.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
