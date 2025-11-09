import { type CSSProperties } from 'react';
import { Button, Typography } from '@maxhub/max-ui';
import { colors, layout, shadows } from './theme';
import type { MaxCard } from '../../api-caller/get-max-cards.ts';
// Также поддерживает карточки из get-user-cards.ts
import { TagBadge } from './TagBadge';
import { formatCardDate } from '../utils/formatDate.ts';

type MaxCardDetailProps = {
  card: MaxCard;
  onBack: () => void;
};

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  flex: 1,
};

const backButtonStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: `0 ${layout.contentXPadding}`,
  color: colors.textSecondary,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 16,
  cursor: 'pointer',
};

const heroStyle: CSSProperties = {
  margin: `0 ${layout.contentXPadding}`,
  borderRadius: layout.cornerRadius,
  overflow: 'hidden',
  background: `linear-gradient(145deg, ${colors.accent} 0%, #ff9bb0 100%)`,
  minHeight: 320,
  position: 'relative',
  boxShadow: shadows.card,
};

const heroMediaStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: `linear-gradient(135deg, ${colors.accent} 0%, #e24c78 60%, #c2336f 100%)`,
  width: '100%',
  height: '100%',
};

const heroImageStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
};

const heroGradientStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, rgba(14,23,38,0) 35%, rgba(14,23,38,0.92) 100%)',
};

const heroContentStyle: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  padding: '28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  color: colors.textPrimary,
};

const infoBlockStyle: CSSProperties = {
  backgroundColor: colors.detailSurface,
  borderRadius: layout.cornerRadius,
  padding: '24px',
  margin: `0 ${layout.contentXPadding}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const actionWrapperStyle: CSSProperties = {
  padding: `0 ${layout.contentXPadding}`,
  marginTop: 'auto',
};

const infoHeadingStyle: CSSProperties = {
  color: colors.textPrimary,
  fontSize: 18,
  lineHeight: 1.3,
  margin: 0,
};

const infoTextStyle: CSSProperties = {
  color: colors.textSecondary,
  fontSize: 16,
  lineHeight: 1.65,
};

export function MaxCardDetail({ card, onBack }: MaxCardDetailProps) {
  const formattedDate = formatCardDate(card.date);

  return (
    <div style={wrapperStyle}>
      <button type="button" onClick={onBack} style={backButtonStyle}>
        <span style={{ fontSize: 20 }}>←</span>
        Назад
      </button>

      <div style={heroStyle}>
        {card.image ? (
          <img src={card.image} alt={card.title} style={heroImageStyle} />
        ) : (
          <div style={heroMediaStyle} />
        )}
        <div style={heroGradientStyle} />
        <div style={heroContentStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {card.category && (
              <TagBadge category={card.category} style={{ alignSelf: 'flex-start' }}>
                {card.category}
              </TagBadge>
            )}
            {formattedDate && (
              <Typography.Label style={{ color: colors.textMuted, textTransform: 'capitalize' }}>
                {formattedDate}
              </Typography.Label>
            )}
          </div>
          <Typography.Title style={{ margin: 0, fontSize: 30, lineHeight: 1.2 }}>
            {card.title}
          </Typography.Title>
          {card.subtitle && (
            <Typography.Body style={{ color: colors.textSecondary }}>
              {card.subtitle}
            </Typography.Body>
          )}
        </div>
      </div>

      <div style={infoBlockStyle}>
        <Typography.Title style={infoHeadingStyle}>
          Подробная информация
        </Typography.Title>
        <Typography.Body style={infoTextStyle}>
          {card.text}
        </Typography.Body>
      </div>

      <div style={actionWrapperStyle}>
        <Button
          mode="primary"
          size="large"
          style={{ width: '100%' }}
          onClick={() => {
            if (card.link) {
              window.open(card.link, '_blank', 'noopener,noreferrer');
            }
          }}
          disabled={!card.link}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Перейти на сайт
            <span style={{ fontSize: 18 }}>↗</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
