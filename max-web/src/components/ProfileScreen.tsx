import { useEffect, useState, type CSSProperties } from 'react';
import { Typography, Button, Spinner } from '@maxhub/max-ui';
import { colors, layout } from './theme';
import { getMaxUser, getUserFullName, getUserInitials, type MaxUser } from '../utils/maxBridge';
import { fetchUserCardsFromUI, type MaxCard } from '../../api-caller/get-user-cards.ts';
import { UserCardView } from './UserCardView';
import { MaxCardDetail } from './MaxCardDetail';

type ProfileScreenProps = {
  onCreateInitiative: () => void;
};

const containerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: `0 ${layout.contentXPadding} 24px`,
  color: colors.textPrimary,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  padding: '32px 0 24px',
  borderRadius: 28,
  background: 'linear-gradient(160deg, rgba(17, 30, 55, 1) 0%, rgba(10, 19, 34, 1) 100%)',
};

const avatarStyle: CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: '50%',
  backgroundColor: '#c0cadb',
  color: '#111d30',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 36,
  fontWeight: 700,
  overflow: 'hidden',
  position: 'relative',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const avatarImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const avatarPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 36,
  fontWeight: 700,
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  lineHeight: 1.3,
  color: colors.textPrimary,
};

const userIdStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.4,
  color: colors.textSecondary,
  fontWeight: 400,
};

const cardsListStyle: CSSProperties = {
  width: '100%',
  padding: `0 0 24px`,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const emptyStateStyle: CSSProperties = {
  padding: '32px 0',
  textAlign: 'center',
  color: colors.textSecondary,
};

export function ProfileScreen({ onCreateInitiative }: ProfileScreenProps) {
  const [user, setUser] = useState<MaxUser | null>(null);
  const [cards, setCards] = useState<MaxCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<MaxCard | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const maxUser = getMaxUser();
      if (maxUser) {
        setUser(maxUser);
        return true;
      }
      return false;
    };

    const loaded = loadUser();

    if (!loaded) {
      const timeoutId = setTimeout(() => {
        loadUser();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchUserCardsFromUI(user.id)
      .then((data) => {
        if (isMounted) {
          setCards(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const hasPhoto = user?.photoUrl;

  if (selectedCard) {
    return (
      <MaxCardDetail
        card={selectedCard}
        onBack={() => setSelectedCard(null)}
      />
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={avatarStyle}>
          {hasPhoto ? (
            <img src={user.photoUrl} alt={fullName} style={avatarImageStyle} />
          ) : (
            <div style={avatarPlaceholderStyle}>{initials}</div>
          )}
        </div>
        <Typography.Title style={nameStyle}>{fullName}</Typography.Title>
        {user && (
          <Typography.Body style={userIdStyle}>ID: {user.id}</Typography.Body>
        )}
      </div>

      <Button
        size="large"
        mode="primary"
        stretched
        onClick={onCreateInitiative}
        iconBefore={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              lineHeight: 1,
              fontWeight: 600,
              width: 24,
            }}
          >
            +
          </span>
        }
      >
        Создать инициативу
      </Button>

      <div style={{ marginTop: 8 }}>
        <Typography.Title
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Мои инициативы
        </Typography.Title>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner size={32} appearance="primary" />
          </div>
        ) : error ? (
          <Typography.Body style={{ color: colors.error, padding: '32px 0' }}>
            Не удалось загрузить инициативы: {error}
          </Typography.Body>
        ) : cards.length === 0 ? (
          <div style={emptyStateStyle}>
            <Typography.Body style={{ color: colors.textSecondary }}>
              У вас пока нет инициатив
            </Typography.Body>
          </div>
        ) : (
          <div style={cardsListStyle}>
            {cards.map((card) => (
              <UserCardView key={card.id} card={card} onOpen={setSelectedCard} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
