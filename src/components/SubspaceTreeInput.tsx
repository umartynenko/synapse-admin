/**
 * SubspaceTreeInput.tsx
 *
 * A recursive React component for managing and editing a hierarchical tree of "subspaces".
 * Designed to be used inside React Admin forms and integrated with react-hook-form.
 *
 * Main features:
 * - Tree-like structure where each node can contain nested subspaces
 * - Editable names for each subspace
 * - Recursive rendering via SubspaceNode
 * - Add and remove subspaces at any depth
 * - Integrated with react-hook-form (useFormContext, useFieldArray)
 * - Styled using Material UI (MUI) components
 *
 * Intended for use in complex permission, access control, or organizational settings forms.
 *
 * @component
 * @module SubspaceTreeInput
 * @author Uriy Martynenko
 * @created 2025-06-24
 */

import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Paper, IconButton } from "@mui/material";
import React from "react";
// Добавляем AutocompleteInput в импорты
import { Button, Labeled, TextInput, useTranslate, AutocompleteInput } from "react-admin";
import { useFieldArray, useFormContext } from "react-hook-form";

// Рекурсивный компонент для отображения одного узла дерева
// Добавляем `users` в пропсы
const SubspaceNode = ({ name, control, remove, level = 0, users }) => {
  const translate = useTranslate();
  const {
    fields,
    append,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: `${name}.subspaces`,
  });

  return (
    <Paper
      elevation={level > 0 ? 1 : 0}
      sx={{
        padding: 2,
        marginTop: 1,
        marginLeft: `${level * 20}px`,
        border: "1px solid #ddd",
        borderRadius: "4px",
        position: "relative",
        width: `calc(100% - ${level * 20}px)`,
        boxSizing: "border-box",
      }}
    >
      <Box display="flex" alignItems="center" gap={2} width="100%">
        <TextInput
          source={`${name}.name`}
          label={translate(
            level === 0 ? "resources.rooms.fields.subspaces.name" : "resources.rooms.fields.subspaces.nested_name"
          )}
          helperText={false}
          fullWidth
        />
        <IconButton onClick={() => remove()} size="small">
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Добавляем AutocompleteInput для выбора создателя подпространства --> */}
      <AutocompleteInput
        source={`${name}.creator_id`}
        label={translate("resources.rooms.fields.subspaces.creator")}
        choices={users}
        optionText="id"
        optionValue="id"
        filterToQuery={searchText => ({ name: searchText })}
        helperText={translate("resources.rooms.fields.subspaces.creator_helper")}
        fullWidth
        // Это поле не является обязательным
      />

      {fields.map((field, index) => (
        <SubspaceNode
          key={field.id}
          name={`${name}.subspaces[${index}]`}
          control={control}
          remove={() => removeChild(index)}
          level={level + 1}
          users={users} // <-- ИЗМЕНЕНИЕ: Пробрасываем список пользователей дальше
        />
      ))}

      <Button
        label="resources.rooms.fields.subspaces.add_nested"
        onClick={() => append({ name: "", subspaces: [] })}
        size="small"
        startIcon={<AddCircleIcon />}
        sx={{ marginTop: 1 }}
      />
    </Paper>
  );
};

// Основной компонент-обертка
// Принимаем `users` в пропсы
export const SubspaceTreeInput = ({ source, fullWidth, users }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: source,
  });

  return (
    <Labeled label="resources.rooms.fields.subspaces.structure_label" fullWidth={fullWidth}>
      <Box sx={{ width: "100%" }}>
        {fields.map((field, index) => (
          <SubspaceNode
            key={field.id}
            name={`${source}[${index}]`}
            control={control}
            remove={() => remove(index)}
            users={users} // <-- ИЗМЕНЕНИЕ: Передаем список пользователей в первый узел
          />
        ))}
        <Button
          label="resources.rooms.fields.subspaces.add_top_level"
          onClick={() => append({ name: "", subspaces: [] })}
          sx={{ marginTop: 2 }}
          startIcon={<AddCircleIcon />}
        ></Button>
      </Box>
    </Labeled>
  );
};
