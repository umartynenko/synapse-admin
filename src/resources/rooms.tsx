import EventIcon from "@mui/icons-material/Event";
import FastForwardIcon from "@mui/icons-material/FastForward";
import UserIcon from "@mui/icons-material/Group";
import HttpsIcon from "@mui/icons-material/Https";
import NoEncryptionIcon from "@mui/icons-material/NoEncryption";
import PageviewIcon from "@mui/icons-material/Pageview";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import PersonIcon from "@mui/icons-material/Person";
import { default as RoomIcon, default as ViewListIcon } from "@mui/icons-material/ViewList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import {
  AutocompleteInput,
  BooleanField,
  Confirm,
  Create,
  CreateButton,
  Datagrid,
  DatagridConfigurable,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  ExportButton,
  FunctionField,
  List,
  ListProps,
  Loading,
  maxValue,
  minValue,
  number,
  NumberField,
  Pagination,
  ReferenceField,
  ReferenceManyField,
  required,
  ResourceProps,
  SearchInput,
  SelectColumnsButton,
  SelectField,
  SelectInput,
  Show,
  ShowProps,
  SimpleForm,
  Tab as RaTab,
  TabbedShowLayout,
  TextField as RaTextField,
  TextInput,
  TopToolbar,
  useDataProvider,
  useGetList,
  useListContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
  WrapperField,
} from "react-admin";
import AddSubscriberAdminButton from "../components/AddSubscriberAdminButton";
import { useWatch } from "react-hook-form";

import {
  RoomDirectoryBulkPublishButton,
  RoomDirectoryBulkUnpublishButton,
  RoomDirectoryPublishButton,
  RoomDirectoryUnpublishButton,
} from "./room_directory";

import AvatarField from "../components/AvatarField";
import BlockUserButton from "../components/BlockUserButton";
import { ClampedNumberInput } from "../components/ClampedNumberInput";
import DeleteRoomButton from "../components/DeleteRoomButton";
import { SubspaceTreeInput } from "../components/SubspaceTreeInput";
import { MediaIDField } from "../components/media";
import { Room } from "../synapse/dataProvider";
import { DATE_FORMAT } from "../utils/date";
import { isASManaged } from "../utils/mxid"; // <-- ИЗМЕНЕНИЕ: Импорт для проверки системных пользователей

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Компонент для редактирования названия и описания комнаты (чата или пространства).
 *
 * Этот компонент является "Edit" представлением для ресурса `rooms` в `react-admin`.
 * Он предоставляет простую форму с двумя полями:
 * - `name` (Название): Обязательное текстовое поле.
 * - `topic` (Описание): Многострочное текстовое поле.
 *
 * **Особенности:**
 * - **Контекстно-зависимый заголовок:** Заголовок формы меняется в зависимости от того,
 *   редактируется ли "пространство" или "чат".
 * - **Предупреждение для пространств:** Если редактируемый объект является пространством
 *   (`room_type === 'm.space'`), компонент отображает `Alert`, информирующий
 *   пользователя о том, что изменение имени вызовет каскадное обновление
 *   имен всех дочерних чатов в иерархии.
 * - **Пессимистичное обновление:** Использует `mutationMode="pessimistic"`, что гарантирует
 *   обновление данных в UI только после подтверждения от сервера.
 *
 * @component
 * @returns {JSX.Element} Компонент `<Edit>`, содержащий форму для редактирования комнаты.
 */
