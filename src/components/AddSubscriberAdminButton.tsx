// src/components/AddSubscriberAdminButton.tsx

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button as MuiButton,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import { useState, useMemo } from "react";
import {
  Button,
  Identifier,
  RaRecord,
  RecordContextProvider,
  useDataProvider,
  useGetList,
  useNotify,
  useRecordContext,
  useTranslate,
  useRefresh,
} from "react-admin";
// Убедитесь, что ваш dataProvider.tsx экспортирует этот тип
import { SynapseDataProvider } from "../dataProvider";
import { isMXID } from "../utils/mxid";
import { splitMxid } from "../synapse/matrix";
import AvatarField from "./AvatarField";

const SUBSCRIBER_ADMIN_LEVEL = 50;

const AddSubscriberAdminButton = () => {
  const record = useRecordContext<RaRecord>();
  const translate = useTranslate();
  const notify = useNotify();
  // Указываем тип для dataProvider
  const dataProvider = useDataProvider<SynapseDataProvider>();
  const refresh = useRefresh();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Identifier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  let effectiveSearchTerm = searchTerm;
  if (isMXID(searchTerm)) {
    const parts = splitMxid(searchTerm);
    if (parts && parts.name) {
      effectiveSearchTerm = parts.name;
    }
  }
  const filter = { deactivated: false, name: effectiveSearchTerm };

  const {
    data: users,
    isLoading,
    error,
  } = useGetList(
    "users",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "displayname", order: "ASC" },
      filter: filter,
    },
    { enabled: open && searchTerm.length >= 2 }
  );

  const debouncedSetSearch = useMemo(() => debounce((value: string) => setSearchTerm(value), 500), []);

  if (!record || record.room_type !== "m.space") {
    return null;
  }

  const handleClick = () => setOpen(true);

  const handleClose = () => {
    if (isSaving) return;
    setOpen(false);
    setSelectedUserIds([]);
    setSearchTerm("");
  };

  const handleToggleUser = (userId: Identifier) => {
    const currentIndex = selectedUserIds.indexOf(userId);
    const newSelectedUserIds = [...selectedUserIds];
    if (currentIndex === -1) newSelectedUserIds.push(userId);
    else newSelectedUserIds.splice(currentIndex, 1);
    setSelectedUserIds(newSelectedUserIds);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    const spaceId = record.id.toString();

    try {
      // Шаг 1: Обновление power levels для управления внутри пространства
      let powerLevels = await dataProvider.getRoomStateEvent(spaceId, "m.room.power_levels", "");
      if (!powerLevels) powerLevels = { users: {}, events: {} };

      // Глубокое копирование, чтобы избежать мутации исходного объекта
      const newPowerLevels = JSON.parse(JSON.stringify(powerLevels));
      if (!newPowerLevels.users) newPowerLevels.users = {};
      if (!newPowerLevels.events) newPowerLevels.events = {};

      // Устанавливаем уровни по умолчанию для ключевых действий, если они не заданы
      newPowerLevels.events["m.space.child"] = newPowerLevels.events["m.space.child"] ?? SUBSCRIBER_ADMIN_LEVEL;
      newPowerLevels.invite = newPowerLevels.invite ?? SUBSCRIBER_ADMIN_LEVEL;
      newPowerLevels.kick = newPowerLevels.kick ?? SUBSCRIBER_ADMIN_LEVEL;
      newPowerLevels.redact = newPowerLevels.redact ?? SUBSCRIBER_ADMIN_LEVEL;
      newPowerLevels.state_default = newPowerLevels.state_default ?? SUBSCRIBER_ADMIN_LEVEL;

      // Назначаем выбранным пользователям новый уровень прав
      selectedUserIds.forEach(userId => {
        newPowerLevels.users[userId.toString()] = SUBSCRIBER_ADMIN_LEVEL;
      });

      // Отправляем обновленное событие power_levels
      await dataProvider.sendStateEvent(spaceId, "m.room.power_levels", "", newPowerLevels);
      console.log("Power levels updated for space:", spaceId);

      // <<< НАЧАЛО: НОВЫЙ БЛОК ДЛЯ ВЫЗОВА КАСТОМНОГО API >>>
      // Шаг 2: Добавляем пользователей в наш кастомный список администраторов
      // Это даст им право на СОЗДАНИЕ комнат
      const addAdminPromises = selectedUserIds.map(userId =>
        dataProvider.addSubscriberAdmin({
          spaceId: spaceId,
          userId: userId.toString(),
        })
      );
      await Promise.all(addAdminPromises);
      console.log("Users added to subscriber admin list for space:", spaceId);
      // <<< КОНЕЦ: НОВЫЙ БЛОК >>>

      // Шаг 3: Приглашаем пользователей в само пространство (это делает и наш API, но для надежности оставим)
      const spaceInvitePromises = selectedUserIds.map(userId =>
        dataProvider.inviteUser(spaceId, userId.toString())
      );
      await Promise.all(spaceInvitePromises);
      console.log("Users invited to the main space:", spaceId);

      // Шаг 4: Приглашаем пользователей в дочерние чаты
      const childRooms = await dataProvider.getRoomChildrenWithDetails(spaceId);
      const publicChat = childRooms.find(r => r.chat_type === "public_chat");
      const privateChat = childRooms.find(r => r.chat_type === "private_chat");

      const chatInvitePromises: Promise<any>[] = [];
      if (publicChat) {
        selectedUserIds.forEach(userId => {
          chatInvitePromises.push(dataProvider.inviteUser(publicChat.room_id, userId.toString()));
        });
      }
      if (privateChat) {
        selectedUserIds.forEach(userId => {
          chatInvitePromises.push(dataProvider.inviteUser(privateChat.room_id, userId.toString()));
        });
      }

      if (chatInvitePromises.length > 0) {
        await Promise.all(chatInvitePromises);
        console.log("Users invited to child chats.");
      }

      notify("resources.rooms.action.add_subscriber_admin_dialog.success", {
        type: "success",
        messageArgs: { smart_count: selectedUserIds.length },
      });

      refresh();
    } catch (e: any) {
      console.error("Failed to add subscriber admin:", e);
      notify(e.message || "ra.notification.error", { type: "error" });
    } finally {
      setIsSaving(false);
      handleClose();
    }
  };

  return (
    <>
      <Button
        label={translate("resources.rooms.action.add_subscriber_admin")}
        onClick={handleClick}
        startIcon={<AdminPanelSettingsIcon />}
      />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{translate("resources.rooms.action.add_subscriber_admin_dialog.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={translate("resources.rooms.action.add_subscriber_admin_dialog.search_placeholder")}
            type="search"
            fullWidth
            variant="outlined"
            onChange={e => debouncedSetSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ minHeight: "200px", mt: 2 }}>
            {isLoading && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error">
                {translate("resources.users.errors.load_failed", { message: error.message })}
              </Alert>
            )}
            {!isLoading && !error && searchTerm.length < 2 && (
              <Typography color="text.secondary" align="center">
                {translate("resources.rooms.action.add_subscriber_admin_dialog.start_typing")}
              </Typography>
            )}
            {!isLoading && !error && users && users.length === 0 && searchTerm.length >= 2 && (
              <Typography color="text.secondary" align="center">
                {translate("ra.navigation.no_results")}
              </Typography>
            )}
            {users && users.length > 0 && (
              <List dense sx={{ width: "100%", maxHeight: "40vh", overflowY: "auto" }}>
                {users.map(user => (
                  <RecordContextProvider key={user.id} value={user}>
                    <ListItem
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          onChange={() => handleToggleUser(user.id)}
                          checked={selectedUserIds.indexOf(user.id) !== -1}
                        />
                      }
                      disablePadding
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", width: "100%", cursor: "pointer" }}
                        onClick={() => handleToggleUser(user.id)}
                      >
                        <ListItemIcon>
                          <AvatarField source="avatar_src" sx={{ width: 40, height: 40 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={user.displayname || user.id}
                          secondary={user.displayname ? user.id : null}
                        />
                      </Box>
                    </ListItem>
                  </RecordContextProvider>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleClose} disabled={isSaving}>
            {translate("ra.action.cancel")}
          </MuiButton>
          <MuiButton onClick={handleConfirm} variant="contained" disabled={selectedUserIds.length === 0 || isSaving}>
            {isSaving ? <CircularProgress size={24} color="inherit" /> : translate("ra.action.add")}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddSubscriberAdminButton;
