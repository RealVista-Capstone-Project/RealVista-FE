'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PropertyHeader } from '@/features/property-header';
import { PropertyGallery } from '@/features/property-gallery';
import { PriceAndTour } from '@/features/price-and-tour';
import { PropertyAbout } from '@/features/property-about';
import { MonthlyCostBreakdown } from '@/features/monthly-cost-breakdown';
import type { Property } from '@/entities/property';
import type { Listing } from '@/entities/listing';
import { mapListingToProperty } from '@/entities/listing/lib/listing-to-property.mapper';
import { useSendMessage } from '@/entities/conversation';
import { mapListingToChatData } from '@/entities/conversation/lib/map-listing-to-chat-data';
import { ContactModal } from '@/widgets/contact-modal';
import type { ContactFormData } from '@/entities/contact';
import { useListingFavorite } from '@/features/bookmark';
import { useAuthSession } from '@/features/auth/model';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import { Button } from '@/shared/ui/button';
import { SimilarListings } from '@/widgets/similar-listings';
import { BookTourModal } from '@/features/price-and-tour/ui/book-tour-modal';
import { useRouter, useParams } from 'next/navigation';
import { useChatWindowStore } from '@/entities/contact';
import { isAuthenticated } from '@/features/auth/model';
import { unwrapApiResponse } from '@/shared/types/api';
import type { SendMessageResponse } from '@/entities/conversation/model/types';
import { formatVND } from '@/shared/lib/utils/format-currency';
import { useIsMobile } from '@/shared/lib/hooks/use-mobile';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import { behaviorTracker } from '@/shared/lib/analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog/dialog';

export interface ListingDetailScreenProps {
  listing: Listing;
}

