import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import FastForwardIcon from "@mui/icons-material/FastForward";
import UserIcon from "@mui/icons-material/Group";
import HttpsIcon from "@mui/icons-material/Https";
import NoEncryptionIcon from "@mui/icons-material/NoEncryption";
import PageviewIcon from "@mui/icons-material/Pageview";
import PermMediaIcon from "@mui/icons-material/PermMedia";
import PersonIcon from "@mui/icons-material/Person";
import ViewListIcon from "@mui/icons-material/ViewList";
import RoomIcon from "@mui/icons-material/ViewList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { SubspaceTreeInput } from "../components/SubspaceTreeInput";
import {
  BooleanField,
  DateField,
  WrapperField,
  Datagrid,
  DatagridConfigurable,
  ExportButton,
  FunctionField,
  List,
  ListProps,
  NumberField,
  Pagination,
  ReferenceField,
  ReferenceManyField,
  ResourceProps,
  SearchInput,
  SelectColumnsButton,
  SelectField,
  Show,
  ShowProps,
  Tab,
  TabbedShowLayout,
  TextField as RaTextField,
  TopToolbar,
  useRecordContext,
  useTranslate,
  useListContext,
  useNotify,
  DeleteButton,
  CreateButton,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  required,
  ReferenceInput,
  AutocompleteInput,
  useGetList,
  Loading,
  ArrayInput,
  SimpleFormIterator,
} from "react-admin";
import { useDataProvider, useRedirect } from "react-admin";
import { Confirm } from "react-admin";

