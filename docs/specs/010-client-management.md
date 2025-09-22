# Client Management Specification

**Spec ID:** 010-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Client Management system provides comprehensive customer relationship management for consultant businesses, including contact management, billing information, project associations, communication tracking, and client portfolio analysis. It serves as the foundation for project management, invoicing, and business development activities.

## Feature Requirements

### Functional Requirements

#### Core Client Management Capabilities

##### Client Profile Management

- Comprehensive client information storage and organization
- Contact person management with roles and responsibilities
- Company details including industry, size, and business context
- Billing and payment preferences with terms and methods
- Communication history and interaction tracking
- Document storage and file management for client-related materials

##### Relationship Management

- Client status tracking (Prospect, Active, Inactive, Former)
- Relationship strength assessment and engagement metrics
- Communication preferences and contact scheduling
- Client satisfaction tracking and feedback management
- Opportunity identification and business development pipeline
- Client hierarchy support for multi-division organizations

##### Financial Integration

- Billing rate management with role-based and project-based rates
- Payment terms configuration and enforcement
- Credit limit and payment history tracking
- Outstanding invoice monitoring and aging reports
- Revenue analytics and client profitability analysis
- Contract and agreement management with renewal tracking

### Technical Specifications

#### Data Models

```typescript
interface Client {
  id: string;
  user_id: string;
  
  // Basic information
  name: string;
  legal_name?: string;
  org_number?: string;
  vat_number?: string;
  industry: string;
  company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  
  // Contact information
  email: string;
  phone?: string;
  website?: string;
  
  // Address information
  address: Address;
  billing_address?: Address;
  
  // Business details
  description?: string;
  status: 'prospect' | 'active' | 'inactive' | 'former';
  relationship_strength: 1 | 2 | 3 | 4 | 5; // Weak to Strong
  
  // Financial configuration
  default_billing_rate?: number;
  payment_terms: number; // Days
  preferred_payment_method?: string;
  credit_limit?: number;
  
  // Metadata
  acquisition_date?: string;
  last_contact_date?: string;
  next_follow_up?: string;
  tags: string[];
  
  created_at: string;
  updated_at: string;
}

interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  state_province?: string;
}

interface ClientContact {
  id: string;
  client_id: string;
  
  // Personal information
  first_name: string;
  last_name: string;
  title: string;
  department?: string;
  
  // Contact details
  email: string;
  phone?: string;
  mobile?: string;
  
  // Role and access
  role: 'primary' | 'billing' | 'technical' | 'decision_maker' | 'stakeholder';
  is_primary: boolean;
  can_approve_invoices: boolean;
  
  // Preferences
  preferred_contact_method: 'email' | 'phone' | 'both';
  communication_notes?: string;
  
  created_at: string;
  updated_at: string;
}

interface ClientInteraction {
  id: string;
  client_id: string;
  contact_id?: string;
  
  // Interaction details
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'contract' | 'support';
  subject: string;
  description: string;
  
  // Timing
  interaction_date: string;
  duration_minutes?: number;
  
  // Outcome and follow-up
  outcome: 'positive' | 'neutral' | 'negative' | 'pending';
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  
  // Attachments and references
  documents: string[]; // File URLs
  project_id?: string;
  invoice_id?: string;
  
  created_at: string;
  updated_at: string;
}

interface ClientDocument {
  id: string;
  client_id: string;
  
  // Document details
  name: string;
  type: 'contract' | 'proposal' | 'invoice' | 'nda' | 'statement_of_work' | 'other';
  file_url: string;
  file_size: number;
  mime_type: string;
  
  // Metadata
  description?: string;
  tags: string[];
  is_confidential: boolean;
  
  // Version control
  version: string;
  supersedes_document_id?: string;
  
  created_at: string;
  updated_at: string;
}

interface ClientBillingConfiguration {
  id: string;
  client_id: string;
  
  // Rate structure
  default_hourly_rate: number;
  role_based_rates: RoleRate[];
  project_based_rates: ProjectRate[];
  
  // Billing preferences
  billing_frequency: 'weekly' | 'biweekly' | 'monthly' | 'project_based';
  payment_terms: number;
  late_fee_rate?: number;
  discount_percentage?: number;
  
  // Invoice configuration
  purchase_order_required: boolean;
  invoice_format_preferences: InvoiceFormatPreferences;
  
  created_at: string;
  updated_at: string;
}

interface RoleRate {
  role: string;
  rate: number;
  effective_from: string;
  effective_to?: string;
}

interface ProjectRate {
  project_type: string;
  rate: number;
  is_fixed_price: boolean;
  fixed_amount?: number;
}
```

