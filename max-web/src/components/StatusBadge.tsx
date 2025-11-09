import { type CSSProperties } from 'react';
import { colors } from './theme';

type StatusBadgeProps = {
  status: string;
  style?: CSSProperties;
};

const baseStyle: CSSProperties = {
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
};

const STATUS_CONFIG: Record<string, { label: string; background: string; text: string }> = {
  moderate: {
    label: 'На модерации',
    background: 'rgba(255, 193, 7, 0.2)',
    text: '#ffc107',
  },
  accepted: {
    label: 'Опубликовано',
    background: 'rgba(76, 175, 80, 0.2)',
    text: '#4caf50',
  },
  rejected: {
    label: 'Отклонено',
    background: 'rgba(244, 67, 54, 0.2)',
    text: '#f44336',
  },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase().trim();
  const config = normalizedStatus ? STATUS_CONFIG[normalizedStatus] : null;

  if (!config) {
    return null;
  }

  return (
    <span
      style={{
        ...baseStyle,
        backgroundColor: config.background,
        color: config.text,
        ...style,
      }}
    >
      {config.label}
    </span>
  );
}

