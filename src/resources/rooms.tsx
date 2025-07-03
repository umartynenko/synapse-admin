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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  ExportButton,
  FormDataConsumer, // <-- ВОЗВРАЩАЕМ ИМПОРТ
  FunctionField,
  List,
  ListProps,
  Loading,
  maxValue,
  minValue,
  number,
  NumberField,
  Pagination,
  TextField as RaTextField,
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
  Tab,
  TabbedShowLayout,
  TextInput,
  TopToolbar,
  useDataProvider,
  useGetList,
  useListContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useTranslate,
  WrapperField,
} from "react-admin";
import { useWatch } from "react-hook-form";

import AvatarField from "../components/AvatarField";
import { ClampedNumberInput } from "../components/ClampedNumberInput";
import DeleteRoomButton from "../components/DeleteRoomButton";
import { SubspaceTreeInput } from "../components/SubspaceTreeInput";
import { MediaIDField } from "../components/media";
import { Room, SynapseDataProvider } from "../synapse/dataProvider";
import { DATE_FORMAT } from "../utils/date";
import {
  RoomDirectoryBulkPublishButton,
  RoomDirectoryBulkUnpublishButton,
  RoomDirectoryPublishButton,
  RoomDirectoryUnpublishButton,
} from "./room_directory";

// =============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ГЕНЕРАЦИИ ИМЕН И АЛИАСОВ
// =============================================================================

/**
 * Генерирует простую аббревиатуру для алиаса пространства.
 * Пример: "Отдел Продаж" -> "оп"
 */
const generateAbbreviation = (name: string): string => {
  if (!name) return "";
  const words = name.split(/[\s-]+/);
  return words.map(word => word.charAt(0).toLowerCase()).join("");
};
/**
 * Генерирует сложное ИМЯ для чата на основе иерархического пути.
 * Финальная версия с обработкой списка союзов.
 */
const generateChatName = (hierarchicalName: string, chatType: string): string => {
  if (!hierarchicalName) return chatType;

  // Список союзов и предлогов, которые должны оставаться в нижнем регистре.
  // Вы можете легко расширить этот список.
  const stopWords = ["и", "а", "в", "на", "с", "к", "по", "о", "из", "у", "за", "над", "под"];
  const isNumeric = /^\d+$/;

  const parts = hierarchicalName.split(" / ");
  const lastPart = parts.pop() || "";

  const processedParts = parts.map(part => {
    const words = part.split(/[\s-]+/);

    return words
      .map(word => {
        if (!word) return ''; // Пропускаем пустые строки на всякий случай

        // Проверяем, является ли слово числом
        if (isNumeric.test(word)) {
          return word; // Если да, возвращаем всё число целиком
        }

        const lowerCaseWord = word.toLowerCase();
        // Проверяем, есть ли слово в нашем списке стоп-слов
        if (stopWords.includes(lowerCaseWord)) {
          // Если да, возвращаем его как есть, в нижнем регистре
          return lowerCaseWord;
        }
        // В противном случае берем первую букву и делаем ее заглавной
        return word.charAt(0).toUpperCase();
      })
      .join(""); // Соединяем
  });

  const baseName = processedParts.length > 0 ? processedParts.join(".") + "." : "";

  return `${baseName}${lastPart} ${chatType}`;
};

// =============================================================================
// КОМПОНЕНТЫ РЕСУРСА
// =============================================================================

const RoomPagination = () => <Pagination rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]} />;

const RoomTitle = () => {
  const record = useRecordContext();
  const translate = useTranslate();
  let name = "";
  if (record) {
    name = record.name !== "" ? record.name : record.id;
  }

  return (
    <span>
      {translate("resources.rooms.name", 1)} {name}
    </span>
  );
};

