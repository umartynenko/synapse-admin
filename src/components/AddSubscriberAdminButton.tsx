// src/components/AddSubscriberAdminButton.tsx

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Button, useTranslate, useRecordContext, RaRecord } from 'react-admin';

const AddSubscriberAdminButton = () => {
    const record = useRecordContext<RaRecord>();
    const translate = useTranslate();

    // Эта кнопка должна появляться только для пространств (spaces)
    if (!record || record.room_type !== 'm.space') {
        return null;
    }

    const handleClick = () => {
        // Логика назначения Power Level будет добавлена здесь позже
        console.log('Кнопка "Добавить Абонента Администратора" нажата для пространства:', record.id);
        alert('Логика для этой кнопки будет реализована на следующем шаге.');
    };

    return (
        <Button
            label={translate('resources.rooms.action.add_subscriber_admin')}
            onClick={handleClick}
        >
            <AdminPanelSettingsIcon />
        </Button>
    );
};

export default AddSubscriberAdminButton;
