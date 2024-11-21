import { get } from "lodash";
import { Avatar, AvatarProps } from "@mui/material";
import { FieldProps, useRecordContext } from "react-admin";
import { useState, useEffect, useCallback } from "react";
import { fetchAuthenticatedMedia } from "../utils/fetchMedia";

const AvatarField = ({ source, ...rest }: AvatarProps & FieldProps) => {
  const { alt, classes, sizes, sx, variant } = rest;
  const record = useRecordContext(rest);
  const mxcURL = get(record, source)?.toString();

  const [src, setSrc] = useState<string>("");

  const fetchAvatar = useCallback(async (mxcURL: string) => {
    const response = await fetchAuthenticatedMedia(mxcURL, "thumbnail");
    const blob = await response.blob();
    const blobURL = URL.createObjectURL(blob);
    setSrc(blobURL);
  }, []);

  useEffect(() => {
    if (mxcURL) {
      fetchAvatar(mxcURL);
    }

    // Cleanup function to revoke the object URL
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [mxcURL, fetchAvatar]);

  // a hacky way to handle both users and rooms,
  // where users have an ID, may have a name, and may have a displayname
  // and rooms have an ID and may have a name
  let letter = "";
  if (record?.id) {
    letter = record.id[0].toUpperCase();
  }
  if (record?.name) {
    letter = record.name[0].toUpperCase();
  }
  if (record?.displayname) {
    letter = record.displayname[0].toUpperCase();
  }

  return (<Avatar alt={alt} classes={classes} sizes={sizes} src={src} sx={sx} variant={variant}>
          {letter}
          </Avatar>);
};

export default AvatarField;