const RoomShowActions = () => {
  const record = useRecordContext();
  if (!record) {
    return null;
  }
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
  const record = useRecordContext() as Room;

  if (!record) {
    return null;
  }

  if (record.joined_local_members < 1) {
    return null;
  }

  const ownMXID = localStorage.getItem("user_id") || "";
  const [open, setOpen] = useState(false);
  const [userIdValue, setUserIdValue] = useState(ownMXID);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const translate = useTranslate();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      try {
        // @ts-ignore
        const result = await dataProvider.makeRoomAdmin(record.room_id, userIdValue);
        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      notify("resources.rooms.action.make_admin.success", { type: "success" });
      setOpen(false);
      setUserIdValue("");
    },
    onError: err => {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      notify("resources.rooms.action.make_admin.failure", { type: "error", messageArgs: { errMsg: errorMessage } });
      setOpen(false);
      setUserIdValue("");
    },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserIdValue(event.target.value);
  };

  const handleConfirm = async () => {
    mutate();
    setOpen(false);
  };

  const handleDialogClose = () => {
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={e => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={isPending}
      >
        <PersonIcon /> {translate("resources.rooms.action.make_admin.assign_admin")}
      </Button>
      <Confirm
        isOpen={open}
        onConfirm={handleConfirm}
        onClose={handleDialogClose}
        confirm="resources.rooms.action.make_admin.confirm"
        cancel="ra.action.cancel"
        title={translate("resources.rooms.action.make_admin.title", {
          roomName: record.name ? record.name : record.room_id,
        })}
        content={
          <>
            <Typography sx={{ marginBottom: 2, whiteSpace: "pre-line" }}>
              {translate("resources.rooms.action.make_admin.content")}
            </Typography>
            <TextField
              type="text"
              variant="filled"
              value={userIdValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              label={"Matrix ID"}
            />
          </>
        }
      />
    </>
  );
};

export const RoomShow = (props: ShowProps) => {
  const translate = useTranslate();
  return (
    <Show {...props} actions={<RoomShowActions />} title={<RoomTitle />}>
      <TabbedShowLayout>
        <Tab label="synapseadmin.rooms.tabs.basic" icon={<ViewListIcon />}>
          <AvatarField source="avatar" sx={{ height: "120px", width: "120px" }} label="resources.rooms.fields.avatar" />
          <RaTextField source="room_id" />
          <RaTextField source="name" />
          <RaTextField source="topic" />
          <RaTextField source="canonical_alias" />
          <ReferenceField source="creator" reference="users">
            <RaTextField source="id" />
          </ReferenceField>
        </Tab>
        <Tab label="synapseadmin.rooms.tabs.detail" icon={<PageviewIcon />} path="detail">
          <RaTextField source="joined_members" />
          <RaTextField source="joined_local_members" />
          <RaTextField source="joined_local_devices" />
          <RaTextField source="state_events" />
          <RaTextField source="version" />
          <RaTextField source="encryption" emptyText={translate("resources.rooms.enums.unencrypted")} />
        </Tab>
        <Tab label="synapseadmin.rooms.tabs.members" icon={<UserIcon />} path="members">
          <MakeAdminBtn />
          <ReferenceManyField reference="room_members" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} rowClick={id => "/users/" + id} bulkActionButtons={false}>
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
        </Tab>
        <Tab label="synapseadmin.rooms.tabs.media" icon={<PermMediaIcon />} path="media">
          <Alert severity="warning">{translate("resources.room_media.helper.info")}</Alert>
          <ReferenceManyField reference="room_media" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} bulkActionButtons={false}>
              <MediaIDField source="media_id" />
              <DeleteButton mutationMode="pessimistic" redirect={false} />
            </Datagrid>
          </ReferenceManyField>
        </Tab>
        <Tab label="synapseadmin.rooms.tabs.permission" icon={<VisibilityIcon />} path="permission">
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
        </Tab>
        <Tab label={translate("resources.room_state.name", { smart_count: 2 })} icon={<EventIcon />} path="state">
          <ReferenceManyField reference="room_state" target="room_id" label={false}>
            <Datagrid sx={{ width: "100%" }} bulkActionButtons={false}>
              <RaTextField source="type" sortable={false} />
              <DateField source="origin_server_ts" showTime options={DATE_FORMAT} sortable={false} />
              <FunctionField
                source="content"
                sortable={false}
                render={record => `${JSON.stringify(record.content, null, 2)}`}
              />
              <ReferenceField source="sender" reference="users" sortable={false}>
                <RaTextField source="id" />
              </ReferenceField>
            </Datagrid>
          </ReferenceManyField>
        </Tab>
        <Tab label="resources.forward_extremities.name" icon={<FastForwardIcon />} path="forward_extremities">
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
        </Tab>
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

const ConditionalParentSpaceInput = ({ spaces, isLoading }: { spaces: any[], isLoading: boolean }) => {
    const roomType = useWatch({ name: "room_type" });
    const translate = useTranslate();

    if (roomType !== 'feed') return null;

    if (isLoading) return <Loading />;

    return (
        <AutocompleteInput
            source="parent_space_id"
            label={translate("resources.rooms.fields.parent_space")}
            choices={spaces || []}
            optionText="name"
            optionValue="room_id"
            filterToQuery={searchText => ({ name: searchText })}
            helperText={translate("resources.rooms.helper.parent_space")}
            fullWidth
            resettable
        />
    );
};

const ConditionalSubspaceInput = ({ users }: { users: any[] } ) => {
  const roomType = useWatch({ name: "room_type" });
  if (roomType === "department") {
    return <SubspaceTreeInput source="subspaces" fullWidth users={users} />;
  }
  return null;
};

const ConditionalGroupFields =() => {
  const roomType = useWatch({ name: "room_type" });
  const translate = useTranslate();
  const minUsers = 1;
  const minChats = 2;
  const maxUsers = 9999;
  const maxChats = 999;

  if (roomType !== "group") {
    return null;
  }

  return (
    <Box display="flex" sx={{ gap: 2, width: '100%' }}>
      <ClampedNumberInput
        source="max_users"
        label={translate("resources.rooms.fields.max_users")}
        helperText={translate("resources.rooms.helper.max_users")}
        min={minUsers}
        max={maxUsers}
        validate={[required(), number(), minValue(minUsers), maxValue(maxUsers)]}
        fullWidth
      />
      <ClampedNumberInput
        source="max_chats"
        label={translate("resources.rooms.fields.max_chats")}
        helperText={translate("resources.rooms.helper.max_chats")}
        min={minChats}
        max={maxChats}
        validate={[required(), number(), minValue(minChats), maxValue(maxChats)]}
        fullWidth
      />
    </Box>
  );
};

export const RoomCreate = (props: any) => {
  const currentAdminId = localStorage.getItem("user_id");
  const dataProvider = useDataProvider<SynapseDataProvider>();
  const notify = useNotify();
  const redirect = useRedirect();
  const [isSaving, setIsSaving] = useState(false);

  const { data: users, isLoading: isLoadingUsers, error: usersError } = useGetList("users", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "name", order: "ASC" },
  });

  const { data: spaces, isLoading: isLoadingSpaces, error: spacesError } = useGetList("rooms", {
    pagination: { page: 1, perPage: 5000 },
    sort: { field: "name", order: "ASC" },
    filter: { room_type: "m.space" }
  });

  const handleSave = async (values: any) => {
    setIsSaving(true);
    const adminCreatorId = currentAdminId;
    const { room_type, ...data } = values;

    const delegatePermissions = async (roomId: string, roomName: string, delegatedUserId: string) => {
      if (delegatedUserId && delegatedUserId !== adminCreatorId) {
        try {
          await dataProvider.joinRoom(roomId, delegatedUserId, adminCreatorId);
          await dataProvider.makeRoomAdmin(roomId, delegatedUserId, adminCreatorId);
          notify(`Права на "${roomName}" делегированы пользователю ${delegatedUserId}.`, { type: "info" });
        } catch (e: any) {
          notify(`Не удалось делегировать права на "${roomName}": ${e.message}`, { type: "warning" });
        }
      }
    };

    const createDepartmentHierarchy = async (departmentData: any) => {
        const { subspaces, ...mainSpaceData } = departmentData;
        const mainDelegateUserId = mainSpaceData.creator_id || adminCreatorId;

        const createAndSetupRecursive = async (spaceNode: any, parentId: string | null, hierarchicalName: string) => {
            if (!spaceNode.name) return;
            const fullHierarchicalName = hierarchicalName ? `${hierarchicalName} / ${spaceNode.name}` : spaceNode.name;
            const delegatedUserId = spaceNode.creator_id || mainDelegateUserId;
            const payload = {
                preset: mainSpaceData.preset,
                creation_content: { type: "m.space", "custom.room_type": "department" },
                meta: { impersonate: adminCreatorId },
                name: fullHierarchicalName,
                topic: spaceNode.topic || mainSpaceData.topic,
            };
            const { data: createdSpace } = await dataProvider.create("rooms", { data: payload });
            notify(`Пространство "${fullHierarchicalName}" создано.`, { type: "info" });
            await dataProvider.update("rooms", {
                id: createdSpace.id, data: { ...createdSpace, name: spaceNode.name },
                previousData: createdSpace, meta: { impersonate: adminCreatorId, eventType: 'm.room.name', stateKey: '' }
            });
            await delegatePermissions(createdSpace.id, spaceNode.name, delegatedUserId);
            if(createdSpace.public_chat_id) await delegatePermissions(createdSpace.public_chat_id, `${spaceNode.name} Общий`, delegatedUserId);
            if(createdSpace.private_chat_id) await delegatePermissions(createdSpace.private_chat_id, `${spaceNode.name} Приватный`, delegatedUserId);

            if (parentId) {
                await dataProvider.sendStateEvent(parentId, "m.space.child", createdSpace.id, { via: [localStorage.getItem("home_server")], suggested: true }, adminCreatorId);
            }
            if (spaceNode.subspaces && spaceNode.subspaces.length > 0) {
                for (const childNode of spaceNode.subspaces) {
                    await createAndSetupRecursive(childNode, createdSpace.id, fullHierarchicalName);
                }
            }
        };
        await createAndSetupRecursive({ ...mainSpaceData, subspaces }, null, "");
    };

    const createGroupSpace = async (groupData: any) => {
        const delegatedUserId = groupData.creator_id || adminCreatorId;
        const creationContent = {
            type: "m.space", "custom.room_type": "group",
            "custom.max_users": parseInt(groupData.max_users, 10), "custom.max_chats": parseInt(groupData.max_chats, 10),
        };
        const payload = {
            name: groupData.name, topic: groupData.topic, preset: groupData.preset,
            creation_content: creationContent, meta: { impersonate: adminCreatorId },
        };
        const { data: createdSpace } = await dataProvider.create("rooms", { data: payload });
        notify(`Группа "${groupData.name}" создана.`, { type: "success" });
        await delegatePermissions(createdSpace.id, createdSpace.name, delegatedUserId);
        if(createdSpace.public_chat_id) await delegatePermissions(createdSpace.public_chat_id, `${createdSpace.name} Общий`, delegatedUserId);
        if(createdSpace.private_chat_id) await delegatePermissions(createdSpace.private_chat_id, `${createdSpace.name} Приватный`, delegatedUserId);
    };

    const createFeedChat = async (feedData: any) => {
        const delegatedUserId = feedData.creator_id || adminCreatorId;
        const payload = {
            name: feedData.name, topic: feedData.topic, preset: "public_chat",
            is_space: false, meta: { impersonate: adminCreatorId },
        };
        const { data: createdChat } = await dataProvider.create("rooms", { data: payload });
        notify(`Чат "${feedData.name}" успешно создан.`, { type: "success" });
        await delegatePermissions(createdChat.id, feedData.name, delegatedUserId);
        if (feedData.parent_space_id) {
            await dataProvider.sendStateEvent(
                feedData.parent_space_id, "m.space.child", createdChat.id,
                { via: [localStorage.getItem("home_server")], suggested: true }, adminCreatorId
            );
            notify(`Чат "${feedData.name}" добавлен в родительское пространство.`, { type: "info" });
        }
    };

    try {
      if (room_type === 'department') {
        await createDepartmentHierarchy(data);
      } else if (room_type === 'group') {
        await createGroupSpace(data);
      } else if (room_type === 'feed') {
        await createFeedChat(data);
      }
      notify("Операция успешно завершена!", { type: "success" });
      redirect("/rooms");
    } catch (error: any) {
      notify(`Критическая ошибка: ${error.message || "Неизвестная ошибка"}`, { type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingUsers || isLoadingSpaces) return <Loading />;
  if (usersError || spacesError) return <p>Ошибка загрузки данных: {usersError?.message || spacesError?.message}</p>;

  return (
    <Create
      {...props}
      title="resources.rooms.action.create_room_title"
      mutationOptions={{ onSuccess: () => {} }}
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
        <ConditionalParentSpaceInput spaces={spaces} isLoading={isLoadingSpaces} />
        <AutocompleteInput
          source="creator_id"
          label="resources.rooms.fields.creator"
          choices={users || []}
          optionValue="id"
          optionText="id"
          filterToQuery={searchText => ({ name: searchText })}
          helperText="resources.rooms.helper.creator"
          defaultValue={currentAdminId}
          fullWidth
        />
        <TextInput source="name" validate={required()} label="resources.rooms.fields.name" fullWidth />
        <TextInput source="topic" label="resources.rooms.fields.topic" fullWidth />
        <FormDataConsumer>
            {({ formData, ...rest }) => formData.room_type !== 'feed' && (
                <SelectInput
                  source="preset"
                  label="resources.rooms.fields.preset"
                  choices={[
                    { id: "private_chat", name: "resources.rooms.enums.presets.private_chat" },
                    { id: "public_chat", name: "resources.rooms.enums.presets.public_chat" },
                  ]}
                  defaultValue="private_chat"
                  validate={required()}
                  {...rest}
                />
            )}
        </FormDataConsumer>
        <ConditionalSubspaceInput users={users || []} />
        <ConditionalGroupFields />
      </SimpleForm>
    </Create>
  );
};

export const RoomList = (props: ListProps) => {
  const theme = useTheme();

  return (
    <List
      {...props}
      pagination={<RoomPagination />}
      sort={{ field: "name", order: "ASC" }}
      filters={roomFilters}
      actions={<RoomListActions />}
      perPage={50}
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

const resource: ResourceProps = {
  name: "rooms",
  icon: RoomIcon,
  list: RoomList,
  show: RoomShow,
  create: RoomCreate,
};

export default resource;
