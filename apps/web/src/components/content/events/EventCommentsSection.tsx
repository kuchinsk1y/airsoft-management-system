'use client';

import { getEventComments } from '@/actions/comments';
import type { Comment } from '@/interfaces';
import ArrowSection from '@/components/ArrowSection/ArrowSection';
import FeedbackCard from '@/components/FeedbackCard/FeedbackCard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CreateCommentForm from './CreateCommentForm';

interface EventCommentsSectionProps {
  eventId: number;
}

export default function EventCommentsSection({
  eventId,
}: EventCommentsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [slideHeight, setSlideHeight] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Array<{
    logoUrl: string;
    name: string;
    nickName: string;
    progress: string;
    text: string;
  }>>([]);

  const loadComments = useCallback(async () => {
    try {
      const comments = await getEventComments(eventId);
      const eventComments = comments.filter(
        (c) => c.eventId === eventId || c.event?.id === eventId,
      );
      const mappedFeedbacks = eventComments.map((comment: Comment) => ({
        logoUrl: comment.author.logoUrl || '/FeedbackLogo.svg',
        name: comment.author.fullName || comment.author.nickName,
        nickName: comment.author.nickName,
        progress: comment.event?.name || 'ПОДІЯ',
        text: comment.message,
      }));
      setFeedbacks(mappedFeedbacks);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setFeedbacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const handleCommentCreated = async () => {
    await loadComments();
  };

  const itemsPerPage = 3;

  const pages = useMemo(() => {
    const nextPages = [];
    for (let i = 0; i < feedbacks.length; i += itemsPerPage) {
      nextPages.push(feedbacks.slice(i, i + itemsPerPage));
    }
    return nextPages;
  }, [feedbacks]);
  const totalPages = pages.length || 1;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstSlideRef = useRef<HTMLDivElement | null>(null);

  const measureSlideHeight = useCallback(() => {
    requestAnimationFrame(() => {
      if (firstSlideRef.current) {
        setSlideHeight(firstSlideRef.current.offsetHeight);
      } else {
        setSlideHeight(0);
      }
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 991);
      measureSlideHeight();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureSlideHeight]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      measureSlideHeight();
    }, 150);
    return () => window.clearTimeout(t);
  }, [isMobile, pages, measureSlideHeight]);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const translateYpx = -((currentPage - 1) * slideHeight);
  const translateXpercent = `-${((currentPage - 1) * 100) / totalPages}%`;

  return (
    <div className="border-t border-white">
      <CreateCommentForm
        eventId={eventId}
        onCommentCreated={handleCommentCreated}
        withTopBorder={false}
      />

      <div className="border-t border-white">
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">Завантаження відгуків...</p>
        ) : (
          <>
            <ArrowSection
              title="Відгуки"
              current={currentPage}
              total={totalPages}
              onPrev={handlePrev}
              onNext={handleNext}
              isPrevDisabled={currentPage === 1 || feedbacks.length === 0}
              isNextDisabled={currentPage === totalPages || feedbacks.length === 0}
            />

            {feedbacks.length === 0 ? (
              <div className="p-5 lg:p-10 1440:p-14 text-center text-gray-400">
                Поки що немає відгуків. Будьте першим!
              </div>
            ) : (
              <div
                className="overflow-hidden w-full"
                style={{
                  height: isMobile ? slideHeight || undefined : undefined,
                }}
              >
                <div
                  ref={trackRef}
                  className={`flex transition-transform duration-700 ease-in-out
                ${isMobile ? 'flex-col' : 'flex-row'}
              `}
                  style={{
                    transform: isMobile
                      ? `translateY(${translateYpx}px)`
                      : `translateX(${translateXpercent})`,
                    width: isMobile ? '100%' : `${totalPages * 100}%`,
                  }}
                >
                  {pages.map((page, pageIndex) => (
                    <div
                      key={pageIndex}
                      ref={pageIndex === 0 ? firstSlideRef : undefined}
                      className={`shrink-0 flex ${
                        isMobile ? 'w-full flex-col' : 'flex-row w-full'
                      }`}
                      style={{
                        width: isMobile ? '100%' : `${100 / totalPages}%`,
                      }}
                    >
                      {page.map((feedback, feedbackIndex) => (
                        <div
                          key={feedbackIndex}
                          className={`${
                            isMobile ? 'w-full' : 'flex-1'
                          } ${!isMobile && feedbackIndex < page.length - 1 ? 'border-r border-white' : ''}`}
                        >
                          <FeedbackCard
                            logoUrl={feedback.logoUrl}
                            name={feedback.name}
                            nickName={feedback.nickName}
                            progress={feedback.progress}
                            text={feedback.text}
                            withBorder={false}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