#### Client Management Hook

```typescript
export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ClientFilters>({});

  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          status: clientData.status || 'prospect',
          relationship_strength: clientData.relationship_strength || 3,
          payment_terms: clientData.payment_terms || 30,
          tags: clientData.tags || []
        }])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data]);
      
      // Create default billing configuration
      await createDefaultBillingConfiguration(data.id, clientData.default_billing_rate);
      
      return data;
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClient = useCallback(async (
    clientId: string, 
    updates: Partial<Client>
  ) => {
    const { error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (error) throw error;

    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    ));

    if (selectedClient?.id === clientId) {
      setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedClient]);

  const addClientContact = useCallback(async (
    clientId: string,
    contactData: Omit<ClientContact, 'id' | 'client_id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error } = await supabase
      .from('client_contacts')
      .insert([{
        ...contactData,
        client_id: clientId
      }])
      .select()
      .single();

    if (error) throw error;

    return data;
  }, []);

  const recordInteraction = useCallback(async (
    interactionData: Omit<ClientInteraction, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const { data, error } = await supabase
      .from('client_interactions')
      .insert([interactionData])
      .select()
      .single();

    if (error) throw error;

    // Update client's last contact date
    await updateClient(interactionData.client_id, {
      last_contact_date: interactionData.interaction_date
    });

    return data;
  }, [updateClient]);

  const getClientAnalytics = useCallback(async (clientId: string) => {
    const [revenue, projects, interactions] = await Promise.all([
      getClientRevenue(clientId),
      getClientProjects(clientId),
      getClientInteractionStats(clientId)
    ]);

    return {
      totalRevenue: revenue.total,
      revenueThisYear: revenue.currentYear,
      projectCount: projects.total,
      activeProjects: projects.active,
      lastInteraction: interactions.lastDate,
      interactionFrequency: interactions.frequency,
      relationshipHealth: calculateRelationshipHealth(interactions, revenue)
    };
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = searchTerm === '' || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || client.status === filters.status;
      const matchesIndustry = !filters.industry || client.industry === filters.industry;
      const matchesRelationship = !filters.relationshipStrength || 
        client.relationship_strength === filters.relationshipStrength;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesRelationship;
    });
  }, [clients, searchTerm, filters]);

  return {
    clients: filteredClients,
    selectedClient,
    loading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    setSelectedClient,
    createClient,
    updateClient,
    addClientContact,
    recordInteraction,
    getClientAnalytics,
    refreshClients: () => fetchClients()
  };
};
```

### User Interface Specifications

#### Client Dashboard

```typescript
const ClientDashboard = () => {
  const { 
    clients, 
    searchTerm, 
    setSearchTerm, 
    filters, 
    setFilters 
  } = useClientManagement();

  const clientStats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    totalRevenue: calculateTotalRevenue(clients)
  }), [clients]);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage client relationships and business development
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Client statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {clientStats.active} active clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getActiveProjectsCount(clients)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(clientStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time client revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.prospects}</div>
            <p className="text-xs text-muted-foreground">
              Potential new clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Select 
          value={filters.status || 'all'} 
          onValueChange={(value) => setFilters({
            ...filters, 
            status: value === 'all' ? undefined : value as Client['status']
          })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="former">Former</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.industry || 'all'}
          onValueChange={(value) => setFilters({
            ...filters,
            industry: value === 'all' ? undefined : value
          })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client list */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{client.industry}</Badge>
                </TableCell>
                <TableCell>
                  <ClientStatusBadge status={client.status} />
                </TableCell>
                <TableCell>
                  <RelationshipStrengthIndicator 
                    strength={client.relationship_strength} 
                  />
                </TableCell>
                <TableCell>
                  {client.last_contact_date ? 
                    formatDate(client.last_contact_date) : 
                    'Never'
                  }
                </TableCell>
                <TableCell>
                  {formatCurrency(getClientRevenue(client.id))}
                </TableCell>
                <TableCell className="text-right">
                  <ClientActions client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
```

