import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { campaignsAPI } from '../../api/apiClient';
import { CampaignType, MessageData } from '../../types/api';
import { Button, Input, TextArea, Select, Alert } from '../common';

interface MessageFormProps {
  campaignId: number;
  campaignType: CampaignType;
  onClose: () => void;
}

// Схема валідації для різних типів повідомлень
const getMessageSchema = (campaignType: CampaignType) => {
  return yup.object({
    messageType: yup.string().required('Тип повідомлення обов\'язковий'),
    content: yup.string().required('Текст повідомлення обов\'язковий'),
    subject: yup.string().when(['messageType', 'campaignType'], {
      is: (messageType: string) => messageType === 'EMAIL',
      then: (schema) => schema.required('Тема листа обов\'язкова'),
      otherwise: (schema) => schema.notRequired(),
    }),
  }) as yup.ObjectSchema<MessageData>;
};

const MessageForm: React.FC<MessageFormProps> = ({ campaignId, campaignType, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Визначаємо доступні типи повідомлень в залежності від типу кампанії
  const getMessageTypes = () => {
    switch (campaignType) {
      case 'EMAIL':
        return [{ value: 'EMAIL', label: 'Email повідомлення' }];
      case 'SMS':
        return [{ value: 'SMS', label: 'SMS повідомлення' }];
      case 'PUSH':
        return [{ value: 'PUSH', label: 'Push повідомлення' }];
      case 'MIXED':
        return [
          { value: 'EMAIL', label: 'Email повідомлення' },
          { value: 'SMS', label: 'SMS повідомлення' },
          { value: 'PUSH', label: 'Push повідомлення' },
        ];
      default:
        return [];
    }
  };

  const messageTypes = getMessageTypes();
  const defaultMessageType: 'EMAIL' | 'SMS' | 'PUSH' | undefined = messageTypes.length > 0 ? (messageTypes[0]?.value as 'EMAIL' | 'SMS' | 'PUSH') : undefined;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<MessageData>({
    resolver: yupResolver(getMessageSchema(campaignType)),
    defaultValues: {
      ...(defaultMessageType ? { messageType: defaultMessageType } : {}),
      content: '',
      subject: '',
    },
  });

  const selectedMessageType = watch('messageType');

  const onSubmit = async (data: MessageData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await campaignsAPI.startMessages(campaignId, data);
      setSuccess('Розсилку успішно запущено');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Помилка при запуску розсилки:', err);
      setError('Не вдалося запустити розсилку. Спробуйте пізніше.');
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип повідомлення *
          </label>
          <Controller
            name="messageType"
            control={control}
            render={({ field }) => (
              <Select
                options={messageTypes}
                value={field.value}
                onChange={field.onChange}
                error={errors.messageType?.message ?? ''}
              />
            )}
          />
        </div>

        {selectedMessageType === 'EMAIL' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тема листа *
            </label>
            <Input
              {...register('subject')}
              placeholder="Введіть тему листа"
              error={errors.subject?.message ?? ''}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст повідомлення *
          </label>
          <TextArea
            {...register('content')}
            placeholder={
              selectedMessageType === 'EMAIL'
                ? 'Введіть HTML-вміст листа'
                : selectedMessageType === 'SMS'
                ? 'Введіть текст SMS-повідомлення'
                : 'Введіть текст Push-повідомлення'
            }
            rows={6}
            error={errors.content?.message ?? ''}
          />
          {selectedMessageType === 'SMS' && (
            <p className="text-xs text-gray-500 mt-1">
              Максимальна довжина SMS: 160 символів
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Запустити розсилку
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageForm;