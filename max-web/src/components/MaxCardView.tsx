import { type CSSProperties } from 'react';
import { Typography } from '@maxhub/max-ui';
import { colors, layout, shadows } from './theme';
import type { MaxCard } from '../../api-caller/get-max-cards.ts';
import { TagBadge } from './TagBadge';
import { formatCardDate } from '../utils/formatDate.ts';

type MaxCardViewProps = {
  card: MaxCard;
  onOpen: (card: MaxCard) => void;
  isViewed?: boolean;
};

const buttonStyle: CSSProperties = {
  border: 'none',
  padding: 0,
  background: 'none',
  cursor: 'pointer',
  borderRadius: layout.cornerRadius,
  width: '100%',
  textAlign: 'left',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const cardStyle: CSSProperties = {
  borderRadius: layout.cornerRadius,
  overflow: 'hidden',
  border: `1px solid ${colors.cardBorder}`,
  boxShadow: shadows.card,
  position: 'relative',
  height: 280,
  background: colors.cardGradient,
  willChange: 'transform',
};

const mediaStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: `linear-gradient(135deg, ${colors.accent} 0%, #e24c78 60%, #c2336f 100%)`,
  objectFit: 'cover',
  width: '100%',
  height: '100%',
};

const imageStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
};

const gradientOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 100%)',
};

const contentOverlayStyle: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  color: colors.textPrimary,
};

const viewedBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  whiteSpace: 'nowrap',
  backgroundColor: 'rgba(76, 175, 80, 0.9)',
  color: '#ffffff',
};

const viewCountStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 600,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: '#ffffff',
  backdropFilter: 'blur(8px)',
};

export function MaxCardView({ card, onOpen, isViewed }: MaxCardViewProps) {
  const formattedDate = formatCardDate(card.date);
  const viewCount = card.view_count ?? 0;

  return (
    <button type="button" onClick={() => onOpen(card)} style={buttonStyle}>
      <div style={cardStyle}>
        {card.image ? (
          <img src={card.image} alt={card.title} style={imageStyle} />
        ) : (
          <div style={mediaStyle} />
        )}
        <div style={gradientOverlayStyle} />
        {viewCount > 0 && (
          <div style={viewCountStyle}>
            <span>👁</span>
            <span>{viewCount}</span>
          </div>
        )}
        {isViewed && (
          <div style={viewedBadgeStyle}>
            Просмотрено
          </div>
        )}
        <div style={contentOverlayStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {card.category && (
              <TagBadge category={card.category} style={{ alignSelf: 'flex-start' }}>
                {card.category}
              </TagBadge>
            )}
            {formattedDate && (
              <Typography.Label
                style={{ color: colors.textMuted, fontSize: 13, textTransform: 'capitalize' }}
              >
                {formattedDate}
              </Typography.Label>
            )}
          </div>
          <Typography.Title
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {card.title}
          </Typography.Title>
          {card.subtitle && (
            <Typography.Body style={{ color: colors.textSecondary, margin: 0 }}>
              {card.subtitle}
            </Typography.Body>
          )}
        </div>
      </div>
    </button>
  );
}
