import { type CSSProperties, type ChangeEvent } from 'react';
import { colors, layout } from './theme';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const containerStyle: CSSProperties = {
  width: '100%',
  padding: `0 ${layout.contentXPadding}`,
};

const inputWrapperStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px 14px 44px',
  borderRadius: layout.cornerRadius,
  border: `1px solid rgba(255, 255, 255, 0.12)`,
  background: 'rgba(10, 19, 34, 0.7)',
  color: colors.textPrimary,
  fontSize: 16,
  fontWeight: 400,
  outline: 'none',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  boxSizing: 'border-box',
};

const inputFocusStyle: CSSProperties = {
  borderColor: 'rgba(43, 71, 255, 0.5)',
  background: 'rgba(10, 19, 34, 0.9)',
};

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 20,
  height: 20,
  pointerEvents: 'none',
  opacity: 0.6,
  color: colors.textSecondary,
};

const clearButtonStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 24,
  height: 24,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  opacity: 0.6,
  transition: 'opacity 0.2s ease',
  color: colors.textSecondary,
};

export function SearchBar({ value, onChange, placeholder = 'Поиск по названию и описанию...' }: SearchBarProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div style={containerStyle}>
      <div style={inputWrapperStyle}>
        <svg
          style={searchIconStyle}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            ...(value ? { ...inputFocusStyle, paddingRight: '44px' } : {}),
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(43, 71, 255, 0.5)';
            e.currentTarget.style.background = 'rgba(10, 19, 34, 0.9)';
          }}
          onBlur={(e) => {
            if (!value) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'rgba(10, 19, 34, 0.7)';
            }
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={clearButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
            aria-label="Очистить поиск"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

