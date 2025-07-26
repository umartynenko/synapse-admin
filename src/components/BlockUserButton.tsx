import BlockIcon from "@mui/icons-material/Block";
import * as React from "react";
import { useState } from "react";
import { Button, Confirm, useDataProvider, useNotify, useRefresh, useTranslate, RaRecord } from "react-admin";
import { SynapseDataProvider } from "../synapse/dataProvider";

interface Props {
  record?: RaRecord;
}

const BlockUserButton = (props: Props) => {
  const { record } = props;
  const [open, setOpen] = useState(false);
  const dataProvider = useDataProvider<SynapseDataProvider>();
  const notify = useNotify();
  const refresh = useRefresh();
  const translate = useTranslate();

  if (!record) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Предотвращаем срабатывание клика по строке
    setOpen(true);
  };

  const handleDialogClose = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();
    setOpen(false);
  };

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await dataProvider.deactivateUser(record.id);
      notify("Пользователь успешно заблокирован", { type: "info" });
      refresh();
    } catch (error: any) {
      notify(error.message || "Ошибка при блокировке пользователя", { type: "warning" });
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <Button label="ra.action.delete" onClick={handleClick} color="error">
        <BlockIcon />
      </Button>
      <Confirm
        isOpen={open}
        loading={false}
        title="Блокировка пользователя"
        content={`Вы уверены, что хотите заблокировать пользователя ${record.displayname || record.id}? Пользователь будет деактивирован, но его данные не будут удалены.`}
        onConfirm={handleConfirm}
        onClose={handleDialogClose}
      />
    </>
  );
};

export default BlockUserButton;
