import { type CSSProperties, type PropsWithChildren } from 'react';
import { colors, layout } from './theme';

const rootStyle: CSSProperties = {
  backgroundColor: colors.backgroundPrimary,
  minHeight: '100dvh',
};

const baseStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  minHeight: '100dvh',
  minWidth: 0,
  width: '100%',
  maxWidth: layout.pageWidth,
  margin: '0 auto',
  backgroundColor: colors.backgroundPrimary,
  padding: '24px 0',
  boxSizing: 'border-box',
};

type AppScreenProps = PropsWithChildren<{
  style?: CSSProperties;
}>;

export function AppScreen({ children, style }: AppScreenProps) {
  return (
    <div style={rootStyle}>
      <div
        style={{
          ...baseStyle,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