export const RoomEdit = () => {
  const record = useRecordContext<Room>();
  const isSpace = record?.room_type === "m.space";
  const translate = useTranslate();

  return (
    <Edit mutationMode="pessimistic" title={<RoomTitle />}>
      <SimpleForm>
        <Typography variant="h6" gutterBottom>
          {translate("ra.action.edit")} {isSpace ? "пространства" : "чата"}
        </Typography>
        {isSpace && (
          <Alert severity="info">
            При изменении названия этого пространства будут автоматически переименованы все дочерние чаты в его
            иерархии.
          </Alert>
        )}
        <TextInput source="name" validate={[required()]} fullWidth label="Название" />
        <TextInput source="topic" fullWidth multiline label="Описание" />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Генерирует аббревиатуру из строки (например, из названия пространства или отдела).
 *
 * Функция разбивает входную строку на слова по пробелам и дефисам.
 * Для каждого слова применяется следующая логика:
 * - Если слово состоит только из цифр, оно добавляется в аббревиатуру целиком.
 * - В противном случае, берется только первая буква слова.
 *
 * Все полученные части соединяются в одну строку в нижнем регистре.
 *
 * @param {string} name - Входная строка для генерации аббревиатуры.
 * @returns {string} Сгенерированная аббревиатура в нижнем регистре.
 *
 * @example
 * generateAbbreviation("Главный Офис")
 * // => "го"
 *
 * @example
 * generateAbbreviation("Сектор 12-А")
 * // => "с12а"
 *
 * @example
 * generateAbbreviation("Отдел 7")
 * // => "о7"
 *
 * @example
 * generateAbbreviation("")
 * // => ""
 */
const generateAbbreviation = (name: string): string => {
  if (!name) return "";

  // Регулярное выражение для проверки, состоит ли строка только из цифр
  const isNumeric = /^\d+$/;

  const words = name.split(/[\s-]+/);

  return words
    .map(word => {
      // Если слово - это число, используем его целиком.
      // В противном случае, берем первую букву.
      return isNumeric.test(word) ? word.toLowerCase() : word.charAt(0).toLowerCase();
    })
    .join("");
};

/**
 * Генерирует форматированное имя чата на основе иерархического имени и типа чата.
 *
 * Функция преобразует иерархическое имя (например, "Главный офис / Отдел продаж")
 * в сокращенный префикс, сохраняя последнюю часть имени целиком.
 *
 * Логика работы:
 * 1. Иерархическое имя разделяется на части по " / ".
 * 2. Последняя часть (например, "Отдел продаж") используется как есть.
 * 3. Каждая предыдущая часть ("Главный офис") преобразуется в аббревиатуру:
 *    - Числа остаются без изменений.
 *    - Стоп-слова (союзы, предлоги) остаются в нижнем регистре.
 *    - От остальных слов берется первая заглавная буква.
 * 4. Сокращенные части соединяются через точку, формируя префикс.
 * 5. Результат собирается в формате: "[префикс.]<последняя часть> <тип чата>".
 *
 * @param {string} hierarchicalName - Иерархическое имя, например "Сектор 12 / Группа А".
 * @param {string} chatType - Тип чата, который добавляется в конец, например "ОЧ" или "ЗЧ".
 * @returns {string} Отформатированное имя чата.
 *
 * @example
 * generateChatName("Главный офис / Отдел продаж", "ЗЧ")
 * // => "ГО.Отдел продаж ЗЧ"
 *
 * @example
 * generateChatName("Сектор 12 / Группа А", "ОЧ")
 * // => "С12.Группа А ОЧ"
 *
 * @example
 * generateChatName("Отдел маркетинга", "Лента")
 * // => "Отдел маркетинга Лента"
 *
 * @example
 * generateChatName("", "Общий чат")
 * // => "Общий чат"
 */
export const generateChatName = (hierarchicalName: string, chatType: string): string => {
  if (!hierarchicalName) return chatType;
  const stopWords = ["и", "а", "в", "на", "с", "к", "по", "о", "из", "у", "за", "над", "под"];
  const isNumeric = /^\d+$/;
  const parts = hierarchicalName.split(" / ");
  const lastPart = parts.pop() || "";

  const processedParts = parts.map(part => {
    const words = part.split(/[\s-]+/);
    return words
      .map(word => {
        if (!word) return "";
        if (isNumeric.test(word)) return word;
        const lowerCaseWord = word.toLowerCase();
        if (stopWords.includes(lowerCaseWord)) return lowerCaseWord;
        return word.charAt(0).toUpperCase();
      })
      .join("");
  });

  const baseName = processedParts.length > 0 ? processedParts.join(".") + "." : "";
  return `${baseName}${lastPart} ${chatType}`;
};

const RoomPagination = () => <Pagination rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]} />;

const RoomTitle = () => {
  const record = useRecordContext();
  const translate = useTranslate();
  return (
    <span>
      {translate("resources.rooms.name", 1)} {record ? record.name || record.id : ""}
    </span>
  );
};

const RoomShowActions = () => {
  const record = useRecordContext();
  if (!record) return null;
  const publishButton = record?.public ? <RoomDirectoryUnpublishButton /> : <RoomDirectoryPublishButton />;
  return (
    <TopToolbar>
      {publishButton}
      <MakeAdminBtn />
      <DeleteRoomButton
        selectedIds={[record.id]}
        confirmTitle="resources.rooms.action.erase.title"
        confirmContent="resources.rooms.action.erase.content"
      />
    </TopToolbar>
  );
};

export const MakeAdminBtn = () => {
  const record = useRecordContext<Room>();
  const [open, setOpen] = useState(false);
  const [userIdValue, setUserIdValue] = useState(localStorage.getItem("user_id") || "");
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const translate = useTranslate();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // @ts-ignore
      const result = await dataProvider.makeRoomAdmin(record.room_id, userIdValue);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      notify("resources.rooms.action.make_admin.success", { type: "success" });
      setOpen(false);
    },
    onError: (err: any) => {
      notify("resources.rooms.action.make_admin.failure", { type: "error", messageArgs: { errMsg: err.message } });
      setOpen(false);
    },
  });

  if (!record || record.joined_local_members < 1) return null;

  const handleConfirm = () => mutate();

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)} disabled={isPending}>
        <PersonIcon /> {translate("resources.rooms.action.make_admin.assign_admin")}
      </Button>
      <Confirm
        isOpen={open}
        onConfirm={handleConfirm}
        onClose={() => setOpen(false)}
        title={translate("resources.rooms.action.make_admin.title", { roomName: record.name || record.room_id })}
        content={
          <>
            <Typography sx={{ mb: 2 }}>{translate("resources.rooms.action.make_admin.content")}</Typography>
            <TextField
              type="text"
              variant="filled"
              value={userIdValue}
              onChange={e => setUserIdValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConfirm()}
              label="Matrix ID"
            />
          </>
        }
      />
    </>
  );
};

// --- ИЗМЕНЕНИЕ: Добавлен компонент для предотвращения само-удаления ---
const MemberPreventSelfDelete = ({ children, isCurrentUser, isManagedUser }) => {
  const notify = useNotify();
  const translate = useTranslate();
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentUser) {
      notify("resources.users.helper.erase_admin_error", { type: "error" });
      e.stopPropagation();
    } else if (isManagedUser) {
      notify("resources.users.helper.modify_managed_user_error", { type: "error" });
      e.stopPropagation();
    }
  };
  return <div onClickCapture={handleClick}>{children}</div>;
};