#### Client Profile Page

```typescript
const ClientProfile = ({ clientId }: { clientId: string }) => {
  const { selectedClient, setSelectedClient, getClientAnalytics } = useClientManagement();
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadClientData = async () => {
      if (clientId) {
        const [clientData, analyticsData] = await Promise.all([
          fetchClientDetails(clientId),
          getClientAnalytics(clientId)
        ]);
        
        setSelectedClient(clientData);
        setAnalytics(analyticsData);
      }
    };

    loadClientData();
  }, [clientId]);

  if (!selectedClient) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Client header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={selectedClient.logo_url} />
            <AvatarFallback>
              {selectedClient.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{selectedClient.name}</h1>
            <p className="text-muted-foreground">{selectedClient.industry}</p>
            <div className="flex items-center gap-2 mt-2">
              <ClientStatusBadge status={selectedClient.status} />
              <RelationshipStrengthIndicator 
                strength={selectedClient.relationship_strength} 
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Contact
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/clients/${clientId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/projects/new?client=${clientId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/invoices/new?client=${clientId}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics?.revenueThisYear || 0)} this year
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.projectCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.activeProjects || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Contact</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.lastInteraction ? 
                formatRelativeDate(analytics.lastInteraction) : 
                'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.interactionFrequency || 'No pattern'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relationship Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <RelationshipHealthIndicator 
                health={analytics?.relationshipHealth || 0} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Based on activity & revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ClientOverviewTab client={selectedClient} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <ClientContactsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ClientProjectsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <ClientInteractionsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <ClientDocumentsTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Database Schema

#### Client Management Tables

```sql
-- Main clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic information
  name TEXT NOT NULL,
  legal_name TEXT,
  org_number TEXT,
  vat_number TEXT,
  industry TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  
  -- Contact information
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  
  -- Address information
  address JSONB NOT NULL,
  billing_address JSONB,
  
  -- Business details
  description TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'inactive', 'former')),
  relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 5),
  
  -- Financial configuration
  default_billing_rate DECIMAL(10,2),
  payment_terms INTEGER DEFAULT 30,
  preferred_payment_method TEXT,
  credit_limit DECIMAL(12,2),
  
  -- Metadata
  acquisition_date DATE,
  last_contact_date DATE,
  next_follow_up DATE,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client contacts table
CREATE TABLE client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Personal information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  
  -- Contact details
  email TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,
  
  -- Role and access
  role TEXT NOT NULL CHECK (role IN ('primary', 'billing', 'technical', 'decision_maker', 'stakeholder')),
  is_primary BOOLEAN DEFAULT FALSE,
  can_approve_invoices BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
  communication_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client interactions table
CREATE TABLE client_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
  
  -- Interaction details
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'proposal', 'contract', 'support')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Timing
  interaction_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  
  -- Outcome and follow-up
  outcome TEXT DEFAULT 'neutral' CHECK (outcome IN ('positive', 'neutral', 'negative', 'pending')),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- References
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client documents table
CREATE TABLE client_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Document details
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'proposal', 'invoice', 'nda', 'statement_of_work', 'other')),
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_confidential BOOLEAN DEFAULT FALSE,
  
  -- Version control
  version TEXT DEFAULT '1.0',
  supersedes_document_id UUID REFERENCES client_documents(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client billing configurations table
CREATE TABLE client_billing_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Rate structure
  default_hourly_rate DECIMAL(10,2) NOT NULL,
  role_based_rates JSONB DEFAULT '[]',
  project_based_rates JSONB DEFAULT '[]',
  
  -- Billing preferences
  billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('weekly', 'biweekly', 'monthly', 'project_based')),
  payment_terms INTEGER DEFAULT 30,
  late_fee_rate DECIMAL(5,4),
  discount_percentage DECIMAL(5,4),
  
  -- Invoice configuration
  purchase_order_required BOOLEAN DEFAULT FALSE,
  invoice_format_preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_clients_user_status ON clients(user_id, status);