export function ListingDetailScreen({ listing }: ListingDetailScreenProps) {
  const property: Property = mapListingToProperty(listing);
  const [isBookTourOpen, setIsBookTourOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { data: session } = useAuthSession();
  const t = useTranslations('PropertyCard');
  const sendMessage = useSendMessage();
  const chatListingData = mapListingToChatData(listing);
  const router = useRouter();
  const params = useParams();
  const { openWindow } = useChatWindowStore();
  const isMobile = useIsMobile();

  const { isFavorite, toggleFavorite } = useListingFavorite(
    listing.listing_id,
    listing.is_favorite ?? false
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);

  // Track listing view on mount
  useEffect(() => {
    behaviorTracker.trackView(listing.listing_id, {
      listing_type: listing.listing_type,
      property_type: listing.property_type.property_type_name,
      price: listing.price,
      source_page: 'detail',
    });
  }, [listing.listing_id, listing.listing_type, listing.property_type.property_type_name, listing.price]);

  const handleFavorite = () => {
    if (!session?.user) {
      setShowLoginModal(true);
      return;
    }
    if (isFavorite) {
      setShowUnfavoriteConfirm(true);
    } else {
      toggleFavorite();
    }
  };

  const handleConfirmUnfavorite = () => {
    setShowUnfavoriteConfirm(false);
    toggleFavorite();
  };

  const handleBrowseNearby = () => {
    // Browse nearby listings
  };

  const handleViewAllPhotos = () => {
    // Open photo gallery
  };

  const handle3DTour = () => {
    // Open 3D tour
  };

  const handleVideo = () => {
    // Play video
  };

  const handleContact = () => {
    if (!isAuthenticated(session)) {
      const locale = params?.locale || 'vi';
      router.push(`/${locale}/login`);
      return;
    }
    setIsContactModalOpen(true);
  };

  const handleSendContact = async (data: ContactFormData) => {
    const response = await sendMessage.mutateAsync({
      recipient_user_id: listing.agent.user_id,
      message_type: 'LISTING_CARD',
      content: data.message,
      metadata: JSON.stringify(chatListingData),
    });

    if (response) {
      const sendResult = unwrapApiResponse<SendMessageResponse>(response);
      const conversationId = sendResult.conversation_id;

      if (conversationId) {
        if (isMobile) {
          const locale = params?.locale || 'vi';
          router.push(`/${locale}/messages/${conversationId}`);
        } else {
          openWindow(conversationId, {
            id: listing.agent.user_id,
            name: listing.agent.full_name,
            avatar: listing.agent.avatar_url,
          });
        }
      }
    }
  };

  const handleRequestTour = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setIsBookTourOpen(true);
  };

  const formattedPrice = formatVND(property.price);

  return (
    <div className='min-h-screen bg-background pb-[88px] md:pb-8'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-8'>
        <PropertyHeader
          property={property}
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
          onBrowseNearby={handleBrowseNearby}
        />

        {/* Gallery Section */}
        <div className='mt-4 sm:mt-8'>
          <PropertyGallery
            images={property.images}
            onViewAllPhotos={handleViewAllPhotos}
            on3DTour={handle3DTour}
            onVideo={handleVideo}
            onFavorite={handleFavorite}
            isFavorite={isFavorite}
          />
        </div>

        {/* Responsive layout: mobile column, desktop row */}
        <div className='mt-6 sm:mt-10 flex flex-col md:flex-row md:gap-10'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            {/* Mobile: Price & Tour Section (shown inline) */}
            <div className='md:hidden mb-6'>
              <PriceAndTour
                price={property.price}
                listingType={listing.listing_type}
                phone={listing.agent.phone}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>

            {/* About Section */}
            <div className='mb-6'>
              <PropertyAbout property={property} />
            </div>

            {/* Monthly Cost Breakdown Section */}
            {property.costBreakdown && (
              <MonthlyCostBreakdown costBreakdown={property.costBreakdown} />
            )}
          </div>

          {/* Desktop: Price & Tour Sidebar */}
          <div className='hidden md:block mt-6 md:mt-0 w-full max-w-[380px] shrink-0'>
            <div className='md:sticky md:top-8'>
              <PriceAndTour
                price={property.price}
                listingType={listing.listing_type}
                phone={listing.agent.phone}
                onContact={handleContact}
                onRequestTour={handleRequestTour}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings Section - Full Width */}
      <div className='mt-12 sm:mt-16'>
        <SimilarListings propertyId={property.id} />
      </div>

      {/* Contact Modal */}
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        listing={chatListingData}
        agentName={listing.agent.full_name}
        onSend={handleSendContact}
        userInfo={
          session?.user
            ? {
                fullName: session.user.name || '',
                email: session.user.email,
                phone: '',
              }
            : undefined
        }
      />

      {/* Mobile Sticky Footer */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-purple-92 px-4 py-3 sm:px-6 md:hidden z-50'>
        <div className='max-w-[1200px] mx-auto flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-4'>
          <div className='w-full xs:w-auto mb-2 xs:mb-0'>
            <p className='text-main-black/50 text-xs font-medium leading-[1.4]'>
              {listing.listing_type === 'RENT' ? 'Rent price' : 'Sale price'}
            </p>
            <div className='flex items-baseline gap-1'>
              <p className='text-main-primary text-xl font-extrabold leading-[1.5] tracking-tight'>
                {formattedPrice}
              </p>
              {listing.listing_type === 'RENT' && (
                <span className='text-main-black/50 text-sm font-medium'>/month</span>
              )}
            </div>
          </div>
          <RealVistaButton
            variant='primary'
            size='medium'
            className='w-full xs:w-auto max-w-[200px]'
            onClick={handleContact}
          >
            Apply Now
          </RealVistaButton>
        </div>
      </div>

      <BookTourModal
        listingId={property.id}
        isOpen={isBookTourOpen}
        onClose={() => setIsBookTourOpen(false)}
      />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Dialog open={showUnfavoriteConfirm} onOpenChange={setShowUnfavoriteConfirm}>
        <DialogContent className='max-w-sm p-8'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Heart className='h-5 w-5 fill-purple-100 text-main-primary' strokeWidth={2} />
              {t('confirmUnfavoriteTitle')}
            </DialogTitle>
            <DialogDescription>{t('confirmUnfavoriteMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-6 gap-2'>
            <DialogClose asChild>
              <Button variant='outline' className='flex-1 pt-2'>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button
              onClick={handleConfirmUnfavorite}
              className='flex-1 bg-main-primary hover:bg-main-primary/90 text-white border-0'
            >
              {t('unfavorite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
