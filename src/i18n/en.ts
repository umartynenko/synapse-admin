import englishMessages from "ra-language-english";

import { SynapseTranslationMessages } from ".";

const fixedEnglishMessages = {
  ...englishMessages,
  ra: {
    ...englishMessages.ra,
    navigation: {
      ...englishMessages.ra.navigation,
      no_filtered_results: "No results",
      clear_filters: "Clear filters",
    },
    action: {
      ...englishMessages.ra.action,
      select_all_button: "Select all",
    },
    page: {
      ...englishMessages.ra.page,
      empty: "Empty",
      access_denied: "Access denied",
      authentication_error: "Authentication error",
    },
    message: {
      ...englishMessages.ra.message,
      access_denied: "You don't have permission to access this page.",
      authentication_error: "The authentication server returned an error and could not verify your credentials.",
      select_all_limit_reached: "Too many items to select. Only the first %{max} items have been selected.",
      unknown_error: "Unknown error",
    },
  },
};

const en: SynapseTranslationMessages = {
  ...fixedEnglishMessages,
  synapseadmin: {
    auth: {
      base_url: "Homeserver URL",
      welcome: "Welcome to Synapse Admin",
      server_version: "Synapse version",
      supports_specs: "supports Matrix specs",
      username_error: "Please enter fully qualified user ID: '@user:domain'",
      protocol_error: "URL has to start with 'http://' or 'https://'",
      url_error: "Not a valid Matrix server URL",
      sso_sign_in: "Sign in with SSO",
      credentials: "Credentials",
      access_token: "Access token",
      logout_acces_token_dialog: {
        title: "You are using an existing Matrix access token.",
        content:
          "Do you want to destroy this session (that could be used elsewhere, e.g. in a Matrix client) or just logout from the admin panel?",
        confirm: "Destroy session",
        cancel: "Just logout from admin panel",
      },
    },
    users: {
      invalid_user_id: "Localpart of a Matrix user-id without homeserver.",
      tabs: {
        sso: "SSO",
        experimental: "Experimental",
        limits: "Rate Limits",
        account_data: "Account Data",
      },
    },
    rooms: {
      details: "Room details",
      tabs: {
        basic: "Basic",
        members: "Members",
        detail: "Details",
        permission: "Permissions",
        media: "Media",
      },
    },
    reports: { tabs: { basic: "Basic", detail: "Details" } },
  },
  import_users: {
    error: {
      at_entry: "At entry %{entry}: %{message}",
      error: "Error",
      required_field: "Required field '%{field}' is not present",
      invalid_value: "Invalid value on line %{row}. '%{field}' field may only be 'true' or 'false'",
      unreasonably_big: "Refused to load unreasonably big file of %{size} megabytes",
      already_in_progress: "An import run is already in progress",
      id_exits: "ID %{id} already present",
    },
    title: "Import users via CSV",
    goToPdf: "Go to PDF",
    cards: {
      importstats: {
        header: "Parsed users for import",
        users_total: "%{smart_count} user in CSV file |||| %{smart_count} users in CSV file",
        guest_count: "%{smart_count} guest |||| %{smart_count} guests",
        admin_count: "%{smart_count} admin |||| %{smart_count} admins",
      },
      conflicts: {
        header: "Conflict strategy",
        mode: {
          stop: "Stop on conflict",
          skip: "Show error and skip on conflict",
        },
      },
      ids: {
        header: "IDs",
        all_ids_present: "IDs present on every entry",
        count_ids_present: "%{smart_count} entry with ID |||| %{smart_count} entries with IDs",
        mode: {
          ignore: "Ignore IDs in CSV and create new ones",
          update: "Update existing records",
        },
      },
      passwords: {
        header: "Passwords",
        all_passwords_present: "Passwords present on every entry",
        count_passwords_present: "%{smart_count} entry with password |||| %{smart_count} entries with passwords",
        use_passwords: "Use passwords from CSV",
      },
      upload: {
        header: "Input CSV file",
        explanation:
          "Here you can upload a file with comma separated values that is processed to create or update users. The file must include the fields 'id' and 'displayname'. You can download and adapt an example file here: ",
      },
      startImport: {
        simulate_only: "Simulate only",
        run_import: "Import",
      },
      results: {
        header: "Import results",
        total: "%{smart_count} entry in total |||| %{smart_count} entries in total",
        successful: "%{smart_count} entries successfully imported",
        skipped: "%{smart_count} entries skipped",
        download_skipped: "Download skipped records",
        with_error: "%{smart_count} entry with errors |||| %{smart_count} entries with errors",
        simulated_only: "Run was only simulated",
      },
    },
  },
  delete_media: {
    name: "Media",
    fields: {
      before_ts: "last access before",
      size_gt: "Larger then (in bytes)",
      keep_profiles: "Keep profile images",
    },
    action: {
      send: "Delete media",
      send_success: "Request successfully sent.",
      send_failure: "An error has occurred.",
    },
    helper: {
      send: "This API deletes the local media from the disk of your own server. This includes any local thumbnails and copies of media downloaded. This API will not affect media that has been uploaded to external media repositories.",
    },
  },
  purge_remote_media: {
    name: "Remote Media",
    fields: {
      before_ts: "last access before",
    },
    action: {
      send: "Purge remote media",
      send_success: "Purge remote media request has been sent.",
      send_failure: "An error has occurred with the purge remote media request.",
    },
    helper: {
      send: "This API purges the remote media cache from the disk of your own server. This includes any local thumbnails and copies of media downloaded. This API will not affect media that has been uploaded to the server's own media repository.",
    },
  },
  resources: {
    users: {
      name: "User |||| Users",
      email: "Email",
      msisdn: "Phone",
      threepid: "Email / Phone",
      errors: {
        load_failed: "Error loading users: %{message}",
      },
      fields: {
        avatar: "Avatar",
        id: "User-ID",
        name: "Name",
        is_guest: "Guest",
        admin: "Server Administrator",
        custom_role: "Custom role",
        choices_custom_role: {
          admin: "Admin",
          org_admin: "Organization Admin",
          space_leader: "Space Leader",
          space_admin: "Space Admin",
          vip: "VIP Subscriber",
          moderator: "Moderator",
          user: "User",
          subscriber: "Subscriber",
        },
        locked: "Locked",
        suspended: "Suspended",
        deactivated: "Deactivated",
        erased: "Erased",
        guests: "Show guests",
        show_deactivated: "Show deactivated users",
        show_locked: "Show locked users",
        show_suspended: "Show suspended users",
        user_id: "Search user",
        displayname: "Displayname",
        password: "Password",
        avatar_url: "Avatar URL",
        avatar_src: "Avatar",
        medium: "Medium",
        threepids: "3PIDs",
        address: "Address",
        creation_ts_ms: "Creation timestamp",
        consent_version: "Consent version",
        auth_provider: "Provider",
        user_type: "User type",
      },
      helper: {
        password: "Changing password will log user out of all sessions.",
        create_password: "Generate a strong and secure password using the button below.",
        deactivate: "You must provide a password to re-activate an account.",
        suspend:
          "Suspending an account means the user will not be able to log in to their account until it is reactivated.",
        erase: "Mark the user as GDPR-erased",
        erase_text:
          "This means messages sent by the user(-s) will still be visible by anyone who was in the room when these messages were sent, but hidden from users joining the room afterward.",
        erase_admin_error: "Deleting own user is not allowed.",
        modify_managed_user_error: "Modifying a system-managed user is not allowed.",
        username_available: "Username is available",
      },
      action: {
        erase: "Erase user data",
        erase_avatar: "Erase avatar",
        delete_media: "Delete all media uploaded by the user(-s)",
        redact_events: "Redact all events sent by the user(-s)",
        generate_password: "Generate password",
        overwrite_title: "Warning!",
        overwrite_content: "This username is already taken. Are you sure that you want to overwrite the existing user?",
        overwrite_cancel: "Cancel",
        overwrite_confirm: "Overwrite",
      },
      badge: {
        you: "You",
        bot: "Bot",
        admin: "Admin",
        support: "Support",
        regular: "Regular User",
        system_managed: "System-managed",
      },
      limits: {
        messages_per_second: "Messages per second",
        messages_per_second_text: "The number of actions that can be performed in a second.",
        burst_count: "Burst count",
        burst_count_text: "How many actions that can be performed before being limited.",
      },
      account_data: {
        title: "Account Data",
        global: "Global",
        rooms: "Rooms",
      },
    },
    rooms: {
      name: "Room |||| Rooms",
      generated_chat_name: 'chat for "%{name}"',
      fields: {
        room_id: "Room-ID",
        name: "Name",
        canonical_alias: "Alias",
        joined_members: "Members",
        joined_local_members: "Local members",
        joined_local_devices: "Local devices",
        state_events: "State events / Complexity",
        version: "Version",
        is_encrypted: "Encrypted",
        encryption: "Encryption",
        federatable: "Federatable",
        public: "Visible in room directory",
        creator: "Delegate this space to",
        join_rules: "Join rules",
        guest_access: "Guest access",
        history_visibility: "History visibility",
        topic: "Topic",
        avatar: "Avatar",
        actions: "Actions",
        preset: "Preset",
        room_type: {
          label: "Space Type",
          department: "Department Space",
          group: "Group Space",
          feed: "Feed",
        },
        parent_space: "Parent Space",
        parent_space_helper: "Leave empty to create a top-level feed.",
        alias_localpart: "Alias (localpart)",
        subspaces: {
          label: "Subspaces",
          name: "Subspace Name",
          nested_name: "Nested Subspace Name",
          structure_label: "Subspaces Structure",
          add_top_level: "Add top-level subspace",
          add_nested: "Add nested subspace",
          creator: "Delegate subspace to user",
          creator_helper: "If not selected, permissions are inherited from the parent or main form.",
        },
        max_users: "Maximum number of users",
        max_chats: "Maximum number of chats",
      },
      helper: {
        forward_extremities: "Forward extremities are the leaf events at the end of a Directed acyclic graph (DAG) in a room, aka events that have no children. The more exist in a room, the more state resolution that Synapse needs to perform (hint: it's an expensive operation). While Synapse has code to prevent too many of these existing at one time in a room, bugs can sometimes make them crop up again. If a room has >10 forward extremities, it's worth checking which room is the culprit and potentially removing them using the SQL queries mentioned in #1760.",
        creator: "Select user whom this space will be delegated to. Defaults to the current admin.",
        max_users: "Limits the number of members in the space and its chats.",
        max_chats: "Limits the number of child chats that can be created in this space.",
      },
      enums: {
        join_rules: {
          public: "Public",
          knock: "Knock",
          invite: "Invite",
          private: "Private",
        },
        guest_access: {
          can_join: "Guests can join",
          forbidden: "Guests can not join",
        },
        history_visibility: {
          invited: "Since invited",
          joined: "Since joined",
          shared: "Since shared",
          world_readable: "Anyone",
        },
        unencrypted: "Unencrypted",
        presets: {
          private_chat: "Private Chat",
          public_chat: "Public Chat",
        },
      },
      action: {
        create_room: "Create space",
        create_room_title: "Create a Space",
        erase: {
          title: "Delete room",
          content:
            "Are you sure you want to delete the room? This cannot be undone. All messages and shared media in the room will be deleted from the server!",
          fields: {
            block: "Block and prevent users from joining the room",
          },
          success: "Room/s successfully deleted.",
          failure: "The room/s could not be deleted.",
        },
        make_admin: {
          assign_admin: "Assign admin",
          title: "Assign a room admin to %{roomName}",
          confirm: "Make admin",
          content:
            "Put the full MXID of the user which will be set as admin.\nWarning: for this to work, the room needs to have at least one local member as admin.",
          success: "The user has been set as room admin.",
          failure: "The user could not be set as room admin. %{errMsg}",
        },
        delegate: {
          success: 'Permissions for "%{roomName}" have been delegated to %{delegateToUserId}.',
          failure: 'Failed to delegate permissions for "%{roomName}": %{error}',
        },
        create_space: {
          success: 'Space "%{name}" created.',
        },
        process_child_chats: {
          failure: 'Failed to process child chats for "%{name}"',
        },
        create_structure: {
          success: "The entire structure was created successfully!",
          critical_failure: "Critical error during creation: %{error}",
        },
      },
    },
    reports: {
      name: "Reported event |||| Reported events",
      fields: {
        id: "ID",
        received_ts: "report time",
        user_id: "announcer",
        name: "name of the room",
        score: "score",
        reason: "reason",
        event_id: "event ID",
        event_json: {
          origin: "origin server",
          origin_server_ts: "time of send",
          type: "event type",
          content: {
            msgtype: "content type",
            body: "content",
            format: "format",
            formatted_body: "formatted content",
            algorithm: "algorithm",
            url: "URL",
            info: {
              mimetype: "Type",
            },
          },
        },
      },
      action: {
        erase: {
          title: "Delete reported event",
          content: "Are you sure you want to delete the reported event? This cannot be undone.",
        },
      },
    },
    connections: {
      name: "Connections",
      fields: {
        last_seen: "Date",
        ip: "IP address",
        user_agent: "User agent",
      },
    },
    devices: {
      name: "Device |||| Devices",
      fields: {
        device_id: "Device-ID",
        display_name: "Device name",
        last_seen_ts: "Timestamp",
        last_seen_ip: "IP address",
      },
      action: {
        erase: {
          title: "Removing %{id}",
          content: 'Are you sure you want to remove the device "%{name}"?',
          success: "Device successfully removed.",
          failure: "An error has occurred.",
        },
      },
    },
    users_media: {
      name: "Media",
      fields: {
        media_id: "Media ID",
        media_length: "File Size (in Bytes)",
        media_type: "Type",
        upload_name: "File name",
        quarantined_by: "Quarantined by",
        safe_from_quarantine: "Safe from quarantine",
        created_ts: "Created",
        last_access_ts: "Last access",
      },
      action: {
        open: "Open media file in new window",
      },
    },
    protect_media: {
      action: {
        create: "Unprotected, create protection",
        delete: "Protected, remove protection",
        none: "In quarantine",
        send_success: "Successfully changed the protection status.",
        send_failure: "An error has occurred.",
      },
    },
    quarantine_media: {
      action: {
        name: "Quarantine",
        create: "Add to quarantine",
        delete: "In quarantine, unquarantine",
        none: "Protected from quarantine",
        send_success: "Successfully changed the quarantine status.",
        send_failure: "An error has occurred.",
      },
    },
    pushers: {
      name: "Pusher |||| Pushers",
      fields: {
        app: "App",
        app_display_name: "App display name",
        app_id: "App ID",
        device_display_name: "Device display name",
        kind: "Kind",
        lang: "Language",
        profile_tag: "Profile tag",
        pushkey: "Pushkey",
        data: { url: "URL" },
      },
    },
    servernotices: {
      name: "Server Notices",
      send: "Send server notices",
      fields: {
        body: "Message",
      },
      action: {
        send: "Send",
        send_success: "Server notice successfully sent.",
        send_failure: "An error has occurred.",
      },
      helper: {
        send: 'Sends a server notice to the selected users. The feature "Server Notices" has to be activated at the server.',
      },
    },
    user_media_statistics: {
      name: "Users' media",
      fields: {
        media_count: "Media count",
        media_length: "Media length",
      },
    },
    forward_extremities: {
      name: "Forward Extremities",
      fields: {
        id: "Event ID",
        received_ts: "Timestamp",
        depth: "Depth",
        state_group: "State group",
      },
    },
    room_state: {
      name: "State events",
      fields: {
        type: "Type",
        content: "Content",
        origin_server_ts: "time of send",
        sender: "Sender",
      },
    },
    room_media: {
      name: "Media",
      fields: {
        media_id: "Media ID",
      },
      helper: {
        info: "This is a list of media that has been uploaded to the room. It is not possible to delete media that has been uploaded to external media repositories.",
      },
      action: {
        error: "%{errcode} (%{errstatus}) %{error}",
      },
    },
    room_directory: {
      name: "Room directory",
      fields: {
        world_readable: "guest users may view without joining",
        guest_can_join: "guest users may join",
      },
      action: {
        title: "Delete room from directory |||| Delete %{smart_count} rooms from directory",
        content:
          "Are you sure you want to remove this room from directory? |||| Are you sure you want to remove these %{smart_count} rooms from directory?",
        erase: "Delete from room directory",
        create: "Publish in room directory",
        send_success: "Room successfully published.",
        send_failure: "An error has occurred.",
      },
    },
    destinations: {
      name: "Federation",
      fields: {
        destination: "Destination",
        failure_ts: "Failure timestamp",
        retry_last_ts: "Last retry timestamp",
        retry_interval: "Retry interval",
        last_successful_stream_ordering: "Last successful stream",
        stream_ordering: "Stream",
      },
      action: { reconnect: "Reconnect" },
    },
    registration_tokens: {
      name: "Registration tokens",
      fields: {
        token: "Token",
        valid: "Valid token",
        uses_allowed: "Uses allowed",
        pending: "Pending",
        completed: "Completed",
        expiry_time: "Expiry time",
        length: "Length",
      },
      helper: { length: "Length of the token if no token is given." },
    },
  },
  scheduled_commands: {
    action: {
      create_success: "Scheduled command created successfully",
      update_success: "Scheduled command updated successfully",
      update_failure: "An error has occurred",
      delete_success: "Scheduled command deleted successfully",
      delete_failure: "An error has occurred",
    },
  },
  recurring_commands: {
    action: {
      create_success: "Recurring command created successfully",
      update_success: "Recurring command updated successfully",
      update_failure: "An error has occurred",
      delete_success: "Recurring command deleted successfully",
      delete_failure: "An error has occurred",
    },
  },
};
export default en;
