import { useState, useCallback, ChangeEvent, FormEvent } from "react";

type ValidationRules<T> = Partial<
  Record<keyof T, (value: T[keyof T], formValues: T) => string | null>
>;

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T, resetForm: () => void) => void;
}

/**
 * Хук для управління станом форми та валідацією
 */
function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Скидання форми до початкових значень
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Валідація окремого поля
  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      const validateRule = validationRules[name];
      if (validateRule) {
        const errorMessage = validateRule(value, values);
        return errorMessage;
      }
      return null;
    },
    [validationRules, values],
  );

  // Валідація всієї форми
  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const fieldKey = key as keyof T;
      const error = validateField(fieldKey, values[fieldKey]);
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Обробник зміни полів форми
  const handleChange = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target;
      let fieldValue: string | number | boolean = value;

      // Конвертація значень для числових полів
      if (type === "number") {
        fieldValue = value === "" ? "" : Number(value);
      }

      // Конвертація значень для чекбоксів
      if (type === "checkbox" && "checked" in e.target) {
        fieldValue = (e.target as HTMLInputElement).checked;
      }

      // Встановлення нового значення
      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Позначення поля як "торкнутого"
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Валідація поля при зміні
      const error = validateField(name as keyof T, fieldValue as T[keyof T]);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField],
  );

  // Встановлення значення поля програмно
  const setFieldValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Валідація поля при зміні
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField],
  );

  // Обробник події blur для поля
  const handleBlur = useCallback(
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name } = e.target;

      // Позначення поля як "торкнутого"
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Валідація поля при втраті фокусу
      const error = validateField(name as keyof T, values[name as keyof T]);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField, values],
  );

  // Обробник відправки форми
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Позначаємо всі поля як "торкнуті"
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        {} as Partial<Record<keyof T, boolean>>,
      );

      setTouched(allTouched);

      // Валідуємо форму перед відправкою
      const isValid = validateForm();

      if (isValid && onSubmit) {
        setIsSubmitting(true);
        onSubmit(values, resetForm);
      }
    },
    [values, validateForm, onSubmit, resetForm],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    validateForm,
  };
}

export default useForm;
