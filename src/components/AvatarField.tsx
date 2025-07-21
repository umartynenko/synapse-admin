// src/components/AvatarField.tsx

import { Avatar, AvatarProps, Badge, Tooltip } from "@mui/material";
import { get } from "lodash";
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { FieldProps, useRecordContext, useTranslate } from "react-admin";

import { fetchAuthenticatedMedia } from "../utils/fetchMedia";
import { isMXID, isASManaged } from "../utils/mxid";

// --- Вспомогательные функции и компоненты ---

/**
 * Генерирует инициалы из имени по заданной логике.
 * "Группа" -> "Г"
 * "Группа 2" -> "Г2"
 * "123" -> "123"
 * "Чат ЗЧ" -> "ЧЗЧ"
 */
const generateInitials = (name: string): string => {
  if (!name) return "?";

  // Список специальных слов, которые нужно использовать целиком
  const specialWords = new Set(["ЗЧ", "ОЧ"]);
  const isNumeric = /^\d+$/;

  const words = name.split(/[\s-]+/);

  const initials = words
    .map(word => {
      if (!word) return "";

      // 1. Если слово специальное или является числом, используем его целиком
      if (specialWords.has(word) || isNumeric.test(word)) {
        return word;
      }

      // 2. В противном случае, берем первую букву
      return word.charAt(0).toUpperCase();
    })
    .join("");

  return initials;
};

/**
 * Компонент, отображающий текст внутри SVG.
 * Текст автоматически масштабируется, чтобы поместиться в контейнер, сохраняя пропорции.
 */
const DynamicProportionalText = ({ text }: { text: string }) => {
  const textRef = useRef<SVGTextElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;

    const textWidth = textElement.getBBox().width;
    const desiredWidth = 90; // Максимальная ширина (90% от viewBox)

    if (textWidth > desiredWidth) {
      setScale(desiredWidth / textWidth);
    } else {
      setScale(1);
    }
  }, [text]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <g transform={`translate(50, 50) scale(${scale})`}>
        <text
          ref={textRef}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 50, // Большой базовый размер для точных измерений
            fill: "currentColor", // Цвет текста наследуется от Avatar
          }}
        >
          {text}
        </text>
      </g>
    </svg>
  );
};

// --- Основной компонент AvatarField ---

const AvatarField = ({ source, ...rest }: AvatarProps & FieldProps) => {
  const { alt, classes, sizes, sx, variant } = rest;
  const record = useRecordContext(rest);
  const mxcURL = get(record, source)?.toString();

  const [src, setSrc] = useState<string>("");

  const fetchAvatar = useCallback(async (mxcURL: string) => {
    try {
      const response = await fetchAuthenticatedMedia(mxcURL, "thumbnail");
      const blob = await response.blob();
      const blobURL = URL.createObjectURL(blob);
      setSrc(blobURL);
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
      setSrc(""); // Убедимся, что при ошибке будет показан fallback
    }
  }, []);

  useEffect(() => {
    if (mxcURL) {
      fetchAvatar(mxcURL);
    }

    // Функция очистки для предотвращения утечек памяти
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [mxcURL, fetchAvatar]);

  // --- Логика для fallback-аватара ---
  const nameForInitials = record?.displayname || record?.name || record?.id || "";
  const letter = generateInitials(nameForInitials);

  // --- Логика для бейджей и подсказок (для пользователей) ---
  let badge = "";
  let tooltip = "";
  const translate = useTranslate();

  if (isMXID(record?.id)) {
    switch (record?.user_type) {
      case "bot":
        badge = "🤖";
        tooltip = translate("resources.users.badge.bot");
        break;
      case "support":
        badge = "📞";
        tooltip = translate("resources.users.badge.support");
        break;
      default:
        badge = "👤";
        tooltip = translate("resources.users.badge.regular");
        break;
    }
    if (record?.admin) {
      badge = "👑";
      tooltip = translate("resources.users.badge.admin");
    }
    if (isASManaged(record?.name)) {
      badge = "🛡️";
      tooltip = `${translate("resources.users.badge.system_managed")} (${tooltip})`;
    }
    if (localStorage.getItem("user_id") === record?.id) {
      badge = "🧙‍";
      tooltip = `${translate("resources.users.badge.you")} (${tooltip})`;
    }
  }

  // Создаем сам аватар. Если `src` есть, отобразится картинка, иначе — дочерний SVG-элемент.
  const avatar = (
    <Avatar alt={alt} classes={classes} sizes={sizes} src={src} sx={sx} variant={variant}>
      <DynamicProportionalText text={letter} />
    </Avatar>
  );

  // Если для пользователя определен бейдж, оборачиваем аватар в Badge и Tooltip
  if (badge) {
    return (
      <Tooltip title={tooltip}>
        <Badge
          badgeContent={badge}
          overlap="circular"
          sx={{ "& .MuiBadge-badge": { width: "10px" } }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          {avatar}
        </Badge>
      </Tooltip>
    );
  }

  // Возвращаем обычный аватар (с картинкой или с fallback-текстом)
  return avatar;
};

export default AvatarField;
