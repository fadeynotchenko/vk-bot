import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Typography, Spinner } from '@maxhub/max-ui';
import { fetchMaxCardsFromUI, type MaxCard } from '../api-caller/get-max-cards.ts';
import { AppScreen } from './components/AppScreen';
import { MaxCardList } from './components/MaxCardList';
import { MaxCardDetail } from './components/MaxCardDetail';
import { CategoryFilter, type CategoryFilterOption } from './components/CategoryFilter';
import { BottomTabs, type BottomTabKey } from './components/BottomTabs';
import { ProfileScreen } from './components/ProfileScreen';
import { CreateInitiativeScreen } from './components/CreateInitiativeScreen';
import { colors, layout } from './components/theme';

const spinnerWrapperStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { label: 'Все', value: 'all' },
  { label: 'Благотворительность', value: 'благотворительность' },
  { label: 'Эко-мероприятие', value: 'эко-мероприятие' },
  { label: 'Волонтерство', value: 'волонтерство' },
];

export default function App() {
  const [cards, setCards] = useState<MaxCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<MaxCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<CategoryFilterOption['value']>('all');
  const [activeTab, setActiveTab] = useState<BottomTabKey>('home');
  const [profileView, setProfileView] = useState<'overview' | 'create'>('overview');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchMaxCardsFromUI()
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
  }, []);

  useEffect(() => {
    if (activeTab !== 'home') {
      setSelectedCard(null);
      setActiveFilter('all');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'profile') {
      setProfileView('overview');
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [activeTab, selectedCard]);

  const hasAnyCards = cards.length > 0;
  const filteredCards =
    activeFilter === 'all'
      ? cards
      : cards.filter((card) => card.category?.trim().toLowerCase() === activeFilter);
  const hasFilteredCards = filteredCards.length > 0;

  const handleCardCreated = (card: MaxCard) => {
    setCards((prev) => [card, ...prev]);
  };

  const pageWrapperStyle: CSSProperties = {
    height: '100dvh',
    width: '100%',
    overflowY: 'auto',
    backgroundColor: colors.backgroundPrimary,
  };

  const mainSectionStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    width: '100%',
    minHeight: 0,
  };

  const scrollContainerStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: activeTab === 'home' && !selectedCard ? 24 : 0,
    minHeight: 0,
    paddingBottom: layout.bottomInset,
  };

  const listAreaStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: 0,
  };

  const renderHomeContent = () => {
    if (selectedCard) {
      return <MaxCardDetail card={selectedCard} onBack={() => setSelectedCard(null)} />;
    }

    return (
      <>
        <Typography.Title
          style={{
            color: colors.textPrimary,
            margin: 0,
            padding: `0 ${layout.contentXPadding}`,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Добрая душа
        </Typography.Title>
        <div style={listAreaStyle}>
          {error ? (
            <Typography.Body
              style={{
                color: colors.error,
                padding: `0 ${layout.contentXPadding}`,
              }}
            >
              Не удалось загрузить карточки: {error}
            </Typography.Body>
          ) : loading ? (
            <div style={spinnerWrapperStyle}>
              <Spinner size={32} appearance="primary" />
            </div>
          ) : !hasAnyCards ? (
            <Typography.Body
              style={{
                color: colors.textSecondary,
                padding: `0 ${layout.contentXPadding}`,
              }}
            >
              Пока нет карточек
            </Typography.Body>
          ) : (
            <>
              <CategoryFilter
                options={CATEGORY_FILTERS}
                activeValue={activeFilter}
                onChange={(value) => setActiveFilter(value)}
              />
              {hasFilteredCards ? (
                <MaxCardList cards={filteredCards} onSelect={setSelectedCard} />
              ) : (
                <Typography.Body
                  style={{
                    color: colors.textSecondary,
                    padding: `0 ${layout.contentXPadding}`,
                  }}
                >
                  Карточки с выбранным тегом не найдены
                </Typography.Body>
              )}
            </>
          )}
        </div>
      </>
    );
  };

  const renderProfileContent = () => {
    if (profileView === 'create') {
      return (
        <CreateInitiativeScreen
          onBack={() => setProfileView('overview')}
          onCardCreated={handleCardCreated}
        />
      );
    }

    return <ProfileScreen onCreateInitiative={() => setProfileView('create')} />;
  };

  return (
    <div ref={scrollContainerRef} style={pageWrapperStyle}>
      <AppScreen style={{ gap: 16 }}>
        <div style={mainSectionStyle}>
          <div style={scrollContainerStyle}>
            {activeTab === 'home' ? renderHomeContent() : renderProfileContent()}
          </div>
        </div>
        <BottomTabs
          active={activeTab}
          onSelect={(tab) => {
            setActiveTab(tab);
          }}
        />
      </AppScreen>
    </div>
  );
}