// --- ИЗМЕНЕНИЕ: Добавлен компонент с кнопками действий для участника комнаты ---
const RoomMemberActions = () => {
  const record = useRecordContext();
  if (!record) return null;

  const ownUserId = localStorage.getItem("user_id");
  const isCurrentUser = record.id === ownUserId;
  const isManagedUser = isASManaged(record.id);

  return (
    <Box sx={{ display: "inline-flex", flexWrap: "nowrap" }}>
      <EditButton resource="users" record={record} disabled={isManagedUser} />
      <MemberPreventSelfDelete isCurrentUser={isCurrentUser} isManagedUser={isManagedUser}>
        <BlockUserButton record={record} />
      </MemberPreventSelfDelete>
    </Box>
  );
};

/**
 * Отображает страницу с детальной информацией о комнате или пространстве.
 *
 * Этот компонент является "Show" представлением для ресурса `rooms` в `react-admin`.
 * Он использует `TabbedShowLayout` для организации данных по различным вкладкам:
 * основная информация, участники, права доступа, медиа и т.д.
 *
 * Ключевая особенность — **встроенное редактирование названия**. Пользователь может
 * изменить название комнаты прямо на этой странице. Логика редактирования
 * управляется состоянием (`useState`) и функцией `handleSave`.
 *
 * При сохранении `handleSave` вызывает метод `dataProvider.sendStateEvent` для отправки
 * события `m.room.name` на сервер, обновляя название комнаты в Matrix.
 * Для обратной связи с пользователем используется хук `useNotify`, а для обновления
 * данных на странице — `useRefresh`.
 *
 * @component
 * @param {ShowProps} props - Стандартные пропсы для компонента Show в `react-admin`.
 * @returns {JSX.Element} Компонент `<Show>`, содержащий детальную информацию о комнате.
 */
export const RoomShow = (props: ShowProps) => {
  const translate = useTranslate();
  const record = useRecordContext<Room>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(record?.name || "");
  const [saving, setSaving] = useState(false);
  const [, setRerender] = useState(0); // для форс-обновления UI

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      // @ts-ignore
      await dataProvider.sendStateEvent(
        record.room_id,
        "m.room.name",
        "",
        { name: newName },
        localStorage.getItem("user_id")
      );
      notify("Имя пространства обновлено", { type: "success" });
      setEditing(false);
      if (record.name !== undefined) record.name = newName; // обновить локальный record
      setNewName(newName); // обновить поле ввода
      setRerender(x => x + 1); // форс-обновление UI
      refresh(); // перезагрузить данные Show view
    } catch (e: any) {
      notify(`Ошибка: ${e.message}`, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Show {...props} actions={<RoomShowActions />} title={<RoomTitle />}>
      <TabbedShowLayout>
        <RaTab label="synapseadmin.rooms.tabs.basic" icon={<ViewListIcon />}>
          <AvatarField source="avatar" sx={{ height: "120px", width: "120px" }} label="resources.rooms.fields.avatar" />
          <RaTextField source="room_id" />
          <RaTextField source="name" />
          <RaTextField source="topic" />
          <RaTextField source="canonical_alias" />
          <ReferenceField source="creator" reference="users" link="show">
            <RaTextField source="id" />
          </ReferenceField>
        </RaTab>
        <RaTab label="synapseadmin.rooms.tabs.detail" icon={<PageviewIcon />} path="detail">
          <RaTextField source="joined_members" />
          <RaTextField source="joined_local_members" />
          <RaTextField source="joined_local_devices" />
          <RaTextField source="state_events" />
          <RaTextField source="version" />
          <RaTextField source="encryption" emptyText={translate("resources.rooms.enums.unencrypted")} />
        </RaTab>
        <RaTab label="synapseadmin.rooms.tabs.members" icon={<UserIcon />} path="members">
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <MakeAdminBtn />
            <AddSubscriberAdminButton />
          </Box>
          <ReferenceManyField reference="room_members" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} rowClick={id => `/users/${id}/show`} bulkActionButtons={false}>
              <RaTextField source="id" sortable={false} label="resources.users.fields.id" />
              <ReferenceField
                label="resources.users.fields.displayname"
                source="id"
                reference="users"
                sortable={false}
                link=""
              >
                <RaTextField source="displayname" sortable={false} />
              </ReferenceField>
            </Datagrid>
          </ReferenceManyField>
        </RaTab>
        <RaTab label="synapseadmin.rooms.tabs.media" icon={<PermMediaIcon />} path="media">
          <Alert severity="warning">{translate("resources.room_media.helper.info")}</Alert>
          <ReferenceManyField reference="room_media" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} bulkActionButtons={false}>
              <MediaIDField source="media_id" />
              <DeleteButton mutationMode="pessimistic" redirect={false} />
            </Datagrid>
          </ReferenceManyField>
        </RaTab>
        <RaTab label="synapseadmin.rooms.tabs.permission" icon={<VisibilityIcon />} path="permission">
          <BooleanField source="federatable" />
          <BooleanField source="public" />
          <SelectField
            source="join_rules"
            choices={[
              { id: "public", name: "resources.rooms.enums.join_rules.public" },
              { id: "knock", name: "resources.rooms.enums.join_rules.knock" },
              { id: "invite", name: "resources.rooms.enums.join_rules.invite" },
              { id: "private", name: "resources.rooms.enums.join_rules.private" },
            ]}
          />
          <SelectField
            source="guest_access"
            choices={[
              { id: "can_join", name: "resources.rooms.enums.guest_access.can_join" },
              { id: "forbidden", name: "resources.rooms.enums.guest_access.forbidden" },
            ]}
          />
          <SelectField
            source="history_visibility"
            choices={[
              { id: "invited", name: "resources.rooms.enums.history_visibility.invited" },
              { id: "joined", name: "resources.rooms.enums.history_visibility.joined" },
              { id: "shared", name: "resources.rooms.enums.history_visibility.shared" },
              { id: "world_readable", name: "resources.rooms.enums.history_visibility.world_readable" },
            ]}
          />
        </RaTab>
        <RaTab label={translate("resources.room_state.name", { smart_count: 2 })} icon={<EventIcon />} path="state">
          <ReferenceManyField reference="room_state" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} bulkActionButtons={false}>
              <RaTextField source="type" sortable={false} />
              <DateField source="origin_server_ts" showTime options={DATE_FORMAT} sortable={false} />
              <FunctionField
                source="content"
                sortable={false}
                render={record => `${JSON.stringify(record.content, null, 2)}`}
              />
              <ReferenceField source="sender" reference="users" sortable={false} link="show">
                <RaTextField source="id" />
              </ReferenceField>
            </Datagrid>
          </ReferenceManyField>
        </RaTab>
        <RaTab label="resources.forward_extremities.name" icon={<FastForwardIcon />} path="forward_extremities">
          <Box sx={{ fontFamily: "Roboto, Helvetica, Arial, sans-serif", margin: "0.5em" }}>
            {translate("resources.rooms.helper.forward_extremities")}
          </Box>
          <ReferenceManyField reference="forward_extremities" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} bulkActionButtons={false}>
              <RaTextField source="id" sortable={false} />
              <DateField source="received_ts" showTime options={DATE_FORMAT} sortable={false} />
              <NumberField source="depth" sortable={false} />
              <RaTextField source="state_group" sortable={false} />
            </Datagrid>
          </ReferenceManyField>
        </RaTab>
      </TabbedShowLayout>
    </Show>
  );
};

const RoomBulkActionButtons = () => {
  const record = useListContext();
  return (
    <>
      <RoomDirectoryBulkPublishButton />
      <RoomDirectoryBulkUnpublishButton />
      <DeleteRoomButton
        selectedIds={record.selectedIds}
        confirmTitle="resources.rooms.action.erase.title"
        confirmContent="resources.rooms.action.erase.content"
      />
    </>
  );
};

const roomFilters = [<SearchInput source="search_term" alwaysOn />];

const RoomListActions = () => (
  <TopToolbar>
    <CreateButton label="resources.rooms.action.create_room" />
    <SelectColumnsButton />
    <ExportButton />
  </TopToolbar>
);

const ParentSpaceInput = () => {
  const dataProvider = useDataProvider();

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["spaces_for_feed"],
    // @ts-ignore
    queryFn: () => dataProvider.getRoomsByCategory("space"),
  });

  if (isLoading) return <Loading />;

  return (
    <AutocompleteInput
      source="parent_id"
      label="resources.rooms.fields.parent_space"
      choices={spaces || []}
      optionText="name"
      optionValue="id"
      fullWidth
      helperText="resources.rooms.fields.parent_space_helper"
    />
  );
};

const ConditionalFormInputs = ({ users }) => {
  const roomType = useWatch({ name: "room_type" });

  switch (roomType) {
    case "department":
    case "group":
      return <>{roomType === "department" && <SubspaceTreeInput source="subspaces" fullWidth users={users} />}</>;
    case "feed":
      return <ParentSpaceInput />;
    default:
      return null;
  }
};

const ConditionalGroupFields = () => {
  const roomType = useWatch({ name: "room_type" });
  const translate = useTranslate();
  const minUsers = 2;
  const minChats = 2;
  const maxUsers = 200;
  const maxChats = 20;

  if (roomType !== "group") {
    return null;
  }

  return (
    <Box display="flex" sx={{ gap: 2, width: "100%" }}>
      <ClampedNumberInput
        source="max_users"
        label={translate("resources.rooms.fields.max_users")}
        helperText={translate("resources.rooms.helper.max_users")}
        min={minUsers}
        max={maxUsers}
        validate={[number(), minValue(minUsers), maxValue(maxUsers)]}
        fullWidth
      />
      <ClampedNumberInput
        source="max_chats"
        label={translate("resources.rooms.fields.max_chats")}
        helperText={translate("resources.rooms.helper.max_chats")}
        min={minChats}
        max={maxChats}
        validate={[number(), minValue(minChats), maxValue(maxChats)]}
        fullWidth
      />
    </Box>
  );
};

