import { useEffect, useState, useRef, useLayoutEffect, type CSSProperties } from 'react';
import { Typography, Button, Spinner } from '@maxhub/max-ui';
import { colors, layout } from './theme';
import { getMaxUser, getUserFullName, getUserInitials, type MaxUser } from '../utils/maxBridge';
import type { MaxCard } from '../../api-caller/get-user-cards.ts';
import { userCardsCache } from '../utils/userCardsCache.ts';
import { UserCardView } from './UserCardView';
import { MaxCardDetail } from './MaxCardDetail';
import { CategoryFilter, type CategoryFilterOption } from './CategoryFilter';
import { deleteMaxCardFromUI } from '../../api-caller/delete-max-card.ts';
import { CreateInitiativeScreen } from './CreateInitiativeScreen';

type ErrorScreenProps = {
  error: string;
  onRetry: () => void;
};

const errorScreenStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 24px',
  textAlign: 'center',
  gap: 20,
  minHeight: 300,
};

const errorIconStyle: CSSProperties = {
  fontSize: 64,
  color: colors.error,
  opacity: 0.8,
};

const errorTextStyle: CSSProperties = {
  color: colors.textPrimary,
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
};

const errorMessageStyle: CSSProperties = {
  color: colors.textSecondary,
  fontSize: 14,
  margin: 0,
  maxWidth: 400,
};

function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  return (
    <div style={errorScreenStyle}>
      <div style={errorIconStyle}>⚠️</div>
      <Typography.Title style={errorTextStyle}>
        Не удалось загрузить инициативы
      </Typography.Title>
      <Typography.Body style={errorMessageStyle}>
        {error}
      </Typography.Body>
      <Button
        mode="primary"
        size="large"
        onClick={onRetry}
        style={{ marginTop: 8 }}
      >
        Попробовать снова
      </Button>
    </div>
  );
}

type ProfileScreenProps = {
  onCreateInitiative: () => void;
  onEditInitiative?: (card: MaxCard) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
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
  gap: 16,
};

const emptyStateStyle: CSSProperties = {
  padding: '32px 0',
  textAlign: 'center',
  color: colors.textSecondary,
};

const statsContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-around',
  padding: '20px 24px',
  borderRadius: layout.cornerRadius,
  background: 'linear-gradient(145deg, rgba(17, 30, 55, 0.8) 0%, rgba(10, 19, 34, 0.8) 100%)',
  border: `1px solid ${colors.cardBorder}`,
  gap: 24,
};

const statItemStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  flex: 1,
};

const statValueStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 700,
  color: colors.textPrimary,
  lineHeight: 1.2,
};

const statLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 500,
  color: colors.textSecondary,
  textAlign: 'center',
};

const statDividerStyle: CSSProperties = {
  width: 1,
  height: 48,
  background: 'rgba(255, 255, 255, 0.12)',
  flexShrink: 0,
};

const STATUS_FILTERS: CategoryFilterOption[] = [
  { label: 'Все', value: 'all' },
  { label: 'Опубликовано', value: 'accepted' },
  { label: 'На модерации', value: 'moderate' },
  { label: 'Отклонено', value: 'rejected' },
];

