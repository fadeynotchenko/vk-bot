import { type CSSProperties, useState } from 'react';
import { Typography } from '@maxhub/max-ui';
import { colors, layout, shadows } from './theme';
import type { MaxCard } from '../../api-caller/get-user-cards.ts';
import { TagBadge } from './TagBadge';
import { StatusBadge } from './StatusBadge';
import { formatCardDate } from '../utils/formatDate.ts';
import { DeleteConfirmModal } from './DeleteConfirmModal';

type UserCardViewProps = {
  card: MaxCard;
  onOpen: (card: MaxCard) => void;
  onEdit: (card: MaxCard) => void;
  onDelete: (cardId: string) => Promise<void>;
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
  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.98) 100%)',
};

const statusBadgeContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  zIndex: 2,
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

const cardContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
};

const actionButtonsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  width: '100%',
};

const actionButtonStyle: CSSProperties = {
  flex: 1,
  borderRadius: layout.cornerRadius,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const editButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  backgroundColor: 'rgba(43, 71, 255, 0.15)',
  color: colors.accent,
  border: `1px solid ${colors.accent}`,
};

const deleteButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  backgroundColor: 'rgba(226, 76, 120, 0.15)',
  color: '#e24c78',
  border: '1px solid #e24c78',
};

export function UserCardView({ card, onOpen, onEdit, onDelete }: UserCardViewProps) {
  const formattedDate = formatCardDate(card.date);
  const viewCount = card.view_count ?? 0;
  const isAccepted = card.status === 'accepted';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(card.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete card:', error);
      // Можно добавить уведомление об ошибке
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div style={cardContainerStyle}>
        <button type="button" onClick={() => onOpen(card)} style={buttonStyle}>
          <div style={cardStyle}>
            {card.image ? (
              <img src={card.image} alt={card.title} style={imageStyle} />
            ) : (
              <div style={mediaStyle} />
            )}
            <div style={gradientOverlayStyle} />
            {isAccepted && viewCount > 0 && (
              <div style={viewCountStyle}>
                <span>👁</span>
                <span>{viewCount}</span>
              </div>
            )}
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
        <div style={actionButtonsStyle}>
          <button
            type="button"
            onClick={handleEditClick}
            style={editButtonStyle}
            disabled={isDeleting}
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            style={deleteButtonStyle}
            disabled={isDeleting}
          >
            Удалить
          </button>
        </div>
      </div>
      <DeleteConfirmModal
        visible={showDeleteModal}
        cardTitle={card.title}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}

