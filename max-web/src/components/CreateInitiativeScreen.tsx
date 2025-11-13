import { useEffect, useId, useState, type ChangeEvent, type CSSProperties } from 'react';
import { Button, Textarea, Typography } from '@maxhub/max-ui';
import { colors, layout } from './theme';
import { createMaxCardFromUI } from '../../api-caller/create-max-card.ts';
import { updateMaxCardFromUI } from '../../api-caller/update-max-card.ts';
import { getMaxUser } from '../utils/maxBridge.ts';
import { userCardsCache } from '../utils/userCardsCache.ts';
import { ModerationAlert } from './ModerationAlert';
import type { MaxCard } from '../../api-caller/get-user-cards.ts';

type CreateInitiativeScreenProps = {
  onBack: () => void;
  cardToEdit?: MaxCard;
  onSuccess?: () => void;
};

type CategoryOption = {
  value: string;
  label: string;
  Icon: () => JSX.Element;
};

const containerStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: `0 ${layout.contentXPadding} 40px`,
  color: colors.textPrimary,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  overflowX: 'hidden',
};

const backButtonStyle: CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: colors.textSecondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 16,
  cursor: 'pointer',
};

const headerBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const uploadCardStyle: CSSProperties = {
  borderRadius: layout.cornerRadius,
  padding: '24px',
  border: '1px dashed rgba(255, 255, 255, 0.24)',
  background: 'rgba(10, 19, 34, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  cursor: 'pointer',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
};

const uploadAreaStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  borderRadius: layout.cornerRadius,
  border: '1px solid rgba(255, 255, 255, 0.12)',
  background: colors.cardGradient,
  position: 'relative',
  minHeight: 220,
  aspectRatio: '16 / 9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
  boxSizing: 'border-box',
  minWidth: 0,
};

const uploadHintStyle: CSSProperties = {
  color: colors.textSecondary,
};

const categorySectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const categoryButtonStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  borderRadius: 20,
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 16,
  fontWeight: 600,
  border: '1px solid rgba(255, 255, 255, 0.14)',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: colors.textPrimary,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
  boxSizing: 'border-box',
};

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
};

const labelStyle: CSSProperties = {
  color: colors.textSecondary,
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

const inputFocusStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  borderRadius: 12,
  border: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: colors.textPrimary,
  padding: '12px 16px',
  fontSize: 16,
  lineHeight: 1.5,
  height: '48px',
  resize: 'none',
  overflow: 'hidden',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s ease',
  display: 'block',
  margin: 0,
};

const textareaStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  borderRadius: 12,
  border: 'none',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: colors.textPrimary,
  padding: '12px 16px',
  fontSize: 16,
  lineHeight: 1.5,
  minHeight: 112,
  resize: 'vertical',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s ease',
  display: 'block',
  margin: 0,
};

const actionAreaStyle: CSSProperties = {
  paddingTop: 12,
};

const charCounterStyle: CSSProperties = {
  color: colors.textSecondary,
  fontSize: 12,
  textAlign: 'right',
  marginTop: 4,
};

const categoryOptions: CategoryOption[] = [
  { value: 'благотворительность', label: 'Благотворительность', Icon: HeartIcon },
  { value: 'эко-мероприятие', label: 'Эко-мероприятие', Icon: LeafIcon },
  { value: 'волонтерство', label: 'Волонтерство', Icon: HandsIcon },
];

