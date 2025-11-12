import { type CSSProperties } from 'react';
import { Typography, Button } from '@maxhub/max-ui';
import { colors, layout } from './theme';

type DeleteConfirmModalProps = {
  visible: boolean;
  cardTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const modalStyle: CSSProperties = {
  backgroundColor: colors.cardGradient,
  borderRadius: layout.cornerRadius,
  padding: '24px',
  maxWidth: 400,
  width: '100%',
  border: `1px solid ${colors.cardBorder}`,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: colors.textPrimary,
};

const messageStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.5,
  color: colors.textSecondary,
};

const cardTitleStyle: CSSProperties = {
  fontWeight: 600,
  color: colors.textPrimary,
};

const buttonsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  width: '100%',
};

const buttonStyle: CSSProperties = {
  flex: 1,
  borderRadius: layout.cornerRadius,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const cancelButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: colors.textPrimary,
  border: `1px solid ${colors.cardBorder}`,
};

const confirmButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#e24c78',
  color: '#ffffff',
};

export function DeleteConfirmModal({
  visible,
  cardTitle,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <Typography.Title style={titleStyle}>Подтвердите удаление</Typography.Title>
        <Typography.Body style={messageStyle}>
          Вы уверены, что хотите удалить инициативу{' '}
          <span style={cardTitleStyle}>«{cardTitle}»</span>? Это действие нельзя отменить.
        </Typography.Body>
        <div style={buttonsStyle}>
          <button
            type="button"
            onClick={onCancel}
            style={cancelButtonStyle}
            disabled={isDeleting}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={confirmButtonStyle}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}

