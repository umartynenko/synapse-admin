// src/components/ClampedNumberInput.js
import { NumberInput, useInput } from 'react-admin';

/**
 * Компонент-обертка над NumberInput, который "зажимает" (clamps)
 * значение между min и max, когда пользователь убирает фокус с поля (onBlur).
 * Это позволяет свободно вводить промежуточные числа (например, '1' для ввода '10').
 *
 * @param {object} props - Пропсы, которые передаются в NumberInput, включая min и max.
 */
export const ClampedNumberInput = (props) => {
  const { min, max, ...rest } = props;

  // Используем хук useInput, чтобы получить контроль над полем
  const { field } = useInput(props);

  // Создаем обработчик для события onBlur
  const handleBlur = (event) => {
    const value = event.target.value;

    // Если поле пустое, ничего не делаем. Валидатор required() об этом позаботится.
    if (value === '' || value === null || value === undefined) {
      // Вызываем оригинальный onBlur, если он был передан в пропсах
      if (props.onBlur) {
        props.onBlur(event);
      }
      return;
    }

    // Преобразуем значение в число. Используем parseInt, так как работаем с целыми числами.
    const numValue = parseInt(value, 10);

    // Если введено не число, выходим. Валидатор number() покажет ошибку.
    if (isNaN(numValue)) {
      if (props.onBlur) {
        props.onBlur(event);
      }
      return;
    }

    let clampedValue = numValue;

    // Проверяем и "зажимаем" значение в заданных границах
    if (min !== undefined && numValue < min) {
      clampedValue = min;
    } else if (max !== undefined && numValue > max) {
      clampedValue = max;
    }

    // Если значение было изменено, обновляем состояние формы
    // Это предотвращает лишние перерисовки, если значение было введено корректно
    if (clampedValue !== numValue) {
      field.onChange(clampedValue);
    }

    // Вызываем оригинальный onBlur, если он был передан
    if (props.onBlur) {
      props.onBlur(event);
    }
  };

  // Передаем наш кастомный onBlur в стандартный NumberInput
  return <NumberInput {...rest} {...field} onBlur={handleBlur} />;
};