export function CreateInitiativeScreen({ onBack, cardToEdit, onSuccess }: CreateInitiativeScreenProps) {
  const uploadInputId = useId();
  const isEditMode = !!cardToEdit;
  
  // Скролл вверх при открытии экрана редактирования
  useEffect(() => {
    // Прокручиваем window и все возможные контейнеры скролла
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Ищем родительский контейнер скролла
    const findScrollContainer = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      const style = window.getComputedStyle(element);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
        return element;
      }
      return findScrollContainer(element.parentElement);
    };
    const container = findScrollContainer(document.body);
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);
  
  // Находим категорию из существующих опций или используем значение из карточки
  const getCategoryValue = (categoryLabel?: string): string => {
    if (!categoryLabel) return categoryOptions[0]?.value ?? '';
    const found = categoryOptions.find(opt => opt.label.toLowerCase() === categoryLabel.toLowerCase());
    return found?.value ?? categoryOptions[0]?.value ?? '';
  };

  const [category, setCategory] = useState<string>(
    cardToEdit ? getCategoryValue(cardToEdit.category) : (categoryOptions[0]?.value ?? '')
  );
  const [title, setTitle] = useState(cardToEdit?.title ?? '');
  const [shortDescription, setShortDescription] = useState(cardToEdit?.subtitle ?? '');
  const [description, setDescription] = useState(cardToEdit?.text ?? '');
  const [link, setLink] = useState(cardToEdit?.link ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(cardToEdit?.image ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showModerationAlert, setShowModerationAlert] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isFormValid =
    title.trim().length > 0 &&
    shortDescription.trim().length > 0 &&
    description.trim().length > 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageFile(file || null);
    setImageName(file ? file.name : null);
    setImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= 100) {
      setTitle(value);
    }
  };

  const handleShortDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= 200) {
      setShortDescription(value);
    }
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= 1000) {
      setDescription(value);
    }
  };

  const handleLinkChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= 500) {
      setLink(value);
    }
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!isFormValid) {
      setSubmitError('Заполните обязательные поля');
      return;
    }

    const selectedCategory = categoryOptions.find((option) => option.value === category);
    const categoryLabel = selectedCategory?.label ?? category;
    const trimmedLink = link.trim();

    setSubmitting(true);
    setSubmitError(null);

    try {
      const maxUser = getMaxUser();
      
      if (isEditMode && cardToEdit) {
        // Режим редактирования
        const updatePayload: any = {
          card_id: cardToEdit.id,
          category: categoryLabel,
          title: title.trim(),
          subtitle: shortDescription.trim(),
          text: description.trim(),
          ...(trimmedLink ? { link: trimmedLink } : { link: '' }),
          ...(imageFile ? { image: imageFile } : {}),
        };
        
        await updateMaxCardFromUI(updatePayload);

        if (maxUser?.id) {
          console.log(`✅ Карточка отредактирована для пользователя ${maxUser.id}`);
          await userCardsCache.invalidateUserCache(maxUser.id);
        }

        if (onSuccess) {
          onSuccess();
        } else {
          setShowModerationAlert(true);
        }
      } else {
        // Режим создания
        const payload = {
          category: categoryLabel,
          title: title.trim(),
          subtitle: shortDescription.trim(),
          text: description.trim(),
          status: 'moderate',
          ...(trimmedLink ? { link: trimmedLink } : {}),
          ...(imageFile ? { image: imageFile } : {}),
          ...(maxUser ? { user_id: maxUser.id } : {}),
        };
        const createdCard = await createMaxCardFromUI(payload);

        if (maxUser?.id) {
          console.log(`✅ Карточка создана для пользователя ${maxUser.id}`);
          if (createdCard.status === 'accepted') {
            userCardsCache.addCardToCache(maxUser.id, createdCard);
          } else {
            userCardsCache.invalidateUserCache(maxUser.id).catch((err) => {
              console.error('Failed to invalidate cache:', err);
            });
          }
        }

        setCategory(categoryOptions[0]?.value ?? '');
        setTitle('');
        setShortDescription('');
        setDescription('');
        setLink('');
        setImageFile(null);
        setImageName(null);
        setImagePreview((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return null;
        });

        setShowModerationAlert(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : (isEditMode ? 'Не удалось обновить инициативу' : 'Не удалось опубликовать инициативу');
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleAlertClose = () => {
    setShowModerationAlert(false);
    onBack();
  };

  return (
    <div style={containerStyle}>
      <ModerationAlert visible={showModerationAlert} onClose={handleAlertClose} />
      
      <button type="button" onClick={onBack} style={backButtonStyle}>
        <ArrowLeftIcon />
        Назад
      </button>

      <div style={headerBlockStyle}>
        <Typography.Title style={{ margin: 0, fontSize: 28 }}>
          {isEditMode ? 'Редактировать инициативу' : 'Создать инициативу'}
        </Typography.Title>
        <Typography.Body style={{ color: colors.textSecondary }}>
          {isEditMode 
            ? 'Внесите изменения в вашу инициативу'
            : 'Поделись собственной инициативой с сообществом!'}
        </Typography.Body>
      </div>

      <label htmlFor={uploadInputId} style={uploadCardStyle}>
        <input
          id={uploadInputId}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={uploadAreaStyle}>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Предпросмотр обложки"
              style={{ 
                width: '100%', 
                height: '100%', 
                maxWidth: '100%',
                objectFit: 'cover', 
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ) : (
            <UploadIcon />
          )}
        </div>
        <Typography.Body style={{ textAlign: 'center', color: colors.textPrimary }}>
          {imageName ?? (cardToEdit?.image ? 'Текущее изображение' : 'Загрузите изображение')}
        </Typography.Body>
        <Typography.Label style={{ ...uploadHintStyle, fontSize: 13 }}>
          PNG, JPG до 5MB
        </Typography.Label>
        <Typography.Label style={{ ...uploadHintStyle, fontSize: 13 }}>
          Лучше всего подходят горизонтальные фото
        </Typography.Label>
      </label>

      <div style={categorySectionStyle}>
        <Typography.Label style={labelStyle}>Категория</Typography.Label>
        {categoryOptions.map(({ value, label, Icon }) => {
          const isActive = category === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={isActive}
              style={{
                ...categoryButtonStyle,
                backgroundColor: isActive ? 'rgba(43, 71, 255, 0.18)' : categoryButtonStyle.backgroundColor,
                border: isActive ? `1px solid ${colors.filterActiveBorder}` : categoryButtonStyle.border,
                color: isActive ? colors.textPrimary : categoryButtonStyle.color,
              }}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </div>

      <div style={fieldGroupStyle}>
        <Typography.Label style={labelStyle}>Название</Typography.Label>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Textarea
            mode="secondary"
            placeholder="Название инициативы"
            value={title}
            onChange={handleTitleChange}
            onFocus={() => setFocusedField('title')}
            onBlur={() => setFocusedField(null)}
            maxLength={100}
            style={{
              ...inputStyle,
              ...(focusedField === 'title' ? inputFocusStyle : {}),
            }}
          />
        </div>
        <Typography.Label style={charCounterStyle}>
          {title.length}/100
        </Typography.Label>
      </div>

      <div style={fieldGroupStyle}>
        <Typography.Label style={labelStyle}>Краткое описание</Typography.Label>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Textarea
            mode="secondary"
            placeholder="Расскажите кратко о мероприятии"
            value={shortDescription}
            onChange={handleShortDescriptionChange}
            onFocus={() => setFocusedField('shortDescription')}
            onBlur={() => setFocusedField(null)}
            maxLength={200}
            style={{
              ...textareaStyle,
              ...(focusedField === 'shortDescription' ? inputFocusStyle : {}),
            }}
          />
        </div>
        <Typography.Label style={charCounterStyle}>
          {shortDescription.length}/200
        </Typography.Label>
      </div>

      <div style={fieldGroupStyle}>
        <Typography.Label style={labelStyle}>Описание</Typography.Label>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Textarea
            mode="secondary"
            placeholder="Расскажите о мероприятии"
            value={description}
            onChange={handleDescriptionChange}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            maxLength={1000}
            style={{
              ...textareaStyle,
              minHeight: 140,
              ...(focusedField === 'description' ? inputFocusStyle : {}),
            }}
          />
        </div>
        <Typography.Label style={charCounterStyle}>
          {description.length}/1000
        </Typography.Label>
      </div>

      <div style={fieldGroupStyle}>
        <Typography.Label style={labelStyle}>Ссылка на мероприятие</Typography.Label>
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Textarea
            mode="secondary"
            placeholder="https://example.ru"
            value={link}
            onChange={handleLinkChange}
            onFocus={() => setFocusedField('link')}
            onBlur={() => setFocusedField(null)}
            maxLength={500}
            style={{
              ...inputStyle,
              ...(focusedField === 'link' ? inputFocusStyle : {}),
            }}
          />
        </div>
        <Typography.Label style={charCounterStyle}>
          {link.length}/500
        </Typography.Label>
      </div>

      <div style={actionAreaStyle}>
        <Button
          mode="primary"
          size="large"
          stretched
          style={{ borderRadius: 18 }}
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
        >
          {submitting 
            ? (isEditMode ? 'Сохраняем...' : 'Публикуем...') 
            : (isEditMode ? 'Сохранить изменения' : 'Опубликовать инициативу')}
        </Button>
        {submitError && (
          <Typography.Label style={{ color: colors.error, marginTop: 12 }}>
            {submitError}
          </Typography.Label>
        )}
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 5 8 12l7 7"
        stroke={colors.textSecondary}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect
        x="6"
        y="6"
        width="24"
        height="24"
        rx="8"
        stroke="rgba(127, 160, 255, 0.7)"
        strokeWidth="1.5"
      />
      <path
        d="M18 23v-10m0 0 4 4m-4-4-4 4"
        stroke="rgba(127, 160, 255, 0.9)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20s-6-3.7-8-7.1C2.9 10.7 3.2 7 6.4 6.3c1.7-.4 3 1 3.6 2 .6-1 1.9-2.4 3.6-2 3.2.7 3.5 4.4 2.4 6.6C18 16.3 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 5c-7.5.3-11.7 3.9-13.6 6.8-1.7 2.5-.9 5.5 1.6 6.7 2.5 1.1 5.2.4 6.7-1.7C15.5 14.6 19 5 19 5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M6 18s3-4 7-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="m5 13 3.2 1.8c1.7.9 3.8 1 5.5.1L19 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 6v4l-2 3m12-7v4l2 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 6s3-1 5-1 5 1 5 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
