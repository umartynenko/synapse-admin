// src/resources/rooms.tsx

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
import { useMutation, useQuery } from "@tanstack/react-query";
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
  WrapperField
} from "react-admin";
import { useWatch } from "react-hook-form";
import { ClampedNumberInput } from "../components/ClampedNumberInput";

import AvatarField from "../components/AvatarField";
import DeleteRoomButton from "../components/DeleteRoomButton";
import { SubspaceTreeInput } from "../components/SubspaceTreeInput";
import { MediaIDField } from "../components/media";
import { Room } from "../synapse/dataProvider";
import { DATE_FORMAT } from "../utils/date";
import {
  RoomDirectoryBulkPublishButton,
  RoomDirectoryBulkUnpublishButton,
  RoomDirectoryPublishButton,
  RoomDirectoryUnpublishButton,
} from "./room_directory";

const generateAbbreviation = (name: string): string => {
  if (!name) return "";
  const words = name.split(/[\s-]+/);
  return words.map(word => word.charAt(0).toLowerCase()).join("");
};

const generateChatName = (hierarchicalName: string, chatType: string): string => {
  if (!hierarchicalName) return chatType;
  const stopWords = ["и", "а", "в", "на", "с", "к", "по", "о", "из", "у", "за", "над", "под"];
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
        if (stopWords.includes(lowerCaseWord)) {
          return lowerCaseWord;
        }
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
  return <span>{translate("resources.rooms.name", 1)} {record ? record.name || record.id : ""}</span>;
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
            <TextField type="text" variant="filled" value={userIdValue} onChange={e => setUserIdValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleConfirm()} label="Matrix ID" />
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
          <ReferenceField source="creator" reference="users" link="show">
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
              <ReferenceField source="sender" reference="users" sortable={false} link="show">
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


// КОМПОНЕНТ для выбора родительского пространства
const ParentSpaceInput = () => {
  const dataProvider = useDataProvider();

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['spaces_for_feed'],
    // @ts-ignore - TypeScript не знает о нашем кастомном методе, это нормально
    queryFn: () => dataProvider.getRoomsByCategory('space'),
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

// КОМПОНЕНТ для условного рендеринга полей формы
const ConditionalFormInputs = ({ users }) => {
    const roomType = useWatch({ name: "room_type" });

    switch (roomType) {
        case "department":
        case "group":
            return (
                <>
                    {roomType === 'department' && <SubspaceTreeInput source="subspaces" fullWidth users={users} />}
                </>
            );
        case "feed":
            return <ParentSpaceInput />;
        default:
            return null;
    }
};

// Условный рендеринг для полей "Группы"
const ConditionalGroupFields =() => {
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
    // Используем Box с display="flex" для горизонтального расположения
    <Box display="flex" sx={{ gap: 2, width: '100%' }}>
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

    if (values.room_type === 'feed') {
        // Создание Ленты
        try {
            const feedCreatorId = values.creator_id || adminCreatorId;

            const powerLevelUsers = {
                [feedCreatorId]: 100,
            };
            if (adminCreatorId !== feedCreatorId) {
                powerLevelUsers[adminCreatorId] = 100;
            }

            const payload = {
                preset: "public_chat",
                name: values.name,
                topic: values.topic,
                power_level_content_override: { events_default: 100, users: powerLevelUsers },
                creation_content: {
                    "custom.room_category": "chat",
                    "custom.chat_type": "feed"
                },
                creator: feedCreatorId,
                meta: { impersonate: adminCreatorId },
            };

            // @ts-ignore
            const { data: createdFeed } = await dataProvider.create("rooms", { data: payload });
            notify(`Лента "${values.name}" успешно создана.`, { type: "success" });

            // Делегируем права, если создатель - не текущий админ
            if (feedCreatorId !== adminCreatorId) {
                // Сначала принудительно добавляем пользователя в комнату
                notify(`Присоединяем ${feedCreatorId} к ленте...`, { type: "info" });
                // @ts-ignore
                await dataProvider.joinRoom(createdFeed.id, feedCreatorId, adminCreatorId);

                // А только потом делаем его админом
                notify(`Делегируем права на ленту пользователю ${feedCreatorId}...`, { type: "info" });
                // @ts-ignore
                await dataProvider.makeRoomAdmin(createdFeed.id, feedCreatorId, adminCreatorId);
                notify(`Права на ленту "${values.name}" делегированы.`, { type: "success" });
            }

            if (values.parent_id) {
                // @ts-ignore
                await dataProvider.sendStateEvent(
                    values.parent_id, "m.space.child", createdFeed.id,
                    { via: [localStorage.getItem("home_server")], suggested: true }, adminCreatorId
                );
                notify(`Лента привязана к пространству ${values.parent_id}.`, { type: "info" });
            }
            redirect("/rooms");

        } catch (e: any) {
             notify(`Ошибка при создании ленты: ${e.message}`, { type: "error" });
        } finally {
             setIsSaving(false);
        }
    } else {
        // Создание иерархии
        const mainDelegateUserId = values.creator_id || adminCreatorId;
        const { subspaces, ...mainSpaceData } = values;

        const delegatePermissions = async (roomId: string, roomName: string, delegateToUserId: string) => {
            if (delegateToUserId !== adminCreatorId) {
              try {
                // @ts-ignore
                await dataProvider.joinRoom(roomId, delegateToUserId, adminCreatorId);
                // @ts-ignore
                await dataProvider.makeRoomAdmin(roomId, delegateToUserId, adminCreatorId);
                notify(`Права на "${roomName}" делегированы ${delegateToUserId}.`, { type: "info" });
              } catch (e: any) {
                notify(`Не удалось делегировать права на "${roomName}": ${e.message}`, { type: "warning" });
              }
            }
        };

        const setRoomName = async (roomId: string, newName: string) => {
            try {
              // @ts-ignore
              await dataProvider.sendStateEvent(roomId, "m.room.name", "", { name: newName }, adminCreatorId);
              notify(`Комната переименована в "${newName}".`, { type: "info" });
            } catch (e: any) {
              notify(`Не удалось переименовать комнату: ${e.message}`, { type: "warning" });
            }
        };

        const createAndSetupRecursive = async (
            spaceNode: any, parentId: string | null, ancestors: string[],
            inheritedCreatorId: string, parentNamePrefix: string = "", parentAliasPrefix: string = ""
        ) => {
            const shortNodeName = spaceNode.name;
            if (!shortNodeName) return null;

            const nodeCreatorId = spaceNode.creator_id || inheritedCreatorId;
            const hierarchicalName = parentNamePrefix ? `${parentNamePrefix} / ${shortNodeName}` : shortNodeName;
            const nodeAbbreviation = generateAbbreviation(shortNodeName);
            const hierarchicalAlias = parentAliasPrefix ? `${parentAliasPrefix}.${nodeAbbreviation}` : nodeAbbreviation;
            const preset = "private_chat";

            const payload = {
              name: hierarchicalName, room_alias_name: hierarchicalAlias, preset,
              creation_content: { type: "m.space", "custom.room_category": "space" },
              creator: nodeCreatorId, meta: { impersonate: adminCreatorId }, room_type: values.room_type,
            };

            // @ts-ignore
            const { data: createdSpace } = await dataProvider.create("rooms", { data: payload });
            notify(`Пространство "${hierarchicalName}" создано.`, { type: "info" });

            await setRoomName(createdSpace.id, shortNodeName);
            await delegatePermissions(createdSpace.id, shortNodeName, nodeCreatorId);

            try {
              // @ts-ignore
              const childRooms = await dataProvider.getRoomChildrenWithDetails(createdSpace.id);
              for (const child of childRooms) {
                const chatTypeAbbr = child.chat_type === "private_chat" ? "АН" : "ОБ";
                const finalChatName = generateChatName(hierarchicalName, chatTypeAbbr);
                await setRoomName(child.room_id, finalChatName);
                await delegatePermissions(child.room_id, finalChatName, nodeCreatorId);
              }
            } catch (e: any) {
              notify(`Не удалось обработать дочерние чаты для "${shortNodeName}"`, { type: "error" });
            }

            if (parentId) {
              // @ts-ignore
              await dataProvider.sendStateEvent(parentId, "m.space.child", createdSpace.id,
                { via: [localStorage.getItem("home_server")], suggested: true }, adminCreatorId
              );

              const userToJoin = nodeCreatorId;
              const allAncestors = [...ancestors, parentId];

              for (const ancestorId of allAncestors) {
                try {
                  // @ts-ignore
                  const ancestorChildren = await dataProvider.getRoomChildrenWithDetails(ancestorId);

                  if (ancestorId === parentId) {
                    const privateChat = ancestorChildren.find((c: any) => c.chat_type === 'private_chat');
                    if (privateChat) {
                      notify(`Добавляем ${userToJoin} в приватный чат родителя...`, { type: "info" });
                      // @ts-ignore
                      await dataProvider.joinRoom(privateChat.room_id, userToJoin, adminCreatorId);
                    }
                  }

                  const publicChats = ancestorChildren.filter((c: any) => c.chat_type === 'public_chat');
                  for (const publicChat of publicChats) {
                    notify(`Добавляем ${userToJoin} в публичный чат ${publicChat.room_id}...`, { type: "info" });
                    // @ts-ignore
                    await dataProvider.joinRoom(publicChat.room_id, userToJoin, adminCreatorId);
                  }
                } catch (e: any) {
                  notify(`Ошибка при добавлении пользователя в чаты предка ${ancestorId}: ${e.message}`, { type: "error" });
                }
              }
            }

            if (spaceNode.subspaces && spaceNode.subspaces.length > 0) {
              for (const childNode of spaceNode.subspaces) {
                const newAncestors = parentId ? [...ancestors, parentId] : [];
                await createAndSetupRecursive(
                  childNode, createdSpace.id, newAncestors,
                  nodeCreatorId, hierarchicalName, hierarchicalAlias
                );
              }
            }
            return createdSpace.id;
        };


        try {
          await createAndSetupRecursive(
            { ...mainSpaceData, subspaces: subspaces }, null, [], mainDelegateUserId, "", ""
          );
          notify("Вся структура успешно создана!", { type: "success" });
          redirect("/rooms");
        } catch (error: any) {
          notify(`Критическая ошибка при создании: ${error.message || "Неизвестная ошибка"}`, { type: "error" });
        } finally {
          setIsSaving(false);
        }
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <p>Ошибка загрузки пользователей: {error.message}</p>;

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

        <TextInput source="name" validate={required()} label="resources.rooms.fields.name" fullWidth />
        <TextInput source="topic" label="resources.rooms.fields.topic" fullWidth />

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