CREATE INDEX idx_clients_industry ON clients(industry);
CREATE INDEX idx_clients_relationship ON clients(relationship_strength);
CREATE INDEX idx_clients_last_contact ON clients(last_contact_date);
CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_primary ON client_contacts(client_id, is_primary);
CREATE INDEX idx_client_interactions_client_date ON client_interactions(client_id, interaction_date DESC);
CREATE INDEX idx_client_interactions_follow_up ON client_interactions(follow_up_date) WHERE follow_up_required = TRUE;
CREATE INDEX idx_client_documents_client_type ON client_documents(client_id, type);

-- Text search indexes
CREATE INDEX idx_clients_search ON clients USING GIN(
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || email)
);
CREATE INDEX idx_client_interactions_search ON client_interactions USING GIN(
  to_tsvector('english', subject || ' ' || description)
);

-- GIN indexes for array columns
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX idx_client_documents_tags ON client_documents USING GIN(tags);

-- Ensure only one primary contact per client
CREATE UNIQUE INDEX idx_client_contacts_one_primary ON client_contacts(client_id) 
WHERE is_primary = TRUE;

-- Unique constraint for client names per user
CREATE UNIQUE INDEX idx_clients_user_name ON clients(user_id, LOWER(name));
```

#### Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_billing_configurations ENABLE ROW LEVEL SECURITY;

-- Client policies
CREATE POLICY "Users can access own clients" 
ON clients FOR ALL 
USING (auth.uid() = user_id);

-- Client contacts policies (access through parent client)
CREATE POLICY "Users can access own client contacts" 
ON client_contacts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_contacts.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Client interactions policies
CREATE POLICY "Users can access own client interactions" 
ON client_interactions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_interactions.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Client documents policies
CREATE POLICY "Users can access own client documents" 
ON client_documents FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_documents.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Billing configurations policies
CREATE POLICY "Users can access own billing configurations" 
ON client_billing_configurations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = client_billing_configurations.client_id 
    AND clients.user_id = auth.uid()
  )
);
```

### Business Logic

#### Relationship Health Calculation

```typescript
const calculateRelationshipHealth = (
  interactions: ClientInteraction[],
  revenue: { total: number; currentYear: number }
): number => {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);
  
  // Recent interaction score (0-30 points)
  const recentInteractions = interactions.filter(i => 
    new Date(i.interaction_date) >= thirtyDaysAgo
  );
  const interactionScore = Math.min(recentInteractions.length * 5, 30);
  
  // Interaction quality score (0-25 points)
  const positiveInteractions = interactions.filter(i => 
    i.outcome === 'positive' && new Date(i.interaction_date) >= ninetyDaysAgo
  );
  const qualityScore = Math.min(positiveInteractions.length * 8, 25);
  
  // Revenue consistency score (0-25 points)
  const revenueScore = revenue.currentYear > 0 ? 
    Math.min((revenue.currentYear / revenue.total) * 25, 25) : 0;
  
  // Follow-up completion score (0-20 points)
  const overdueFollowUps = interactions.filter(i => 
    i.follow_up_required && 
    i.follow_up_date && 
    new Date(i.follow_up_date) < now &&
    !hasFollowUpCompleted(i.id)
  );
  const followUpScore = Math.max(20 - (overdueFollowUps.length * 5), 0);
  
  return Math.round(interactionScore + qualityScore + revenueScore + followUpScore);
};

const suggestNextActions = (client: Client, analytics: ClientAnalytics): ActionSuggestion[] => {
  const suggestions: ActionSuggestion[] = [];
  const daysSinceLastContact = client.last_contact_date ? 
    differenceInDays(new Date(), new Date(client.last_contact_date)) : 
    Infinity;

  // Contact frequency suggestions
  if (daysSinceLastContact > 90 && client.status === 'active') {
    suggestions.push({
      type: 'contact',
      priority: 'high',
      action: 'Schedule check-in call',
      reason: 'No contact in over 90 days',
      suggested_date: addDays(new Date(), 1)
    });
  }

  // Project opportunities
  if (analytics.relationshipHealth > 70 && analytics.activeProjects === 0) {
    suggestions.push({
      type: 'business_development',
      priority: 'medium',
      action: 'Explore new project opportunities',
      reason: 'Strong relationship with no active projects',
      suggested_date: addDays(new Date(), 7)
    });
  }

  // Invoice follow-up
  const overdueInvoices = getOverdueInvoices(client.id);
  if (overdueInvoices.length > 0) {
    suggestions.push({
      type: 'billing',
      priority: 'high',
      action: 'Follow up on overdue invoices',
      reason: `${overdueInvoices.length} overdue invoice(s)`,
      suggested_date: new Date()
    });
  }

  return suggestions;
};
```

