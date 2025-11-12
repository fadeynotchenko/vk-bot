import { type CSSProperties } from 'react';

type ImageViewerModalProps = {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px',
};

const imageContainerStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const imageStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'contain',
};

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 2001,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  width: 44,
  height: 44,
  fontSize: 24,
  fontWeight: 600,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  transition: 'background-color 0.2s ease, transform 0.2s ease',
};

export function ImageViewerModal({ visible, imageUrl, onClose }: ImageViewerModalProps) {
  if (!visible || !imageUrl) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={imageContainerStyle} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Просмотр изображения" style={imageStyle} />
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

