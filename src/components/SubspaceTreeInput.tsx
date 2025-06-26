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

// import AddCircleIcon from "@mui/icons-material/AddCircle";
// import DeleteIcon from "@mui/icons-material/Delete";
// import { Box, IconButton, Paper } from "@mui/material";
// import React from "react";
// import { Button, Labeled, TextInput } from "react-admin";
// import { useFieldArray, useFormContext } from "react-hook-form";
//
// // Рекурсивный компонент для отображения одного узла дерева
// const SubspaceNode = ({ name, control, register, remove, level = 0 }) => {
//   const {
//     fields,
//     append,
//     remove: removeChild,
//   } = useFieldArray({
//     control,
//     name: `${name}.subspaces`,
//   });
//
//   return (
//     <Paper
//       elevation={level > 0 ? 1 : 0}
//       sx={{
//         padding: 2,
//         marginTop: 1,
//         marginLeft: `${level * 20}px`,
//         border: "1px solid #ddd",
//         borderRadius: "4px",
//         position: "relative",
//       }}
//     >
//       <Box display="flex" alignItems="center" gap={2}>
//         <TextInput
//           source={`${name}.name`}
//           label={level === 0 ? "Название подпространства" : "Название вложенного подпространства"}
//           helperText={false}
//           fullWidth
//         />
//         <IconButton onClick={() => remove()} size="small" sx={{ alignSelf: "center" }}>
//           <DeleteIcon />
//         </IconButton>
//       </Box>
//
//       {fields.map((field, index) => (
//         <SubspaceNode
//           key={field.id}
//           name={`${name}.subspaces[${index}]`}
//           control={control}
//           register={register}
//           remove={() => removeChild(index)}
//           level={level + 1}
//         />
//       ))}
//
//       <Button
//         label="Добавить вложенное пространство"
//         onClick={() => append({ name: "", subspaces: [] })}
//         size="small"
//         startIcon={<AddCircleIcon />}
//         sx={{ marginTop: 1 }}
//       />
//     </Paper>
//   );
// };
//
// // Основной компонент-обертка
// export const SubspaceTreeInput = ({ source }) => {
//   const { control, register } = useFormContext();
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: source,
//   });
//
//   return (
//     <Labeled label="Структура подпространств">
//       <Box>
//         {fields.map((field, index) => (
//           <SubspaceNode
//             key={field.id}
//             name={`${source}[${index}]`}
//             control={control}
//             register={register}
//             remove={() => remove(index)}
//           />
//         ))}
//         <Button
//           label="Добавить подпространство верхнего уровня"
//           onClick={() => append({ name: "", subspaces: [] })}
//           sx={{ marginTop: 2 }}
//         >
//           <AddCircleIcon sx={{ mr: 1 }} />
//         </Button>
//       </Box>
//     </Labeled>
//   );
// };

// ./components/SubspaceTreeInput.tsx

import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Paper, IconButton } from "@mui/material";
import React from "react";
import { Button, Labeled, TextInput, useTranslate } from "react-admin";
import { useFieldArray, useFormContext } from "react-hook-form";

// Рекурсивный компонент для отображения одного узла дерева
const SubspaceNode = ({ name, control, remove, level = 0 }) => {
  const translate = useTranslate(); // <--- Используем хук
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
          fullWidth // <-- ИЗМЕНЕНИЕ: Самое важное для TextInput!
        />
        {/* IconButton не должен растягиваться, flexbox справится */}
        <IconButton onClick={() => remove()} size="small">
          <DeleteIcon />
        </IconButton>
      </Box>

      {fields.map((field, index) => (
        <SubspaceNode
          key={field.id}
          name={`${name}.subspaces[${index}]`}
          control={control}
          remove={() => removeChild(index)}
          level={level + 1}
        />
      ))}

      <Button
        label="resources.rooms.fields.subspaces.add_nested" // Используем ключ перевода
        onClick={() => append({ name: "", subspaces: [] })}
        size="small"
        startIcon={<AddCircleIcon />}
        sx={{ marginTop: 1 }}
      />
    </Paper>
  );
};

// Основной компонент-обертка
export const SubspaceTreeInput = ({ source, fullWidth }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: source,
  });

  return (
    // <-- ИЗМЕНЕНИЕ: Передаем `fullWidth` в Labeled
    <Labeled label="resources.rooms.fields.subspaces.structure_label" fullWidth={fullWidth}>
      {/* Этот Box будет контейнером для всех узлов верхнего уровня */}
      <Box sx={{ width: "100%" }}>
        {fields.map((field, index) => (
          <SubspaceNode key={field.id} name={`${source}[${index}]`} control={control} remove={() => remove(index)} />
        ))}
        <Button
          label="resources.rooms.fields.subspaces.add_top_level"
          onClick={() => append({ name: "", subspaces: [] })}
          sx={{ marginTop: 2 }}
          startIcon={<AddCircleIcon />} // <-- ИЗМЕНЕНИЕ: startIcon вместо иконки как дочернего элемента
        ></Button>
      </Box>
    </Labeled>
  );
};