#### Client Analytics Functions

```typescript
const getClientRevenue = async (clientId: string): Promise<ClientRevenue> => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount, issue_date, status')
    .eq('client_id', clientId)
    .eq('status', 'paid');

  const currentYear = new Date().getFullYear();
  
  const total = invoices?.reduce((sum, inv) => sum + inv.paid_amount, 0) || 0;
  const currentYearRevenue = invoices?.filter(inv => 
    new Date(inv.issue_date).getFullYear() === currentYear
  ).reduce((sum, inv) => sum + inv.paid_amount, 0) || 0;

  return {
    total,
    currentYear: currentYearRevenue,
    averageInvoiceValue: invoices?.length ? total / invoices.length : 0,
    lastPaymentDate: invoices?.sort((a, b) => 
      new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    )[0]?.issue_date
  };
};

const getClientProjects = async (clientId: string): Promise<ClientProjects> => {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, status, start_date, end_date')
    .eq('client_id', clientId);

  const active = projects?.filter(p => p.status === 'active').length || 0;
  const completed = projects?.filter(p => p.status === 'completed').length || 0;
  const total = projects?.length || 0;

  return {
    total,
    active,
    completed,
    successRate: total > 0 ? (completed / total) * 100 : 0
  };
};

const getClientInteractionStats = async (clientId: string): Promise<InteractionStats> => {
  const { data: interactions } = await supabase
    .from('client_interactions')
    .select('interaction_date, type, outcome')
    .eq('client_id', clientId)
    .order('interaction_date', { ascending: false });

  if (!interactions?.length) {
    return {
      lastDate: null,
      frequency: 'No interactions',
      averageResponseTime: 0,
      positiveInteractionRate: 0
    };
  }

  const lastDate = interactions[0].interaction_date;
  const positiveCount = interactions.filter(i => i.outcome === 'positive').length;
  const positiveRate = (positiveCount / interactions.length) * 100;

  // Calculate interaction frequency
  const dates = interactions.map(i => new Date(i.interaction_date));
  const daysBetweenInteractions = [];
  for (let i = 1; i < dates.length; i++) {
    daysBetweenInteractions.push(
      differenceInDays(dates[i-1], dates[i])
    );
  }

  const averageDaysBetween = daysBetweenInteractions.length > 0 ?
    daysBetweenInteractions.reduce((sum, days) => sum + days, 0) / daysBetweenInteractions.length :
    0;

  let frequency = 'Irregular';
  if (averageDaysBetween <= 7) frequency = 'Weekly';
  else if (averageDaysBetween <= 14) frequency = 'Bi-weekly';
  else if (averageDaysBetween <= 30) frequency = 'Monthly';
  else if (averageDaysBetween <= 90) frequency = 'Quarterly';

  return {
    lastDate,
    frequency,
    averageResponseTime: averageDaysBetween,
    positiveInteractionRate: positiveRate
  };
};
```

### Integration with Other Systems

#### Project Management Integration

```typescript
// Auto-create client when creating project
const handleProjectCreation = async (projectData: ProjectFormData) => {
  if (projectData.create_new_client && projectData.client_info) {
    const newClient = await createClient({
      ...projectData.client_info,
      status: 'active',
      relationship_strength: 3
    });
    
    projectData.client_id = newClient.id;
  }

  // Record interaction for project kickoff
  if (projectData.client_id) {
    await recordInteraction({
      client_id: projectData.client_id,
      type: 'meeting',
      subject: 'Project Kickoff',
      description: `Started new project: ${projectData.name}`,
      interaction_date: new Date().toISOString(),
      outcome: 'positive'
    });
  }
};

// Update client relationship strength based on project success
const handleProjectCompletion = async (projectId: string, outcome: 'success' | 'failure') => {
  const { data: project } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .single();

  if (project?.client_id) {
    const strengthDelta = outcome === 'success' ? 1 : -1;
    
    await supabase.rpc('update_relationship_strength', {
      client_id: project.client_id,
      delta: strengthDelta
    });

    // Record completion interaction
    await recordInteraction({
      client_id: project.client_id,
      type: 'meeting',
      subject: 'Project Completion',
      description: `Project completed with ${outcome}`,
      interaction_date: new Date().toISOString(),
      outcome: outcome === 'success' ? 'positive' : 'negative',
      project_id: projectId
    });
  }
};
```

