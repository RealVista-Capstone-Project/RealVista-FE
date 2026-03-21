import { ManageAgentDetailPage } from '@/screens/manage-agent-detail';
import type { AgentEngagement } from '@/entities/agent-engagement';

// TODO: remove mock and restore AgentEngagementDetailLoader when API is ready
const MOCK_ENGAGEMENT: AgentEngagement = {
  engagement_id: 'eng-mock-001',
  agent_user_id: 'user-agent-001',
  agent_full_name: 'Nguyen Thi Lan',
  agent_avatar_url: null,
  agent_email: 'lan.nguyen@realestate.vn',
  agent_phone: '+84 091 234 5678',
  agent_bio:
    'Experienced real estate agent with over 8 years in the Ho Chi Minh City market. Specializing in residential properties in Districts 2, 7, and Binh Thanh. Committed to finding the best deals for my clients.',
  agent_specialties: ['Residential', 'Luxury Apartments', 'Investment Properties'],
  agent_service_areas: ['District 2', 'District 7', 'Binh Thanh'],
  agent_rating: 4.7,
  agent_years_of_experience: 8,
  agent_properties_sold: 53,
  property_id: 'prop-001',
  property_address: '123 Nguyen Van Linh, District 7, Ho Chi Minh City',
  property_type_name: 'Apartment',
  property_location_name: 'District 7, Ho Chi Minh City',
  engagement_type: 'SALE',
  status: 'ACTIVE',
  hired_at: '2024-11-15T08:00:00Z',
  has_review: false,
};

interface ManageAgentDetailRouteProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ManageAgentDetailRoute({ params }: ManageAgentDetailRouteProps) {
  await params;
  return <ManageAgentDetailPage initialAgent={MOCK_ENGAGEMENT} />;
}
