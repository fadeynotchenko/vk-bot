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
import { SearchBar } from './components/SearchBar';
import { VkDobroSection } from './components/VkDobroSection';
import { colors, layout } from './components/theme';
import { trackCardViewFromUI } from '../api-caller/track-card-view.ts';
import { fetchViewedCardsFromUI } from '../api-caller/get-viewed-cards.ts';
import { getMaxUser } from './utils/maxBridge.ts';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [profileView, setProfileView] = useState<'overview' | 'create'>('overview');
  const [viewedCardIds, setViewedCardIds] = useState<Set<string>>(new Set());
  const [_cardViewCounts, setCardViewCounts] = useState<Map<string, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedScrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const maxUser = getMaxUser();

    Promise.all([
      fetchMaxCardsFromUI(),
      maxUser?.id ? fetchViewedCardsFromUI(maxUser.id).catch((err) => {
        console.error(`❌ Не удалось загрузить просмотренные карточки для пользователя ${maxUser.id}:`, err);
        return [] as string[];
      }) : Promise.resolve([] as string[]),
    ])
      .then(([cardsData, viewedIds]) => {
        if (isMounted) {
          setCards(cardsData);
          setViewedCardIds(new Set(viewedIds));
          if (maxUser?.id) {
            console.log(`✅ Карточки загружены для пользователя ${maxUser.id} (${cardsData.length} карточек)`);
          }
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
      setSearchQuery('');
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'profile') {
      setProfileView('overview');
    }
  }, [activeTab]);


  // Сохраняем позицию скролла перед открытием детального экрана
  const handleCardSelect = (card: MaxCard) => {
    if (scrollContainerRef.current && activeTab === 'home') {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
      shouldRestoreScrollRef.current = true;
    }
    setSelectedCard(card);
  };

  // Восстанавливаем скролл при возврате на главную или сбрасываем при открытии детального экрана
  useLayoutEffect(() => {
    if (selectedCard) {
      // При открытии детального экрана - скролл вверху
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    } else if (activeTab === 'home' && shouldRestoreScrollRef.current) {
      // При возврате на главную страницу после открытия карточки - восстанавливаем сохраненную позицию
      scrollContainerRef.current?.scrollTo({ 
        top: savedScrollPositionRef.current, 
        behavior: 'instant' 
      });
      shouldRestoreScrollRef.current = false;
    } else {
      // При переключении на другую вкладку или первом рендере - скролл вверху
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      shouldRestoreScrollRef.current = false;
    }
  }, [selectedCard, activeTab]);

  useEffect(() => {
    if (!selectedCard) return;

    const cardId = selectedCard.id;
    const maxUser = getMaxUser();

    setViewedCardIds((prev) => {
      if (prev.has(cardId)) {
        return prev;
      }
      const newSet = new Set(prev);
      newSet.add(cardId);
      return newSet;
    });

    setCardViewCounts((prev) => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(cardId) || 0;
      newMap.set(cardId, currentCount + 1);
      return newMap;
    });

    if (maxUser?.id) {
      trackCardViewFromUI({
        card_id: cardId,
        user_id: maxUser.id,
      })
        .then((viewCount) => {
          setCardViewCounts((prev) => {
            const newMap = new Map(prev);
            newMap.set(cardId, viewCount);
            return newMap;
          });
        })
        .catch((err) => {
          console.error(`❌ Не удалось засчитать просмотр карточки ${cardId} для пользователя ${maxUser.id}:`, err);
          setViewedCardIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
          setCardViewCounts((prev) => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(cardId) || 0;
            if (currentCount > 0) {
              newMap.set(cardId, currentCount - 1);
            }
            return newMap;
          });
        });
    }
  }, [selectedCard]);

  const hasAnyCards = cards.length > 0;
  
  // Фильтрация по категории
  const categoryFilteredCards =
    activeFilter === 'all'
      ? cards
      : cards.filter((card) => card.category?.trim().toLowerCase() === activeFilter);
  
  // Фильтрация по поисковому запросу (название и subtitle)
  const filteredCards = searchQuery.trim()
    ? categoryFilteredCards.filter((card) => {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = card.title?.toLowerCase().includes(query);
        const subtitleMatch = card.subtitle?.toLowerCase().includes(query);
        return titleMatch || subtitleMatch;
      })
    : categoryFilteredCards;
  
  const hasFilteredCards = filteredCards.length > 0;

  const pageWrapperStyle: CSSProperties = {
    height: '100dvh',
    width: '100%',
    maxWidth: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: colors.backgroundPrimary,
  };

  const mainSectionStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    minHeight: 0,
    overflowX: 'hidden',
  };

  const scrollContainerStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: activeTab === 'home' && !selectedCard ? 24 : 0,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    paddingBottom: layout.bottomInset,
    overflowX: 'hidden',
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
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по названию и описанию..."
          />
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
                <>
                  <VkDobroSection />
                  <MaxCardList 
                    cards={filteredCards} 
                    onSelect={handleCardSelect}
                    viewedCardIds={viewedCardIds}
                  />
                </>
              ) : (
                <Typography.Body
                  style={{
                    color: colors.textSecondary,
                    padding: `0 ${layout.contentXPadding}`,
                  }}
                >
                  {searchQuery.trim()
                    ? 'По вашему запросу ничего не найдено'
                    : 'Карточки с выбранным тегом не найдены'}
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
        />
      );
    }

    return (
      <ProfileScreen 
        onCreateInitiative={() => setProfileView('create')}
        scrollContainerRef={scrollContainerRef}
      />
    );
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