#### Invoice Integration

```typescript
// Update payment terms and client info when invoice is created
const syncInvoiceWithClient = async (invoiceId: string) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('id', invoiceId)
    .single();

  if (invoice?.client) {
    // Use client's payment terms if not specified
    if (!invoice.payment_terms) {
      await supabase
        .from('invoices')
        .update({ payment_terms: invoice.client.payment_terms })
        .eq('id', invoiceId);
    }

    // Record billing interaction
    await recordInteraction({
      client_id: invoice.client_id,
      type: 'proposal',
      subject: `Invoice ${invoice.invoice_number}`,
      description: `Sent invoice for ${formatCurrency(invoice.total_amount)}`,
      interaction_date: invoice.issue_date,
      outcome: 'neutral',
      invoice_id: invoiceId
    });
  }
};

// Update client when payment is received
const handleInvoicePayment = async (invoiceId: string, paymentDate: string) => {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('client_id, total_amount, invoice_number')
    .eq('id', invoiceId)
    .single();

  if (invoice) {
    // Update last contact date
    await supabase
      .from('clients')
      .update({ last_contact_date: paymentDate })
      .eq('id', invoice.client_id);

    // Record payment interaction
    await recordInteraction({
      client_id: invoice.client_id,
      type: 'contract', // Payment received
      subject: `Payment Received`,
      description: `Received payment for invoice ${invoice.invoice_number}`,
      interaction_date: paymentDate,
      outcome: 'positive',
      invoice_id: invoiceId
    });
  }
};
```

### Performance Optimizations

#### Client Data Caching

```typescript
const useClientCache = () => {
  const [cache, setCache] = useState<Map<string, CachedClientData>>(new Map());

  const getCachedClient = (clientId: string) => {
    const cached = cache.get(clientId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
      return cached.data;
    }
    return null;
  };

  const setCachedClient = (clientId: string, data: Client) => {
    setCache(prev => new Map(prev.set(clientId, {
      data,
      timestamp: Date.now()
    })));
  };

  const invalidateClientCache = (clientId?: string) => {
    if (clientId) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(clientId);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  };

  return { getCachedClient, setCachedClient, invalidateClientCache };
};
```

#### Batch Operations

```typescript
const useBatchClientOperations = () => {
  const updateMultipleClients = useCallback(async (
    updates: Array<{ id: string; data: Partial<Client> }>
  ) => {
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('clients')
        .update(data)
        .eq('id', id)
    );

    await Promise.all(promises);
  }, []);

  const bulkImportClients = useCallback(async (
    clientsData: Array<Omit<Client, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < clientsData.length; i += batchSize) {
      batches.push(clientsData.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await supabase
        .from('clients')
        .insert(batch);
    }
  }, []);

  return { updateMultipleClients, bulkImportClients };
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Client Management', () => {
  it('creates clients with proper defaults');
  it('calculates relationship health correctly');
  it('suggests appropriate next actions');
  it('handles contact management');
  it('tracks interactions properly');
});

describe('Client Analytics', () => {
  it('calculates revenue metrics accurately');
  it('analyzes interaction patterns');
  it('determines project success rates');
  it('provides relationship insights');
});
```

#### Integration Tests

```typescript
describe('Client System Integration', () => {
  it('integrates with project creation');
  it('syncs with invoice generation');
  it('updates from payment processing');
  it('maintains data consistency');
});
```

---

This specification ensures the Client Management system provides comprehensive relationship management capabilities while maintaining integration with project management, invoicing, and business analytics systems.