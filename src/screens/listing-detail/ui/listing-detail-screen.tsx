'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heart, ArrowLeft, MoreHorizontal, Flag, MessageCircle, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PropertyGallery } from '@/features/property-gallery';
import { PriceAndTour } from '@/features/price-and-tour';
import { PriceHistoryChart } from '@/features/listing';
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
import { ROUTES } from '@/shared/config/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/shared/ui/dialog/dialog';
import { useAiChatContext } from '@/widgets/ai-chat-assistant/model/use-ai-chat-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu/dropdown-menu';
import { SharePopover } from '@/features/property-header/ui/share-popover';
import { ReportDialog } from '@/features/listing-report';
import { AttributeIcon } from '@/shared/ui/attribute-icon';
import { RentalFeatures } from '@/features/rental-features';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { GoogleMap } from '@/shared/ui/map/google-map';

export interface ListingDetailScreenProps {
  listing: Listing;
  /** When true, renders a "Preview Mode" banner — listing is not yet published */
  isPreview?: boolean;
}

export function ListingDetailScreen({ listing, isPreview = false }: ListingDetailScreenProps) {
  const property: Property = mapListingToProperty(listing);
  const [isBookTourOpen, setIsBookTourOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { data: session } = useAuthSession();
  const t = useTranslations('PropertyCard');
  const tScreen = useTranslations('ListingDetailScreen');
  const sendMessage = useSendMessage();
  const chatListingData = mapListingToChatData(listing);
  const router = useRouter();
  const params = useParams();
  const { openWindow } = useChatWindowStore();
  const isMobile = useIsMobile();
  const isListingPostedByAgent = listing.user_type === 'AGENT';

  const { isFavorite, toggleFavorite } = useListingFavorite(
    listing.listing_id,
    listing.is_favorite ?? false
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);

  const { setCurrentListing } = useAiChatContext();

  // Get the share URL (current page URL)
  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, []);

  // Track listing view on mount
  useEffect(() => {
    behaviorTracker.trackView(listing.listing_id, {
      listing_type: listing.listing_type,
      property_type: listing.property_type.property_type_name,
      price: listing.price,
      source_page: 'detail',
    });

    // Set listing context for AI chat assistant
    setCurrentListing(listing);
    return () => setCurrentListing(null);
  }, [listing, setCurrentListing]);

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
      recipient_user_id: listing.agent!.user_id,
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
          router.push(`/${locale}${ROUTES.dashboard.messages}/${conversationId}`);
        } else {
          openWindow(conversationId, {
            id: listing.agent!.user_id,
            name: listing.agent!.full_name,
            avatar: listing.agent!.avatar_url,
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

  // Get attributes from listing
  const attributes = listing.attributes ?? [];

  return (
    <div className='min-h-screen bg-background pb-22 md:pb-0'>
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className='sticky top-0 z-40 w-full bg-amber-50 border-b border-amber-200'>
          <div className='max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2'>
            <span className='text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full'>
              {tScreen('previewBadge')}
            </span>
            <p className='text-sm font-medium text-amber-800'>
              {tScreen('previewMessage')}
            </p>
          </div>
        </div>
      )}

      <div className='max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-4 sm:py-8'>
        {/* Back Button */}
        <button
          type='button'
          onClick={() => router.back()}
          className='flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-sm mb-4'
        >
          <ArrowLeft className='size-4' />
          <span className='hidden sm:inline'>{tScreen('back')}</span>
        </button>

        {/* Row 1: Media (70%) + Contact/Book Tour (30%) */}
        <div className='flex flex-col lg:flex-row lg:gap-8'>
          {/* Left: Media Gallery + Info - 70% */}
          <div className='flex-1 min-w-0 lg:w-[70%]'>
            <PropertyGallery
              images={property.images}
              onViewAllPhotos={handleViewAllPhotos}
              on3DTour={handle3DTour}
              onVideo={handleVideo}
              onFavorite={handleFavorite}
              isFavorite={isFavorite}
            />

            {/* Property Info Section - Under Media */}
            <div className='mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
              {/* Title and Address */}
              <div className='flex flex-col gap-1'>
                <h1 className='text-xl sm:text-2xl font-bold leading-tight text-foreground break-words'>
                  {listing.name}
                </h1>
                <p className='text-sm text-muted-foreground break-words'>
                  {property.address}
                </p>
              </div>

              {/* Action buttons */}
              <div className='flex items-center gap-2'>
                {/* Share Button */}
                <SharePopover url={shareUrl} title={listing.name} variant="icon" />

                {/* Favorite Button */}
                <button
                  type='button'
                  onClick={handleFavorite}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background hover:bg-muted transition-colors ${isFavorite ? 'text-red-500' : ''}`}
                >
                  <Heart className={`size-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* More Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type='button'
                      className='flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background hover:bg-muted transition-colors'
                    >
                      <MoreHorizontal className='size-5' />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem
                      onClick={() => setIsReportOpen(true)}
                      className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
                    >
                      <Flag className='size-4 mr-2' />
                      {tScreen('report')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Attributes - Under Name/Address */}
            {attributes.length > 0 && (
              <div className='mt-6 bg-white border border-primary/10 rounded-xl p-5'>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6'>
                  {attributes.slice(0, 8).map((attribute) => (
                    <div key={attribute.attribute_id} className='flex flex-col gap-2'>
                      <p className='text-foreground/50 text-sm font-medium leading-[1.5]'>
                        {attribute.attribute_name}
                      </p>
                      <div className='flex items-center gap-2'>
                        <AttributeIcon
                          iconName={attribute.icon}
                          className='size-5 text-foreground/50'
                          strokeWidth={2}
                        />
                        <p className='text-foreground font-semibold text-sm leading-[1.45]'>
                          {attribute.display_value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs: Description & Amenities */}
            <div className='mt-6'>
              <Tabs defaultValue='description'>
                <TabsList variant='line' className='w-fit'>
                  <TabsTrigger value='description'>{tScreen('description')}</TabsTrigger>
                  <TabsTrigger value='amenities'>Tiện ích</TabsTrigger>
                </TabsList>

                <TabsContent value='description' className='mt-6'>
                  <div className='flex flex-col md:flex-row gap-6'>
                    <div className='flex-1 prose prose-sm max-w-none text-foreground/70 leading-[1.8]'>
                      {listing.property.description}
                    </div>
                    <div className='w-full md:w-[280px] shrink-0'>
                      <div className='relative w-full h-[200px] rounded-lg overflow-hidden border border-border'>
                        <GoogleMap
                          defaultCenter={{ lat: listing.location.latitude, lng: listing.location.longitude }}
                          defaultZoom={15}
                          className='w-full h-full'
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='amenities' className='mt-6'>
                  <RentalFeatures property={property} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right: Agent Card + Analytics - 30% */}
          <div className='hidden lg:block lg:w-[30%] lg:max-w-[400px] shrink-0'>
            <div className='space-y-3'>
              {/* Agent Card */}
              <div className='bg-white border border-primary/10 rounded-2xl p-5 shadow-sm'>
                {/* 3 Dots Menu */}
                <div className='flex justify-end mb-2'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className='p-1 hover:bg-muted rounded-full transition-colors'>
                        <MoreHorizontal className='size-5 text-muted-foreground' />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      <DropdownMenuItem
                        onClick={() => setIsReportOpen(true)}
                        className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
                      >
                        <Flag className='size-4 mr-2' />
                        {tScreen('report')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Avatar */}
                <div className='flex justify-center mb-4'>
                  <div className='relative'>
                    <img
                      src={listing.agent?.avatar_url || '/default-avatar.png'}
                      alt={listing.agent?.full_name || 'Agent'}
                      className='w-20 h-20 rounded-full object-cover border-2 border-primary/10'
                    />
                    <div className='absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1'>
                      <div className='w-2 h-2 bg-white rounded-full' />
                    </div>
                  </div>
                </div>

                {/* Agent Name */}
                <h3 className='text-center font-semibold text-lg text-foreground mb-1'>
                  {listing.agent?.full_name || 'Agent'}
                </h3>

                {/* Rating */}
                <div className='flex items-center justify-center gap-2 mb-4'>
                  <span className='text-yellow-500 text-sm'>★ 4.5/5</span>
                  <span className='text-muted-foreground text-sm'>(228)</span>
                </div>

                {/* Phone Number */}
                <div className='flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-3'>
                  <span className='text-foreground font-mono text-sm'>
                    {listing.agent?.phone?.slice(0, 6) || '000'}****{listing.agent?.phone?.slice(-2) || '**'}
                  </span>
                  <button className='text-primary text-sm font-medium hover:underline'>
                    Hiện số
                  </button>
                </div>

                {/* Properties Count */}
                <p className='text-center text-muted-foreground text-sm mb-4'>
                  2 tin đăng
                </p>

                {/* Contact Button */}
                <RealVistaButton
                  variant='primary'
                  size='small'
                  className='w-full mb-3'
                  onClick={handleContact}
                >
                  <MessageCircle className='h-4 w-4' />
                  <span>Liên hệ ngay</span>
                </RealVistaButton>

                {/* Book Tour Button */}
                <RealVistaButton
                  variant='secondary'
                  size='small'
                  className='w-full border-primary text-primary hover:bg-primary/5'
                  onClick={handleRequestTour}
                >
                  <Calendar className='h-4 w-4' />
                  <span>Đặt lịch xem</span>
                </RealVistaButton>
              </div>

              {/* Service Fee Analysis Card */}
              <div className='bg-white border border-primary/10 rounded-2xl p-5 shadow-sm'>
                <h3 className='font-semibold text-foreground mb-4 flex items-center gap-2'>
                  Phân tích chi phí
                  <span className='text-muted-foreground cursor-help' title='Chi phí ước tính'>ⓘ</span>
                </h3>

                {/* Short-term Rent Occupancy */}
                <div className='flex items-center gap-4 mb-4'>
                  <div className='relative w-16 h-16'>
                    <svg className='w-16 h-16 transform -rotate-90'>
                      <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke='#e5e7eb'
                        strokeWidth='6'
                      />
                      <circle
                        cx='32'
                        cy='32'
                        r='28'
                        fill='none'
                        stroke='#22c55e'
                        strokeWidth='6'
                        strokeDasharray={`${64 * 1.76} ${100 * 1.76}`}
                        strokeLinecap='round'
                      />
                    </svg>
                    <span className='absolute inset-0 flex items-center justify-center text-sm font-bold'>64%</span>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Tỷ lệ lấp đầy</p>
                    <p className='text-lg font-bold text-foreground'>
                      {formatVND(Math.round(property.price * 0.64))} VNĐ
                    </p>
                    <p className='text-xs text-muted-foreground'>Thu nhập/tháng ước tính</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className='space-y-2 pt-4 border-t border-border'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Giá thuê/tháng</span>
                    <span className='font-semibold'>{formattedPrice} VNĐ</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Phí dịch vụ</span>
                    <span className='font-semibold text-green-600'>~10%</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Thuế (nếu có)</span>
                    <span className='font-semibold'>0 VNĐ</span>
                  </div>
                </div>
              </div>

              <PriceHistoryChart listingId={listing.listing_id} />

            </div>
          </div>
        </div>

        {/* Mobile: Price & Service Fee */}
        <div className='lg:hidden mb-6'>
          <PriceAndTour
            price={property.price}
            listingType={listing.listing_type}
            phone={listing.agent?.phone}
            onContact={handleContact}
            onRequestTour={handleRequestTour}
            isAgent={isListingPostedByAgent}
          />
        </div>
      </div>

      {/* Divider */}
      <div className='max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24'>
        <div className='border-t border-border' />
      </div>

      {/* Similar Listings Section */}
      <div className='mt-6 sm:mt-8'>
        <div className='max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-24'>
          <SimilarListings propertyId={property.id} />
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
        listing={chatListingData}
        agentName={listing.agent?.full_name || ''}
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
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-primary/20 px-4 py-3 sm:px-6 lg:hidden z-50'>
        <div className='max-w-[1400px] mx-auto flex flex-col xs:flex-row items-center justify-between gap-3 xs:gap-4'>
          <div className='w-full xs:w-auto mb-2 xs:mb-0'>
            <p className='text-foreground/50 text-xs font-medium leading-[1.4]'>
              {listing.listing_type === 'RENT' ? tScreen('rentPrice') : tScreen('salePrice')}
            </p>
            <div className='flex items-baseline gap-1'>
              <p className='text-primary text-xl font-extrabold leading-[1.5] tracking-tight'>
                {formattedPrice}
              </p>
              <span className='text-xs font-semibold text-muted-foreground'>VNĐ</span>
              {listing.listing_type === 'RENT' && (
                <span className='text-foreground/50 text-sm font-medium'>{tScreen('perMonth')}</span>
              )}
            </div>
          </div>
          <RealVistaButton
            variant='primary'
            size='small'
            className='w-full xs:w-auto max-w-[180px]'
            onClick={handleContact}
          >
            {tScreen('contactNow')}
          </RealVistaButton>
        </div>
      </div>

      <BookTourModal
        listingId={property.id}
        isOpen={isBookTourOpen}
        onClose={() => setIsBookTourOpen(false)}
      />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Unfavorite Confirm Dialog */}
      <Dialog open={showUnfavoriteConfirm} onOpenChange={setShowUnfavoriteConfirm}>
        <DialogContent className='max-w-sm p-8'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Heart className='h-5 w-5 fill-primary/30 text-primary' strokeWidth={2} />
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
              className='flex-1 bg-primary hover:bg-primary/90 text-white border-0'
            >
              {t('unfavorite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        listingId={listing.listing_id}
        listingName={listing.name}
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
      />
    </div>
  );
}