export const RoomCreate = (props: any) => {
  const currentAdminId = localStorage.getItem("user_id");
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: users,
    isLoading,
    error,
  } = useGetList("users", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "name", order: "ASC" },
  });

  const handleSave = async (values: any) => {
    setIsSaving(true);
    const adminCreatorId = currentAdminId;

    if (values.room_type === "feed") {
      // Логика для 'feed' остается без изменений
      try {
        const feedCreatorId = values.creator_id || adminCreatorId;
        notify("Creating the feed room...", { type: "info" });
        const powerLevelUsers = { [feedCreatorId]: 100 };
        if (adminCreatorId !== feedCreatorId) {
          powerLevelUsers[adminCreatorId] = 100;
        }
        const payload = {
          preset: "public_chat",
          name: values.name,
          topic: values.topic,
          power_level_content_override: { events_default: 100, users: powerLevelUsers },
          creation_content: { "custom.room_category": "chat", "custom.chat_type": "feed" },
          creator: feedCreatorId,
          meta: { impersonate: adminCreatorId },
        };
        // @ts-ignore
        const { data: createdFeed } = await dataProvider.create("rooms", { data: payload });
        notify(`Feed "${values.name}" created successfully.`, { type: "success" });
        if (feedCreatorId !== adminCreatorId) {
          notify(`Delegating permissions to ${feedCreatorId}...`, { type: "info" });
          // @ts-ignore
          await dataProvider.joinRoom(createdFeed.id, feedCreatorId, adminCreatorId);
          // @ts-ignore
          await dataProvider.makeRoomAdmin(createdFeed.id, feedCreatorId);
          notify(`Permissions for feed "${values.name}" delegated.`, { type: "success" });
        }
        if (values.parent_id) {
          notify(`Linking feed to parent space...`, { type: "info" });
          // @ts-ignore
          await dataProvider.sendStateEvent(
            values.parent_id,
            "m.space.child",
            createdFeed.id,
            { via: [localStorage.getItem("home_server")], suggested: true },
            adminCreatorId
          );
        }
        let userIdsToInvite: string[] = [];
        if (values.parent_id) {
          notify("Gathering users from the space hierarchy...", { type: "info" });
          try {
            // @ts-ignore
            const { data: hierarchyUsers } = await dataProvider.getHierarchyMembers(values.parent_id);
            userIdsToInvite = hierarchyUsers;
            notify(`Found ${userIdsToInvite.length} users to add.`, { type: "info" });
          } catch (e: any) {
            notify(`Could not get hierarchy members: ${e.message}`, { type: "error" });
          }
        } else {
          notify("Gathering all server users...", { type: "info" });
          try {
            const { data: allUsers } = await dataProvider.getList("users", {
              pagination: { page: 1, perPage: 10000 },
              sort: { field: "name", order: "ASC" },
              filter: {},
            });
            userIdsToInvite = allUsers.map((u: any) => u.id);
            notify(`Found ${userIdsToInvite.length} users to add.`, { type: "info" });
          } catch (e: any) {
            notify(`Could not get all users: ${e.message}`, { type: "error" });
          }
        }
        if (userIdsToInvite.length > 0) {
          notify(`Starting to add ${userIdsToInvite.length} users to the feed. This may take a while...`, {
            type: "info",
            autoHideDuration: 5000,
          });
          const joinPromises = userIdsToInvite
            .filter(userId => userId !== feedCreatorId && userId !== adminCreatorId)
            .map(
              (
                userId // @ts-ignore
              ) => dataProvider.joinRoom(createdFeed.id, userId, adminCreatorId)
            );
          const results = await Promise.allSettled(joinPromises);
          const successfulJoins = results.filter(r => r.status === "fulfilled").length;
          notify(`Successfully added ${successfulJoins} out of ${userIdsToInvite.length} users to the feed.`, {
            type: "success",
          });
        }
        redirect("/rooms");
      } catch (e: any) {
        notify(`Error creating feed: ${e.message}`, { type: "error" });
      } finally {
        setIsSaving(false);
      }
    } else {
      // Логика для "department" и "group"
      const mainDelegateUserId = values.creator_id || adminCreatorId;
      const { subspaces, ...mainSpaceData } = values;

      const delegatePermissions = async (roomId: string, roomName: string, delegateToUserId: string) => {
        if (delegateToUserId !== adminCreatorId) {
          try {
            // @ts-ignore
            await dataProvider.joinRoom(roomId, delegateToUserId, adminCreatorId);
            // @ts-ignore
            await dataProvider.makeRoomAdmin(roomId, delegateToUserId, adminCreatorId);
            notify(`Permissions for "${roomName}" delegated to ${delegateToUserId}.`, { type: "info" });
          } catch (e: any) {
            notify(`Failed to delegate permissions for "${roomName}": ${e.message}`, { type: "warning" });
          }
        }
      };

      const setRoomName = async (roomId: string, newName: string) => {
        try {
          // @ts-ignore
          await dataProvider.sendStateEvent(roomId, "m.room.name", "", { name: newName }, adminCreatorId);
          notify(`Room renamed to "${newName}".`, { type: "info" });
        } catch (e: any) {
          notify(`Failed to rename room: ${e.message}`, { type: "warning" });
        }
      };

      /**
       * Рекурсивно создает и настраивает иерархическую структуру пространств и чатов.
       *
       * Эта асинхронная функция является ядром логики создания сложных структур.
       * Для каждого узла (`spaceNode`) она выполняет следующие действия:
       * 1. Создает новое пространство Matrix с иерархическим именем и псевдонимом.
       * 2. Создает связанные с ним "Общий чат" (ОЧ) и "Закрытый чат" (ЗЧ).
       * 3. Делегирует права администратора указанному создателю (`nodeCreatorId`).
       * 4. Если узел является дочерним, связывает его с родительским пространством (`parentId`)
       *    и добавляет создателя в чаты всех вышестоящих пространств.
       * 5. Рекурсивно вызывает себя для всех дочерних узлов (`spaceNode.subspaces`).
       * 6. Собирает и возвращает уникальный набор ID всех пользователей, задействованных
       *    в создании данной ветки иерархии, для последующего приглашения.
       *
       * @async
       * @private
       * @function createAndSetupRecursive
       * @param {any} spaceNode - Объект узла, содержащий `name`, `creator_id` и массив `subspaces`.
       * @param {string | null} parentId - ID родительского пространства Matrix. `null` для узлов верхнего уровня.
       * @param {string[]} ancestors - Массив ID всех предков, для корректного добавления в их чаты.
       * @param {string} inheritedCreatorId - ID создателя, унаследованный от родителя, если не указан явно.
       * @param {string} [parentNamePrefix=""] - Иерархический префикс имени от родителя (e.g., "Главный офис").
       * @param {string} [parentAliasPrefix=""] - Иерархический префикс псевдонима от родителя (e.g., "го").
       * @returns {Promise<{ spaceId: string | null; collectedUserIds: Set<string> }>} Промис, который разрешается объектом,
       * содержащим ID созданного пространства и `Set` ID всех пользователей в поддереве.
       * @throws {Error} Выбрасывает ошибку, если критически важный API-запрос (например, создание пространства) завершается неудачно.
       */
      const createAndSetupRecursive = async (
        spaceNode: any,
        parentId: string | null,
        ancestors: string[],
        inheritedCreatorId: string,
        parentNamePrefix: string = "",
        parentAliasPrefix: string = ""
      ): Promise<{ spaceId: string | null; collectedUserIds: Set<string> }> => {
        const shortNodeName = spaceNode.name;
        if (!shortNodeName) {
          return { spaceId: null, collectedUserIds: new Set() };
        }

        const userIdsInThisSubtree = new Set<string>();
        const nodeCreatorId = spaceNode.creator_id || inheritedCreatorId;
        userIdsInThisSubtree.add(nodeCreatorId);

        const hierarchicalName = parentNamePrefix ? `${parentNamePrefix} / ${shortNodeName}` : shortNodeName;
        const nodeAbbreviation = generateAbbreviation(shortNodeName);
        const hierarchicalAlias = parentAliasPrefix ? `${parentAliasPrefix}.${nodeAbbreviation}` : nodeAbbreviation;
        const preset = "private_chat";

        const payload = {
          name: hierarchicalName,
          room_alias_name: hierarchicalAlias,
          preset,
          creation_content: { type: "m.space", "custom.room_category": "space" },
          creator: nodeCreatorId,
          meta: { impersonate: adminCreatorId },
          room_type: values.room_type,
          topic: spaceNode.topic || undefined,
        };

        // @ts-ignore
        const { data: createdSpace } = await dataProvider.create("rooms", { data: payload });
        notify(`Space "${hierarchicalName}" created.`, { type: "info" });

        await setRoomName(createdSpace.id, shortNodeName);
        await delegatePermissions(createdSpace.id, shortNodeName, nodeCreatorId);

        try {
          // @ts-ignore
          const childRooms = await dataProvider.getRoomChildrenWithDetails(createdSpace.id);
          for (const child of childRooms) {
            const chatTypeAbbr = child.chat_type === "private_chat" ? "ЗЧ" : "ОЧ";
            const finalChatName = generateChatName(hierarchicalName, chatTypeAbbr);
            await setRoomName(child.room_id, finalChatName);
            await delegatePermissions(child.room_id, finalChatName, nodeCreatorId);
          }
        } catch (e: any) {
          notify(`Failed to process child chats for "${shortNodeName}"`, { type: "error" });
        }

        if (parentId) {
          // @ts-ignore
          await dataProvider.sendStateEvent(
            parentId,
            "m.space.child",
            createdSpace.id,
            { via: [localStorage.getItem("home_server")], suggested: true },
            adminCreatorId
          );
          // Добавьте этот блок. Он устанавливает обратную связь от ребёнка к родителю.
          console.log(`[Create] Установка родителя ${parentId} для пространства ${createdSpace.id}`);
          await dataProvider.sendStateEvent(
            createdSpace.id, // ID дочернего пространства
            "m.space.parent", // Тип события
            parentId, // State Key - это ID родителя
            { via: [localStorage.getItem("home_server")] }, // Содержимое события
            adminCreatorId // От чьего имени выполняется действие
          );
          const userToJoin = nodeCreatorId;
          const allAncestors = [...ancestors, parentId];
          for (const ancestorId of allAncestors) {
            try {
              // @ts-ignore
              const ancestorChildren = await dataProvider.getRoomChildrenWithDetails(ancestorId);
              if (ancestorId === parentId) {
                const privateChat = ancestorChildren.find((c: any) => c.chat_type === "private_chat");
                if (privateChat) {
                  notify(`Adding ${userToJoin} to the parent's private chat...`, { type: "info" });
                  // @ts-ignore
                  await dataProvider.joinRoom(privateChat.room_id, userToJoin, adminCreatorId);
                }
              }
              const publicChats = ancestorChildren.filter((c: any) => c.chat_type === "public_chat");
              for (const publicChat of publicChats) {
                notify(`Adding ${userToJoin} to public chat ${publicChat.room_id}...`, { type: "info" });
                // @ts-ignore
                await dataProvider.joinRoom(publicChat.room_id, userToJoin, adminCreatorId);
              }
            } catch (e: any) {
              notify(`Error adding user to ancestor chats ${ancestorId}: ${e.message}`, { type: "error" });
            }
          }
        }

        if (spaceNode.subspaces && spaceNode.subspaces.length > 0) {
          for (const childNode of spaceNode.subspaces) {
            const newAncestors = parentId ? [...ancestors, parentId] : [];
            const childResult = await createAndSetupRecursive(
              childNode,
              createdSpace.id,
              newAncestors,
              nodeCreatorId,
              hierarchicalName,
              hierarchicalAlias
            );
            if (childResult.collectedUserIds) {
              childResult.collectedUserIds.forEach(id => userIdsInThisSubtree.add(id));
            }
          }
        }

        if (createdSpace.id && userIdsInThisSubtree.size > 0) {
          const userIdsToInvite = Array.from(userIdsInThisSubtree).filter(
            id => id !== nodeCreatorId && id !== adminCreatorId
          );

          if (userIdsToInvite.length > 0) {
            notify(`Adding ${userIdsToInvite.length} descendant users to "${shortNodeName}"...`, {
              type: "info",
              autoHideDuration: 2000,
            });
            const joinPromises = userIdsToInvite.map(userId =>
              // @ts-ignore
              dataProvider.joinRoom(createdSpace.id, userId, adminCreatorId)
            );
            await Promise.allSettled(joinPromises);
          }
        }
        return { spaceId: createdSpace.id, collectedUserIds: userIdsInThisSubtree };
      };

      try {
        await createAndSetupRecursive({ ...mainSpaceData, subspaces: subspaces }, null, [], mainDelegateUserId);

        notify("The entire structure was created successfully!", { type: "success" });
        redirect("/rooms");
      } catch (error: any) {
        notify(`Critical error during creation: ${error.message || "Unknown error"}`, { type: "error" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <p>Error loading users: {error.message}</p>;

  return (
    <Create
      {...props}
      title="resources.rooms.action.create_room_title"
      mutationOptions={{
        onSuccess: () => {},
      }}
    >
      <SimpleForm onSubmit={handleSave} saving={isSaving}>
        <SelectInput
          source="room_type"
          label="resources.rooms.fields.room_type.label"
          choices={[
            { id: "department", name: "resources.rooms.fields.room_type.department" },
            { id: "group", name: "resources.rooms.fields.room_type.group" },
            { id: "feed", name: "resources.rooms.fields.room_type.feed" },
          ]}
          defaultValue="department"
          validate={required()}
          fullWidth
        />

        <TextInput source="name" validate={required()} label="resources.rooms.fields.name" fullWidth />
        <TextInput source="topic" label="resources.rooms.fields.topic" fullWidth multiline />

        <AutocompleteInput
          source="creator_id"
          label="resources.rooms.fields.creator"
          choices={users}
          optionValue="id"
          optionText="id"
          filterToQuery={searchText => ({ name: searchText })}
          helperText="resources.rooms.helper.creator"
          defaultValue={currentAdminId}
          fullWidth
        />

        <ConditionalFormInputs users={users || []} />
      </SimpleForm>
    </Create>
  );
};

export const ChatList = (props: ListProps) => {
  const theme = useTheme();
  const translate = useTranslate();

  return (
    <List
      {...props}
      pagination={<RoomPagination />}
      sort={{ field: "name", order: "ASC" }}
      filters={roomFilters}
      actions={<RoomListActions />}
      filter={{ "creation_content.type": null }}
      perPage={50}
      title={translate("synapseadmin.rooms.tabs.chats")}
    >
      <DatagridConfigurable
        rowClick="show"
        bulkActionButtons={<RoomBulkActionButtons />}
        omit={["joined_local_members", "state_events", "version", "federatable"]}
      >
        <ReferenceField
          reference="rooms"
          source="id"
          label="resources.users.fields.avatar"
          link={false}
          sortable={false}
        >
          <AvatarField source="avatar" sx={{ height: "40px", width: "40px" }} />
        </ReferenceField>
        <RaTextField source="id" label="resources.rooms.fields.room_id" sortable={false} />
        <WrapperField source="encryption" sortBy="is_encrypted" label="resources.rooms.fields.encryption">
          <BooleanField
            source="is_encrypted"
            sortBy="encryption"
            TrueIcon={HttpsIcon}
            FalseIcon={NoEncryptionIcon}
            label={<HttpsIcon />}
            sx={{
              [`& [data-testid="true"]`]: { color: theme.palette.success.main },
              [`& [data-testid="false"]`]: { color: theme.palette.error.main },
            }}
          />
        </WrapperField>
        <FunctionField
          source="name"
          sx={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
          render={record => record["name"] || record["canonical_alias"] || record["id"]}
          label="resources.rooms.fields.name"
        />
        <RaTextField source="joined_members" label="resources.rooms.fields.joined_members" />
        <RaTextField source="joined_local_members" label="resources.rooms.fields.joined_local_members" />
        <RaTextField source="state_events" label="resources.rooms.fields.state_events" />
        <RaTextField source="version" label="resources.rooms.fields.version" />
        <BooleanField source="federatable" label="resources.rooms.fields.federatable" />
        <BooleanField source="public" label="resources.rooms.fields.public" />
        <WrapperField label="resources.rooms.fields.actions">
          <MakeAdminBtn />
        </WrapperField>
      </DatagridConfigurable>
    </List>
  );
};

/**
 * Отображает список пространств (Spaces) в виде настраиваемой таблицы.
 *
 * Этот компонент использует `<List>` и `<DatagridConfigurable>` из `react-admin`
 * для получения и отображения отфильтрованного списка комнат. Фильтрация
 * происходит по `creation_content.type: "m.space"`, чтобы в списке
 * были только пространства.
 *
 * Ключевые колонки включают:
 * - Аватар пространства.
 * - ID и название (с fallback на alias).
 * - Статус шифрования (с иконками).
 * - Количество участников.
 *
 * Компонент предоставляет интерактивные элементы:
 * - Переход на страницу детального просмотра по клику на строку.
 * - Кнопка "Изменить" (`<EditButton>`) для перехода к форме редактирования.
 * - Кнопка "Назначить администратора" (`<MakeAdminBtn>`).
 *
 * Является одной из вкладок в компоненте `RoomLists`.
 *
 * @component
 * @param {ListProps} props - Стандартные пропсы для компонента List в `react-admin`.
 * @returns {JSX.Element} Компонент `<List>`, содержащий таблицу пространств.
 */
export const SpaceList = (props: ListProps) => {
  const theme = useTheme();
  const translate = useTranslate();

  return (
    <List
      {...props}
      pagination={<RoomPagination />}
      sort={{ field: "name", order: "ASC" }}
      filters={roomFilters}
      actions={<RoomListActions />}
      filter={{ "creation_content.type": "m.space" }}
      perPage={50}
      title={translate("synapseadmin.rooms.tabs.spaces")}
    >
      <DatagridConfigurable
        rowClick="show"
        bulkActionButtons={<RoomBulkActionButtons />}
        // Убрали 'encryption' из omit
        omit={["joined_local_members", "state_events", "version", "federatable"]}
      >
        <ReferenceField
          reference="rooms"
          source="id"
          label="resources.users.fields.avatar"
          link={false}
          sortable={false}
        >
          <AvatarField source="avatar" sx={{ height: "40px", width: "40px" }} />
        </ReferenceField>
        <RaTextField source="id" label="resources.rooms.fields.room_id" sortable={false} />
        {/* Добавили колонку Шифрование */}
        <WrapperField source="encryption" sortBy="is_encrypted" label="resources.rooms.fields.encryption">
          <BooleanField
            source="is_encrypted"
            sortBy="encryption"
            TrueIcon={HttpsIcon}
            FalseIcon={NoEncryptionIcon}
            label={<HttpsIcon />}
            sx={{
              [`& [data-testid="true"]`]: { color: theme.palette.success.main },
              [`& [data-testid="false"]`]: { color: theme.palette.error.main },
            }}
          />
        </WrapperField>
        <FunctionField
          source="name"
          sx={{
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
          render={record => record["name"] || record["canonical_alias"] || record["id"]}
          label="resources.rooms.fields.name"
        />
        <RaTextField source="joined_members" label="resources.rooms.fields.joined_members" />
        <RaTextField source="joined_local_members" label="resources.rooms.fields.joined_local_members" />
        <RaTextField source="state_events" label="resources.rooms.fields.state_events" />
        <RaTextField source="version" label="resources.rooms.fields.version" />
        <BooleanField source="federatable" label="resources.rooms.fields.federatable" />
        <BooleanField source="public" label="resources.rooms.fields.public" />
        <WrapperField label="resources.rooms.fields.actions">
          <MakeAdminBtn />
        </WrapperField>
        <EditButton label={translate("resources.rooms.action.edit")} />
      </DatagridConfigurable>
    </List>
  );
};

const RoomLists = (props: ListProps) => {
  const [tab, setTab] = useState(0);
  const translate = useTranslate();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Fragment>
      <Tabs value={tab} onChange={handleChange} aria-label="room and space tabs">
        <Tab label={translate("synapseadmin.rooms.tabs.spaces")} />
        <Tab label={translate("synapseadmin.rooms.tabs.chats")} />
      </Tabs>
      {tab === 1 && <ChatList {...props} />}
      {tab === 0 && <SpaceList {...props} />}
    </Fragment>
  );
};

/**
 * Определяет ресурс "Пространства и чаты" (rooms) для `react-admin`.
 *
 * Этот объект связывает различные компоненты (для списка, просмотра, создания и редактирования)
 * с именем ресурса "rooms", которое используется в URL-адресах и API-запросах.
 * Он также задает иконку для отображения в меню навигации.
 *
 * @const
 * @type {ResourceProps}
 * @property {string} name - Уникальное имя ресурса.
 * @property {React.ElementType} icon - Иконка, отображаемая в меню.
 * @property {React.ElementType} list - Компонент для отображения списка ресурсов (в данном случае `RoomLists` с вкладками).
 * @property {React.ElementType} show - Компонент для детального просмотра одного ресурса.
 * @property {React.ElementType} create - Компонент для создания нового ресурса.
 * @property {React.ElementType} edit - Компонент для редактирования существующего ресурса.
 */
const resource: ResourceProps = {
  name: "rooms",
  icon: RoomIcon,
  list: RoomLists,
  show: RoomShow,
  create: RoomCreate,
  edit: RoomEdit,
};

export default resource;
