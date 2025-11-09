import { type CSSProperties } from 'react';
import { Typography } from '@maxhub/max-ui';
import { colors, layout, shadows } from './theme';
import type { MaxCard } from '../../api-caller/get-user-cards.ts';
import { TagBadge } from './TagBadge';
import { StatusBadge } from './StatusBadge';
import { formatCardDate } from '../utils/formatDate.ts';

type UserCardViewProps = {
  card: MaxCard;
  onOpen: (card: MaxCard) => void;
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
  background: 'linear-gradient(180deg, rgba(10,19,34,0) 30%, rgba(10,19,34,0.85) 100%)',
};

const statusBadgeContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
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

export function UserCardView({ card, onOpen }: UserCardViewProps) {
  const formattedDate = formatCardDate(card.date);

  return (
    <button type="button" onClick={() => onOpen(card)} style={buttonStyle}>
      <div style={cardStyle}>
        {card.image ? (
          <img src={card.image} alt={card.title} style={imageStyle} />
        ) : (
          <div style={mediaStyle} />
        )}
        <div style={gradientOverlayStyle} />
        <div style={statusBadgeContainerStyle}>
          <StatusBadge status={card.status} />
        </div>
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