import {
  RoomDirectoryBulkUnpublishButton,
  RoomDirectoryBulkPublishButton,
  RoomDirectoryUnpublishButton,
  RoomDirectoryPublishButton,
} from "./room_directory";
import AvatarField from "../components/AvatarField";
import DeleteRoomButton from "../components/DeleteRoomButton";
import { MediaIDField } from "../components/media";
import { Room } from "../synapse/dataProvider";
import { DATE_FORMAT } from "../utils/date";

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
  // FIXME: refresh after (un)publish
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
  const record = useRecordContext();
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
              {
                id: "private",
                name: "resources.rooms.enums.join_rules.private",
              },
            ]}
          />
          <SelectField
            source="guest_access"
            choices={[
              {
                id: "can_join",
                name: "resources.rooms.enums.guest_access.can_join",
              },
              {
                id: "forbidden",
                name: "resources.rooms.enums.guest_access.forbidden",
              },
            ]}
          />
          <SelectField
            source="history_visibility"
            choices={[
              {
                id: "invited",
                name: "resources.rooms.enums.history_visibility.invited",
              },
              {
                id: "joined",
                name: "resources.rooms.enums.history_visibility.joined",
              },
              {
                id: "shared",
                name: "resources.rooms.enums.history_visibility.shared",
              },
              {
                id: "world_readable",
                name: "resources.rooms.enums.history_visibility.world_readable",
              },
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
          <Box
            sx={{
              fontFamily: "Roboto, Helvetica, Arial, sans-serif",
              margin: "0.5em",
            }}
          >
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
    {/*<Button label="resources.rooms.action.create_room">*/}
    {/*<AddIcon />*/}
    <CreateButton label="resources.rooms.action.create_room" />
    {/*</Button>*/}
    <SelectColumnsButton />
    <ExportButton />
  </TopToolbar>
);

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

  /**
   * Обработчик сохранения формы. Выполняет сложный, многошаговый процесс
   * создания иерархии пространств и делегирования прав.
   *
   * Author: Uriy Martynenko (and AI assistant)
   * Date: [Можете вставить текущую дату]
   *
   * @param values - Данные из формы создания.
   */
  const handleSave = async (values: any) => {
    setIsSaving(true);
    const adminCreatorId = currentAdminId;
    const delegatedUserId = values.creator_id || adminCreatorId;
    const { subspaces, ...mainSpaceData } = values;

    /**
     * Вспомогательная функция для делегирования прав на комнату.
     * Выполняет последовательность: ПРИСОЕДИНИТЬ -> СДЕЛАТЬ АДМИНОМ.
     * Использует административные API, поэтому предварительное приглашение не требуется.
     * @param roomId - ID комнаты/пространства, на которое делегируются права.
     * @param roomName - Имя комнаты для отображения в уведомлениях.
     */
    const delegatePermissions = async (roomId: string, roomName: string) => {
      if (delegatedUserId !== adminCreatorId) {
        try {
          // @ts-ignore
          // Передаем ID комнаты, ID кого присоединить, и ID кто выполняет (админ)
          await dataProvider.joinRoom(roomId, delegatedUserId, adminCreatorId);

          // @ts-ignore
          await dataProvider.makeRoomAdmin(roomId, delegatedUserId, adminCreatorId);
          notify(`Права на "${roomName}" делегированы пользователю ${delegatedUserId}.`, { type: "info" });
        } catch (e: any) {
          notify(`Не удалось делегировать права на "${roomName}": ${e.message}`, { type: "warning" });
        }
      }
    };

    /**
     * Рекурсивная функция для создания дерева пространств.
     * @param spaceNode - Узел дерева с данными о пространстве (имя, дочерние узлы).
     * @param parentId - ID родительского пространства (null для верхнего уровня).
     * @param preset - Пресет ("private_chat" или "public_chat").
     */
    const createAndSetupRecursive = async (spaceNode: any, parentId: string | null, preset: string) => {
      if (!spaceNode.name) return null;

      // Админ создает пространство
      const payload = {
        name: spaceNode.name,
        preset: preset,
        creation_content: { type: "m.space" },
        meta: { impersonate: adminCreatorId },
      };
      const { data: createdSpace } = await dataProvider.create("rooms", { data: payload });
      notify(`Пространство "${spaceNode.name}" создано.`, { type: "info" });

      // Делегируем права на само пространство
      await delegatePermissions(createdSpace.id, createdSpace.name);

      // --- КЛЮЧЕВОЙ БЛОК: Получаем дочерние чаты и делегируем права на них ---
      try {
        // @ts-ignore
        const childRoomIds = await dataProvider.getRoomChildren(createdSpace.id);
        for (const childId of childRoomIds) {
          await delegatePermissions(childId, `чат для "${spaceNode.name}"`);
        }
      } catch (e) {
        notify(`Не удалось получить или обработать дочерние чаты для "${spaceNode.name}"`, { type: "error" });
      }
      // --- КОНЕЦ КЛЮЧЕВОГО БЛОКА ---

      // Привязываем к родителю
      if (parentId) {
        // @ts-ignore
        await dataProvider.sendStateEvent(
          parentId,
          "m.space.child",
          createdSpace.id,
          {
            via: [localStorage.getItem("home_server")],
            suggested: true,
          },
          adminCreatorId
        );
      }

      // Рекурсия для дочерних пространств
      if (spaceNode.subspaces && spaceNode.subspaces.length > 0) {
        for (const childNode of spaceNode.subspaces) {
          await createAndSetupRecursive(childNode, createdSpace.id, preset);
        }
      }
      return createdSpace.id;
    };

    try {
      // Запускаем процесс с главного пространства.
      await createAndSetupRecursive({ ...mainSpaceData, subspaces: subspaces }, null, mainSpaceData.preset);

      notify("Вся структура успешно создана!", { type: "success" });
      redirect("/rooms");
    } catch (error: any) {
      notify(`Критическая ошибка при создании: ${error.message || "Неизвестная ошибка"}`, { type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <p>Ошибка загрузки пользователей: {error.message}</p>;

  return (
    <Create
      {...props}
      title="resources.rooms.action.create_room_title"
      mutationOptions={{
        onSuccess: () => {},
      }}
    >
      <SimpleForm onSubmit={handleSave} saving={isSaving}>
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
        <TextInput source="name" validate={required()} label="resources.rooms.fields.name" fullWidth />
        <TextInput source="room_alias_name" label="resources.rooms.fields.alias_localpart" fullWidth />
        <TextInput source="topic" label="resources.rooms.fields.topic" fullWidth />
        <SelectInput
          source="preset"
          label="resources.rooms.fields.preset"
          choices={[
            { id: "private_chat", name: "resources.rooms.enums.presets.private_chat" },
            { id: "public_chat", name: "resources.rooms.enums.presets.public_chat" },
          ]}
          defaultValue="private_chat"
          validate={required()}
        />

        {/* Используем наш новый кастомный компонент */}
        {/*<SubspaceTreeInput source="subspaces" />*/}
        <SubspaceTreeInput source="subspaces" fullWidth />
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
