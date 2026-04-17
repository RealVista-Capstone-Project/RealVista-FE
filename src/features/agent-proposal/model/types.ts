export interface SubmitProposalPayload {
  property_id: string;
  title: string;
  message: string;
  offered_commission: string;
}

export interface OwnerPropertiesSearchCriteria {
  keyword?: string;
  propertyType?: string;
  page: number;
  size: number;
}
