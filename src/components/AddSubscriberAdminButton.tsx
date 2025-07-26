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
  useGetList,
  useNotify,
  useRecordContext,
  useTranslate,
} from "react-admin";
import { isMXID } from "../utils/mxid"; // <-- 1. ДОБАВЛЕН ИМПОРТ
import { splitMxid } from "../synapse/matrix"; // <-- 2. ДОБАВЛЕН ИМПОРТ
import AvatarField from "./AvatarField";

const AddSubscriberAdminButton = () => {
  const record = useRecordContext<RaRecord>();
  const translate = useTranslate();
  const notify = useNotify();

  const [open, setOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Identifier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // V-- 3. ЭТОТ БЛОК МЕНЯЕТСЯ --V
  // --- Логика подготовки поискового запроса ---
  let effectiveSearchTerm = searchTerm;
  // Проверяем, является ли введенный текст полным Matrix ID
  if (isMXID(searchTerm)) {
    // Если да, то извлекаем из него только локальную часть (localpart)
    const parts = splitMxid(searchTerm);
    if (parts && parts.name) {
      effectiveSearchTerm = parts.name;
    }
  }

  // API Synapse для поиска по пользователям ожидает фильтр `name`
  const filter = { deactivated: false, name: effectiveSearchTerm };
  // ^-- КОНЕЦ ИЗМЕНЕНИЙ --^

  const {
    data: users,
    isLoading,
    error,
  } = useGetList(
    "users",
    {
      pagination: { page: 1, perPage: 50 },
      sort: { field: "displayname", order: "ASC" },
      filter: filter, // Используем наш обработанный фильтр
    },
    { enabled: open && searchTerm.length >= 2 }
  );

  const debouncedSetSearch = useMemo(() => debounce((value: string) => setSearchTerm(value), 500), []);

  if (!record || record.room_type !== "m.space") {
    return null;
  }

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUserIds([]);
    setSearchTerm("");
  };

  const handleToggleUser = (userId: Identifier) => {
    const currentIndex = selectedUserIds.indexOf(userId);
    const newSelectedUserIds = [...selectedUserIds];

    if (currentIndex === -1) {
      newSelectedUserIds.push(userId);
    } else {
      newSelectedUserIds.splice(currentIndex, 1);
    }

    setSelectedUserIds(newSelectedUserIds);
  };

  const handleConfirm = () => {
    console.log("Выбраны пользователи для назначения Абонентами Администраторами:", selectedUserIds);
    notify(`Выбрано пользователей: ${selectedUserIds.length}. Логика будет реализована позже.`);
    handleClose();
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
          <MuiButton onClick={handleClose}>{translate("ra.action.cancel")}</MuiButton>
          <MuiButton onClick={handleConfirm} variant="contained" disabled={selectedUserIds.length === 0}>
            {translate("ra.action.add")}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddSubscriberAdminButton;