export function ProfileScreen({ onCreateInitiative, onEditInitiative, scrollContainerRef }: ProfileScreenProps) {
  const [user, setUser] = useState<MaxUser | null>(null);
  const [cards, setCards] = useState<MaxCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<MaxCard | null>(null);
  const [editingCard, setEditingCard] = useState<MaxCard | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<CategoryFilterOption['value']>('all');
  const savedScrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

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

    userCardsCache
      .getUserCards(user.id)
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

    const unsubscribe = userCardsCache.subscribe((userId, cachedCards) => {
      if (userId === user.id && isMounted) {
        setCards(cachedCards);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  const fullName = getUserFullName(user);
  const initials = getUserInitials(user);
  const hasPhoto = user?.photoUrl;

  const filteredCards = activeStatusFilter === 'all'
    ? cards
    : cards.filter((card) => card.status?.toLowerCase() === activeStatusFilter.toLowerCase());

  // Сохраняем позицию скролла перед открытием детального экрана
  const handleCardSelect = (card: MaxCard) => {
    if (scrollContainerRef?.current) {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
      shouldRestoreScrollRef.current = true;
    }
    setSelectedCard(card);
  };

  // Восстанавливаем скролл при возврате на список или сбрасываем при открытии детального экрана
  useLayoutEffect(() => {
    if (!scrollContainerRef?.current) return;

    if (selectedCard) {
      // При открытии детального экрана - скролл вверху
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    } else if (shouldRestoreScrollRef.current) {
      // При возврате на список карточек - восстанавливаем сохраненную позицию
      scrollContainerRef.current.scrollTo({ 
        top: savedScrollPositionRef.current, 
        behavior: 'instant' 
      });
      shouldRestoreScrollRef.current = false;
    }
  }, [selectedCard]);

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteMaxCardFromUI(cardId);
      if (user?.id) {
        await userCardsCache.invalidateUserCache(user.id);
        const updatedCards = await userCardsCache.getUserCards(user.id);
        setCards(updatedCards);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось удалить карточку';
      throw new Error(message);
    }
  };

  const handleEditCard = (card: MaxCard) => {
    if (onEditInitiative) {
      onEditInitiative(card);
    } else {
      setEditingCard(card);
    }
  };

  if (editingCard) {
    return (
      <CreateInitiativeScreen
        cardToEdit={editingCard}
        onBack={() => setEditingCard(null)}
        onSuccess={() => {
          setEditingCard(null);
          if (user?.id) {
            userCardsCache.invalidateUserCache(user.id).then(() => {
              userCardsCache.getUserCards(user.id).then((updatedCards) => {
                setCards(updatedCards);
              });
            });
          }
        }}
      />
    );
  }

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

      {!loading && cards.length > 0 && (
        <div style={statsContainerStyle}>
          <div style={statItemStyle}>
            <Typography.Title style={statValueStyle}>
              {cards.length}
            </Typography.Title>
            <Typography.Body style={statLabelStyle}>
              Моих инициатив
            </Typography.Body>
          </div>
          <div style={statDividerStyle} />
          <div style={statItemStyle}>
            <Typography.Title style={statValueStyle}>
              {cards.reduce((sum, card) => sum + (card.view_count ?? 0), 0)}
            </Typography.Title>
            <Typography.Body style={statLabelStyle}>
              Просмотров
            </Typography.Body>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Typography.Title
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: colors.textPrimary,
            marginBottom: 20,
          }}
        >
          Мои инициативы
        </Typography.Title>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner size={32} appearance="primary" />
          </div>
        ) : error ? (
          <ErrorScreen error={error} onRetry={() => {
            if (user?.id) {
              setError(null);
              setLoading(true);
              userCardsCache
                .getUserCards(user.id, true)
                .then((data) => {
                  setCards(data);
                })
                .catch((err) => {
                  const message = err instanceof Error ? err.message : String(err);
                  setError(message);
                })
                .finally(() => {
                  setLoading(false);
                });
            }
          }} />
        ) : cards.length === 0 ? (
          <div style={emptyStateStyle}>
            <Typography.Body style={{ color: colors.textSecondary }}>
              У вас пока нет инициатив
            </Typography.Body>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 12 }}>
              <CategoryFilter
                options={STATUS_FILTERS}
                activeValue={activeStatusFilter}
                onChange={(value) => setActiveStatusFilter(value)}
              />
            </div>
            {filteredCards.length > 0 ? (
              <div style={{ ...cardsListStyle, paddingTop: 8 }}>
                {filteredCards.map((card) => (
                  <UserCardView
                    key={card.id}
                    card={card}
                    onOpen={handleCardSelect}
                    onEdit={handleEditCard}
                    onDelete={handleDeleteCard}
                  />
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                <Typography.Body style={{ color: colors.textSecondary }}>
                  Нет инициатив с выбранным статусом
                </Typography.Body>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
