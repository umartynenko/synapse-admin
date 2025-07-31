import {
  DataProvider,
  DeleteManyParams,
  DeleteParams,
  fetchUtils,
  HttpError,
  Identifier,
  Options,
  PaginationPayload,
  RaRecord,
  SortPayload,
  UpdateParams,
  withLifecycleCallbacks,
} from "react-admin";

import { generateChatName } from "../resources/rooms";
import { GetConfig } from "../utils/config";
import { displayError, MatrixError } from "../utils/error";
import { returnMXID } from "../utils/mxid";

const CACHED_MANY_REF: Record<string, any> = {};

// Adds the access token to all requests
const jsonClient = async (url: string, options: Options = {}) => {
  const token = localStorage.getItem("access_token");
  console.log("httpClient " + url);
  options.credentials = GetConfig().corsCredentials as RequestCredentials;
  if (token !== null) {
    options.user = {
      authenticated: true,
      token: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetchUtils.fetchJson(url, options);
    return response;
  } catch (err: any) {
    const error = err as HttpError;
    const errorStatus = error.status;
    const errorBody = error.body as MatrixError;
    const errMsg = errorBody?.errcode
      ? displayError(errorBody.errcode, errorStatus, errorBody.error)
      : displayError("M_INVALID", errorStatus, error.message);

    return Promise.reject(new HttpError(errMsg, errorStatus, errorBody));
  }
};

const filterUndefined = (obj: Record<string, any>) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined && value !== ""));
};

interface Action {
  endpoint: string;
  method?: string;
  body?: Record<string, any>;
}

export interface Room {
  room_id: string;
  name?: string;
  canonical_alias?: string;
  avatar_url?: string;
  joined_members: number;
  joined_local_members: number;
  version: number;
  creator: string;
  encryption?: string;
  federatable: boolean;
  public: boolean;
  join_rules: "public" | "knock" | "invite" | "private";
  guest_access?: "can_join" | "forbidden";
  history_visibility: "invited" | "joined" | "shared" | "world_readable";
  state_events: number;
  room_type?: string;
}

interface RoomState {
  age: number;
  content: {
    alias?: string;
  };
  event_id: string;
  origin_server_ts: number;
  room_id: string;
  sender: string;
  state_key: string;
  type: string;
  user_id: string;
  unsigned: {
    age?: number;
  };
}

interface ForwardExtremity {
  event_id: string;
  state_group: number;
  depth: number;
  received_ts: number;
}

interface EventReport {
  id: number;
  received_ts: number;
  room_id: string;
  name: string;
  event_id: string;
  user_id: string;
  reason?: string;
  score?: number;
  sender: string;
  canonical_alias?: string;
}

interface Threepid {
  medium: string;
  address: string;
  added_at: number;
  validated_at: number;
}

interface ExternalId {
  auth_provider: string;
  external_id: string;
}

export interface User {
  id?: string;
  name: string;
  displayname?: string;
  threepids: Threepid[];
  avatar_url?: string;
  is_guest: 0 | 1;
  admin: 0 | 1;
  deactivated: 0 | 1;
  erased: boolean;
  shadow_banned: 0 | 1;
  creation_ts: number;
  appservice_id?: string;
  consent_server_notice_sent?: string;
  consent_version?: string;
  consent_ts?: number;
  external_ids: ExternalId[];
  user_type?: string;
  locked: boolean;
  suspended?: boolean;
}

interface Device {
  device_id: string;
  display_name?: string;
  last_seen_ip?: string;
  last_seen_user_agent?: string;
  last_seen_ts?: number;
  user_id: string;
}

interface Connection {
  ip: string;
  last_seen: number;
  user_agent: string;
}

interface Whois {
  user_id: string;
  devices: Record<
    string,
    {
      sessions: {
        connections: Connection[];
      }[];
    }
  >;
}

interface Pusher {
  app_display_name: string;
  app_id: string;
  data: {
    url?: string;
    format: string;
  };
  url: string;
  format: string;
  device_display_name: string;
  profile_tag: string;
  kind: string;
  lang: string;
  pushkey: string;
}

interface UserMedia {
  created_ts: number;
  last_access_ts?: number;
  media_id: string;
  media_length: number;
  media_type: string;
  quarantined_by?: string;
  safe_from_quarantine: boolean;
  upload_name?: string;
}

interface UserMediaStatistic {
  displayname: string;
  media_count: number;
  media_length: number;
  user_id: string;
}

interface RegistrationToken {
  token: string;
  uses_allowed: number;
  pending: number;
  completed: number;
  expiry_time?: number;
}

interface RaServerNotice {
  id: string;
  body: string;
}

interface Destination {
  destination: string;
  retry_last_ts: number;
  retry_interval: number;
  failure_ts: number;
  last_successful_stream_ordering?: number;
}

interface DestinationRoom {
  room_id: string;
  stream_ordering: number;
}

export interface DeleteMediaParams {
  before_ts: string;
  size_gt: number;
  keep_profiles: boolean;
}

export interface DeleteMediaResult {
  deleted_media: Identifier[];
  total: number;
}

export interface UploadMediaParams {
  file: File;
  filename: string;
  content_type: string;
}

export interface UploadMediaResult {
  content_uri: string;
}

export interface ExperimentalFeaturesModel {
  features: Record<string, boolean>;
}

export interface RateLimitsModel {
  messages_per_second?: number;
  burst_count?: number;
}

export interface AccountDataModel {
  account_data: {
    global: Record<string, object>;
    rooms: Record<string, object>;
  };
}

export interface UsernameAvailabilityResult {
  available?: boolean;
  error?: string;
  errcode?: string;
}

export interface ServerStatusComponent {
  ok: boolean;
  category: string;
  reason: string;
  url: string;
  help: string;
  label: {
    url: string;
    icon: string;
    text: string;
  };
}

export interface ServerStatusResponse {
  success: boolean;
  ok: boolean;
  host: string;
  results: ServerStatusComponent[];
}

export interface ServerProcessResponse {
  locked_at: string;
  command: string;
}

export interface ServerNotification {
  event_id: string;
  output: string;
  sent_at: string;
}

export interface ServerNotificationsResponse {
  success: boolean;
  notifications: ServerNotification[];
}

export interface ServerCommand {
  icon: string;
  name: string;
  description: string;
  args: boolean;
  with_lock: boolean;
  additionalArgs?: string;
}

export type ServerCommandsResponse = Record<string, ServerCommand>;

export interface ScheduledCommand {
  args: string;
  command: string;
  id: string;
  is_recurring: boolean;
  scheduled_at: string;
}

export interface RecurringCommand {
  args: string;
  command: string;
  id: string;
  scheduled_at: string;
  time: string;
}

export interface SynapseDataProvider extends DataProvider {
  deactivateUser: (id: Identifier) => Promise<void>;
  deleteMedia: (params: DeleteMediaParams) => Promise<DeleteMediaResult>;
  purgeRemoteMedia: (params: DeleteMediaParams) => Promise<DeleteMediaResult>;
  uploadMedia: (params: UploadMediaParams) => Promise<UploadMediaResult>;
  updateFeatures: (id: Identifier, features: ExperimentalFeaturesModel) => Promise<void>;
  getRateLimits: (id: Identifier) => Promise<RateLimitsModel>;
  setRateLimits: (id: Identifier, rateLimits: RateLimitsModel) => Promise<void>;
  getAccountData: (id: Identifier) => Promise<AccountDataModel>;
  checkUsernameAvailability: (username: string) => Promise<UsernameAvailabilityResult>;
  getServerRunningProcess: (etkeAdminUrl: string) => Promise<ServerProcessResponse>;
  getServerStatus: (etkeAdminUrl: string) => Promise<ServerStatusResponse>;
  getServerNotifications: (etkeAdminUrl: string) => Promise<ServerNotificationsResponse>;
  deleteServerNotifications: (etkeAdminUrl: string) => Promise<{ success: boolean }>;
  getServerCommands: (etkeAdminUrl: string) => Promise<ServerCommandsResponse>;
  getScheduledCommands: (etkeAdminUrl: string) => Promise<ScheduledCommand[]>;
  getRecurringCommands: (etkeAdminUrl: string) => Promise<RecurringCommand[]>;
  createScheduledCommand: (etkeAdminUrl: string, command: Partial<ScheduledCommand>) => Promise<ScheduledCommand>;
  updateScheduledCommand: (etkeAdminUrl: string, command: ScheduledCommand) => Promise<ScheduledCommand>;
  deleteScheduledCommand: (etkeAdminUrl: string, id: string) => Promise<{ success: boolean }>;
  createRecurringCommand: (etkeAdminUrl: string, command: Partial<RecurringCommand>) => Promise<RecurringCommand>;
  updateRecurringCommand: (etkeAdminUrl: string, command: RecurringCommand) => Promise<RecurringCommand>;
  deleteRecurringCommand: (etkeAdminUrl: string, id: string) => Promise<{ success: boolean }>;
  makeRoomAdmin: (roomId: string, userId: string, impersonateId?: string) => Promise<any>;
  inviteUser: (roomId: string, userId: string, impersonateId?: string) => Promise<any>;
  joinRoom: (roomId: string, impersonateId: string) => Promise<any>;
  getRoomChildren: (roomId: string) => Promise<string[]>;
  getRoomChildrenWithDetails: (roomId: string) => Promise<any[]>;
  getHierarchyMembers: (roomId: string) => Promise<{ data: string[] }>;
  getSpaceAncestors: (roomId: string) => Promise<Room[]>;
  sendStateEvent: (
    roomId: string,
    eventType: string,
    stateKey: string,
    content: object,
    impersonateId?: string
  ) => Promise<any>;
}

const resourceMap = {
  users: {
    path: "/_synapse/admin/v2/users",
    map: async (u: User) => ({
      ...u,
      id: returnMXID(u.name),
      avatar_src: u.avatar_url ? u.avatar_url : undefined,
      is_guest: !!u.is_guest,
      admin: !!u.admin,
      deactivated: !!u.deactivated,
      // need timestamp in milliseconds
      creation_ts_ms: u.creation_ts * 1000,
    }),
    data: "users",
    total: json => json.total,
    create: (data: RaRecord) => {
      const body = { ...data };
      // При создании пользователь всегда должен быть АКТИВНЫМ,
      // чтобы его можно было найти и деактивировать в `afterCreate`.
      body.deactivated = false;

      return {
        endpoint: `/_synapse/admin/v2/users/${encodeURIComponent(returnMXID(data.id))}`,
        body: body,
        method: "PUT",
      };
    },
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/deactivate/${encodeURIComponent(returnMXID(params.id))}`,
      body: { erase: true },
      method: "POST",
    }),
  },
  rooms: {
    path: "/_synapse/admin/v1/rooms",
    map: (r: Room) => ({
      ...r,
      id: r.room_id,
      alias: r.canonical_alias,
      members: r.joined_members,
      is_encrypted: !!r.encryption,
      federatable: !!r.federatable,
      public: !!r.public,
    }),
    data: "rooms",
    total: json => json.total_rooms,
    create: (params: RaRecord) => ({
      endpoint: "/_matrix/client/v3/createRoom",
      body: params,
      method: "POST",
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v2/rooms/${params.id}`,
      body: { block: params.meta?.block ?? false },
    }),
  },
  reports: {
    path: "/_synapse/admin/v1/event_reports",
    map: (er: EventReport) => ({ ...er }),
    data: "event_reports",
    total: json => json.total,
  },
  devices: {
    map: (d: Device) => ({
      ...d,
      id: d.device_id,
    }),
    data: "devices",
    total: json => json.total,
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v2/users/${encodeURIComponent(id)}/devices`,
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v2/users/${encodeURIComponent(params.previousData.user_id)}/devices/${params.id}`,
    }),
  },
  connections: {
    path: "/_synapse/admin/v1/whois",
    map: (c: Whois) => ({
      ...c,
      id: c.user_id,
    }),
    data: "connections",
  },
  room_members: {
    map: (m: string) => ({
      id: m,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/rooms/${id}/members`,
    }),
    data: "members",
    total: json => json.total,
  },
  room_media: {
    map: (mediaId: string) => ({
      id: mediaId.replace("mxc://" + localStorage.getItem("home_server") + "/", ""),
      media_id: mediaId.replace("mxc://" + localStorage.getItem("home_server") + "/", ""),
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/room/${id}/media`,
    }),
    total: json => json.total,
    data: "local",
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/media/${localStorage.getItem("home_server")}/${params.id}`,
    }),
  },
  room_state: {
    map: (rs: RoomState) => ({
      ...rs,
      id: rs.event_id,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/rooms/${id}/state`,
    }),
    data: "state",
    total: json => json.state.length,
  },
  pushers: {
    map: (p: Pusher) => ({
      ...p,
      id: p.pushkey,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/users/${encodeURIComponent(id)}/pushers`,
    }),
    data: "pushers",
    total: json => json.total,
  },
  joined_rooms: {
    map: (jr: string) => ({
      id: jr,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/users/${encodeURIComponent(id)}/joined_rooms`,
    }),
    data: "joined_rooms",
    total: json => json.total,
  },
  users_media: {
    map: (um: UserMedia) => ({
      ...um,
      id: um.media_id,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(id))}/media`,
    }),
    data: "media",
    total: json => json.total,
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/media/${localStorage.getItem("home_server")}/${params.id}`,
    }),
  },
  protect_media: {
    map: (pm: UserMedia) => ({ id: pm.media_id }),
    create: (params: UserMedia) => ({
      endpoint: `/_synapse/admin/v1/media/protect/${params.media_id}`,
      method: "POST",
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/media/unprotect/${params.id}`,
      method: "POST",
    }),
  },
  quarantine_media: {
    map: (qm: UserMedia) => ({ id: qm.media_id }),
    create: (params: UserMedia) => ({
      endpoint: `/_synapse/admin/v1/media/quarantine/${localStorage.getItem("home_server")}/${params.media_id}`,
      method: "POST",
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/media/unquarantine/${localStorage.getItem("home_server")}/${params.id}`,
      method: "POST",
    }),
  },
  servernotices: {
    map: (n: { event_id: string }) => ({ id: n.event_id }),
    create: (data: RaServerNotice) => ({
      endpoint: "/_synapse/admin/v1/send_server_notice",
      body: {
        user_id: returnMXID(data.id),
        content: {
          msgtype: "m.text",
          body: data.body,
        },
      },
      method: "POST",
    }),
  },
  user_media_statistics: {
    path: "/_synapse/admin/v1/statistics/users/media",
    map: (usms: UserMediaStatistic) => ({
      ...usms,
      id: returnMXID(usms.user_id),
    }),
    data: "users",
    total: json => json.total,
  },
  forward_extremities: {
    map: (fe: ForwardExtremity) => ({
      ...fe,
      id: fe.event_id,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/rooms/${id}/forward_extremities`,
    }),
    data: "results",
    total: json => json.count,
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/rooms/${params.id}/forward_extremities`,
    }),
  },
  room_directory: {
    path: "/_matrix/client/r0/publicRooms",
    map: (rd: Room) => ({
      ...rd,
      id: rd.room_id,
      public: !!rd.public,
      guest_access: !!rd.guest_access,
      avatar_src: rd.avatar_url ? rd.avatar_url : undefined,
    }),
    data: "chunk",
    total: json => json.total_room_count_estimate,
    create: (params: RaRecord) => ({
      endpoint: `/_matrix/client/r0/directory/list/room/${params.id}`,
      body: { visibility: "public" },
      method: "PUT",
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_matrix/client/r0/directory/list/room/${params.id}`,
      body: { visibility: "private" },
      method: "PUT",
    }),
  },
  destinations: {
    path: "/_synapse/admin/v1/federation/destinations",
    map: (dst: Destination) => ({
      ...dst,
      id: dst.destination,
    }),
    data: "destinations",
    total: json => json.total,
    delete: params => ({
      endpoint: `/_synapse/admin/v1/federation/destinations/${params.id}/reset_connection`,
      method: "POST",
    }),
  },
  destination_rooms: {
    map: (dstroom: DestinationRoom) => ({
      ...dstroom,
      id: dstroom.room_id,
    }),
    reference: (id: Identifier) => ({
      endpoint: `/_synapse/admin/v1/federation/destinations/${id}/rooms`,
    }),
    data: "rooms",
    total: json => json.total,
  },
  registration_tokens: {
    path: "/_synapse/admin/v1/registration_tokens",
    map: (rt: RegistrationToken) => ({
      ...rt,
      id: rt.token,
    }),
    data: "registration_tokens",
    total: json => json.registration_tokens.length,
    create: (params: RaRecord) => ({
      endpoint: "/_synapse/admin/v1/registration_tokens/new",
      body: params,
      method: "POST",
    }),
    delete: (params: DeleteParams) => ({
      endpoint: `/_synapse/admin/v1/registration_tokens/${params.id}`,
    }),
  },
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
function filterNullValues(key: string, value: any) {
  // Filtering out null properties
  // to reset user_type from user, it must be null
  if (value === null && key !== "user_type") {
    return undefined;
  }
  return value;
}

function getSearchOrder(order: "ASC" | "DESC") {
  if (order === "DESC") {
    return "b";
  } else {
    return "f";
  }
}

const baseDataProvider: SynapseDataProvider = {
  /**
   * Получает список дочерних комнат для данного пространства.
   * @param roomId - ID пространства.
   * @returns - Массив ID дочерних комнат.
   */
  getRoomChildren: async roomId => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/rooms/${encodeURIComponent(roomId)}/state`;

    try {
      const { json } = await jsonClient(endpoint_url);
      const children = json.state
        .filter(event => event.type === "m.space.child" && event.state_key)
        .map(event => event.state_key);
      console.log(`Найдены дочерние комнаты для ${roomId}:`, children);
      return children;
    } catch (error) {
      console.error(`Ошибка при получении дочерних комнат для ${roomId}:`, error);
      return [];
    }
  },

  /**
   * Получает отфильтрованный, отсортированный и пагинированный список ресурсов из Synapse Admin API.
   *
   * Этот метод реализует стандартный контракт `getList` для `react-admin`. Он формирует
   * запрос на основе параметров пагинации, сортировки и фильтрации.
   *
   * Ключевая особенность — специальная логика для ресурса 'rooms', которая позволяет
   * разделить "Пространства" и "Чаты" на разные вкладки. API-эндпоинт Synapse
   * возвращает оба типа комнат вместе. Эта функция перехватывает кастомный фильтр
   * `creation_content.type`, запрашивает все комнаты, а затем фильтрует результат
   * на стороне клиента, чтобы показать либо пространства (`m.space`), либо чаты (`null`).
   *
   * @async
   * @method getList
   * @param {string} resource - Имя ресурса для запроса (например, 'users', 'rooms').
   * @param {object} params - Параметры запроса, предоставляемые react-admin.
   * @param {PaginationPayload} params.pagination - Настройки пагинации (page, perPage).
   * @param {SortPayload} params.sort - Настройки сортировки (field, order).
   * @param {object} params.filter - Критерии фильтрации.
   * @returns {Promise<{data: RaRecord[], total: number}>} Промис, который разрешается объектом,
   * содержащим список записей и общее количество для пагинации.
   */
  getList: async (resource, params) => {
    console.log(`getList ${resource}`, params);

    const { page, perPage } = params.pagination as PaginationPayload;
    const { field, order } = params.sort as SortPayload;
    const from = (page - 1) * perPage;
    const filter = { ...params.filter };
    const query: Record<string, any> = {
      from: from,
      limit: perPage,
      order_by: field,
      dir: getSearchOrder(order),
    };

    // Определяем, какой тип фильтрации на стороне клиента нам нужен
    let clientSideFilterType: "chats" | "spaces" | null = null;

    if (resource === "rooms" && "creation_content.type" in filter) {
      const roomType = filter["creation_content.type"];
      if (roomType === "m.space") {
        clientSideFilterType = "spaces";
      } else if (roomType === null) {
        clientSideFilterType = "chats";
      }
      // Удаляем фильтр, так как он будет применен на клиенте
      delete filter["creation_content.type"];
    }

    Object.assign(query, filter);

    const homeserver = localStorage.getItem("base_url");

    if (!homeserver || !(resource in resourceMap)) throw new Error("Homeserver not set");

    const res = resourceMap[resource];
    const endpoint_url = homeserver + res.path;
    const url = `${endpoint_url}?${new URLSearchParams(filterUndefined(query)).toString()}`;
    const { json } = await jsonClient(url);

    let data = json[res.data];
    let total = res.total(json, from, perPage);

    // Применяем фильтрацию на стороне клиента, если это необходимо
    if (clientSideFilterType) {
      if (clientSideFilterType === "chats") {
        // Оставляем комнаты, у которых НЕТ типа (это чаты)
        data = data.filter((room: any) => !room.room_type);
      } else if (clientSideFilterType === "spaces") {
        // Оставляем комнаты, у которых тип РАВЕН 'm.space'
        data = data.filter((room: any) => room.room_type === "m.space");
      }
      // Корректируем total для пагинации. Это компромисс при клиентской фильтрации.
      total = data.length;
    }

    const formattedData = data.map((item: any) => res.map(item));

    return {
      data: formattedData,
      total: total,
    };
  },

  getOne: async (resource, params) => {
    console.log("getOne " + resource);
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];

    const endpoint_url = homeserver + res.path;
    const { json } = await jsonClient(`${endpoint_url}/${encodeURIComponent(params.id)}`);
    return { data: res.map(json) };
  },

  getMany: async (resource, params) => {
    console.log("getMany " + resource);
    const base_url = localStorage.getItem("base_url");
    const homeserver = localStorage.getItem("home_server");
    if (!base_url || !(resource in resourceMap)) throw Error("base_url not set");

    const res = resourceMap[resource];

    const endpoint_url = base_url + res.path;
    const responses = await Promise.all(
      params.ids.map(id => {
        if (homeserver && resource === "users") {
          if (!(id as string).endsWith(homeserver)) {
            const json = {
              name: id,
            };
            return Promise.resolve({ json });
          }
        }
        return jsonClient(`${endpoint_url}/${encodeURIComponent(id)}`);
      })
    );
    return {
      data: responses.map(({ json }) => res.map(json)),
      total: responses.length,
    };
  },

  getManyReference: async (resource, params) => {
    console.log("getManyReference " + resource);
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const from = (page - 1) * perPage;
    const query = {
      from: from,
      limit: perPage,
      order_by: field,
      dir: getSearchOrder(order),
    };

    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];

    const ref = res.reference(params.id);

    const endpoint_url = `${homeserver}${ref.endpoint}?${new URLSearchParams(filterUndefined(query)).toString()}`;
    const CACHE_KEY = ref.endpoint;
    let jsonData = [];
    let total = 0;

    if (CACHED_MANY_REF[CACHE_KEY]) {
      jsonData = CACHED_MANY_REF[CACHE_KEY]["data"].slice(from, from + perPage);
      total = CACHED_MANY_REF[CACHE_KEY]["total"];
    } else {
      const { json } = await jsonClient(endpoint_url);
      jsonData = json[res.data];
      total = res.total(json, from, perPage);
      if (resource === "joined_rooms") {
        CACHED_MANY_REF[CACHE_KEY] = { data: jsonData, total: total };
        jsonData = jsonData.slice(from, from + perPage);
      }
    }

    return {
      data: jsonData.map(res.map),
      total: total,
    };
  },

  /**
   * Обновляет запись ресурса, с особой логикой для иерархических пространств.
   *
   * Этот метод реализует стандартный контракт `update` для `react-admin`.
   * Для большинства ресурсов он выполняет простой PUT-запрос. Однако для ресурса `rooms`
   * он запускает сложный процесс обновления, который может затронуть множество связанных комнат.
   *
   * **Логика для ресурса 'rooms':**
   * 1.  **Обновление основной записи:** Сначала метод обновляет имя (`m.room.name`) и/или
   *     описание (`m.room.topic`) самой редактируемой комнаты (пространства или чата),
   *     отправляя соответствующие state events.
   *
   * 2.  **Иерархическое обновление (только для пространств):** Если редактируемая запись
   *     является пространством (`isSpace`) и её имя было изменено, запускается
   *     рекурсивное обновление всех дочерних элементов в иерархии.
   *     - **Построение пути:** С помощью `getSpaceAncestors` определяется полный иерархический
   *       путь к родителям редактируемого пространства (например, "Главный офис / Департамент ИТ").
   *     - **Рекурсивный обход (`updateSubtree`):**
   *       - Для каждого пространства в поддереве формируется новое полное иерархическое имя.
   *       - Все дочерние *чаты* этого пространства переименовываются в соответствии с новым
   *         иерархическим именем (например, `ГО.ДИ.Отдел разработки ОЧ`).
   *       - Функция рекурсивно вызывается для каждого дочернего *пространства*.
   *
   * **Стандартная логика:**
   * Для всех остальных ресурсов выполняется стандартный HTTP PUT-запрос к соответствующему
   * эндпоинту API для обновления записи.
   *
   * @async
   * @param {string} resource - Имя ресурса для обновления (например, 'users', 'rooms').
   * @param {UpdateParams} params - Параметры для обновления, предоставляемые react-admin.
   * @returns {Promise<{data: RaRecord}>} Промис, который разрешается с обновленными данными записи.
   * @throws {Error} Выбрасывает ошибку, если homeserver не установлен или ресурс неизвестен.
   */
  update: async (resource, params: UpdateParams) => {
    if (resource === "rooms") {
      const { id, data, previousData } = params;
      const roomId = id.toString();
      const newName = data.name;
      const oldName = previousData.name;
      const newTopic = data.topic;
      const isSpace = previousData.room_type === "m.space";

      console.log(`[Update Start] Room: ${roomId}, New Name: ${newName}, Is Space: ${isSpace}`);

      // Шаг 1: Обновляем состояние самого редактируемого пространства
      const updatePromises = [];
      if (newName && newName !== oldName) {
        updatePromises.push(baseDataProvider.sendStateEvent(roomId, "m.room.name", "", { name: newName }));
      }
      if (newTopic !== previousData.topic) {
        updatePromises.push(baseDataProvider.sendStateEvent(roomId, "m.room.topic", "", { topic: newTopic || "" }));
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`[Update] Состояние основного пространства ${roomId} обновлено.`);
      }

      // Шаг 2: Если это пространство и его имя изменилось, запускаем рекурсивное обновление иерархии
      if (isSpace && newName && newName !== oldName) {
        console.log(`[Update] Имя пространства изменилось. Запуск обновления иерархии.`);

        const updateSubtree = async (spaceId: string, parentHierarchicalName: string): Promise<void> => {
          // Для редактируемого пространства используем новое имя. Для всех дочерних — запрашиваем их текущее имя, чтобы избежать использования устаревших данных.
          const currentShortName =
            spaceId === roomId ? newName : (await baseDataProvider.getOne("rooms", { id: spaceId })).data.name;

          const currentHierarchicalName = parentHierarchicalName
            ? `${parentHierarchicalName} / ${currentShortName}`
            : currentShortName;

          console.log(`[Subtree] Обработка: ${spaceId} (${currentShortName}). Полный путь: ${currentHierarchicalName}`);

          // ВАЖНО: getRoomChildrenWithDetails - это кастомный метод. Убедитесь, что он правильно реализован на бэкенде.
          const childRooms = await baseDataProvider.getRoomChildrenWithDetails(spaceId);

          // Переименовываем дочерние чаты
          const chatPromises = childRooms
            .filter(child => child.chat_type) // только чаты
            .map(childChat => {
              const chatTypeAbbr = childChat.chat_type === "private_chat" ? "ЗЧ" : "ОЧ";
              const newChatName = generateChatName(currentHierarchicalName, chatTypeAbbr);
              console.log(`[Subtree] Переименование чата ${childChat.room_id} в "${newChatName}"`);
              return baseDataProvider.sendStateEvent(childChat.room_id, "m.room.name", "", { name: newChatName });
            });
          await Promise.all(chatPromises);

          // Рекурсивно обрабатываем дочерние пространства
          const childSpaces = childRooms.filter(child => !child.chat_type); // только пространства
          for (const childSpace of childSpaces) {
            await updateSubtree(childSpace.room_id, currentHierarchicalName);
          }
        };

        // Находим всех предков, чтобы построить корректный родительский путь
        const ancestors = await baseDataProvider.getSpaceAncestors(roomId);
        console.log(
          "[Update] Найденные предки:",
          ancestors.map(a => a.name)
        );

        const parentHierarchicalName = ancestors.map(a => a.name).join(" / ");
        console.log(`[Update] Стартовый путь от родителей: "${parentHierarchicalName}"`);

        // Запускаем рекурсивное обновление
        await updateSubtree(roomId, parentHierarchicalName);
        console.log("[Update] Обновление иерархии завершено.");
      }

      return { data: { ...previousData, ...data, id } };
    }

    // Стандартная логика для остальных ресурсов
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw new Error("Homeserver not set");
    const res = resourceMap[resource];
    const endpoint_url = homeserver + res.path;
    const { json } = await jsonClient(`${endpoint_url}/${encodeURIComponent(params.id)}`, {
      method: "PUT",
      body: JSON.stringify(params.data, filterNullValues),
    });
    return { data: res.map(json) };
  },

  /**
   * Находит и возвращает всех предков (родительские пространства) для указанной комнаты.
   *
   * Функция итеративно поднимается по иерархии пространств, начиная с `roomId`.
   * На каждом шаге она запрашивает state-события текущей комнаты, находит событие
   * `m.space.parent`, которое указывает на ID родительского пространства. Затем
   * запрашиваются детали этого родителя, и он добавляется в начало массива предков.
   * Процесс повторяется до тех пор, пока не будет достигнут корень иерархии (пространство без родителя).
   *
   * @async
   * @param {string} roomId - ID комнаты или пространства, для которого нужно найти предков.
   * @returns {Promise<Room[]>} Промис, который разрешается массивом объектов `Room`.
   * Массив отсортирован от самого верхнего предка (корня) до прямого родителя `roomId`.
   * Если предков нет, возвращается пустой массив.
   */
  getSpaceAncestors: async (roomId: string): Promise<Room[]> => {
    const ancestors: Room[] = [];
    let currentRoomId: string | null = roomId;

    while (currentRoomId) {
      const stateUrl = `${localStorage.getItem("base_url")}/_synapse/admin/v1/rooms/${encodeURIComponent(currentRoomId)}/state`;
      const { json: stateJson } = await jsonClient(stateUrl);
      const stateEvents = stateJson.state || [];

      // Ищем событие, указывающее на родителя
      const parentEvent = stateEvents.find(event => event.type === "m.space.parent" && event.state_key);
      const parentId = parentEvent ? parentEvent.state_key : null;

      if (parentId) {
        try {
          // Запрашиваем детали родителя, чтобы получить его имя
          const parentDetailsUrl = `${localStorage.getItem("base_url")}/_synapse/admin/v1/rooms/${encodeURIComponent(parentId)}`;
          const { json: parentJson } = await jsonClient(parentDetailsUrl);
          // Добавляем родителя в начало массива, чтобы сохранить правильный порядок (от корня к прямому родителю)
          ancestors.unshift(parentJson as Room);
          currentRoomId = parentId;
        } catch (e) {
          console.error(`Не удалось получить детали родительского пространства ${parentId}`, e);
          currentRoomId = null; // Прерываем цикл в случае ошибки
        }
      } else {
        currentRoomId = null; // Больше родителей нет
      }
    }
    return ancestors;
  },

  /**
   * Получает детальную информацию о прямых дочерних элементах (комнатах и пространствах) для указанного пространства.
   *
   * Эта функция обращается к *кастомному* эндпоинту Synapse Admin API (`/room_children/{roomId}`),
   * который должен быть реализован на стороне сервера. В отличие от `getRoomChildren`,
   * этот метод возвращает не просто ID, а массив объектов с подробной информацией
   * о каждом дочернем элементе, включая его ID, имя, тип чата и другие детали.
   *
   * @async
   * @param {string} roomId - ID родительского пространства, для которого нужно получить дочерние элементы.
   * @returns {Promise<any[]>} Промис, который разрешается массивом объектов, описывающих дочерние комнаты.
   * В случае ошибки или отсутствия дочерних элементов возвращает пустой массив.
   * Пример объекта в массиве: `{ room_id: string, name: string, chat_type: "private_chat" | "public_chat" | null, ... }`
   */
  getRoomChildrenWithDetails: async (roomId: string): Promise<any[]> => {
    const base_url = localStorage.getItem("base_url");
    // Этот эндпоинт /room_children/ является кастомным для вашей сборки.
    // Убедитесь, что он работает и возвращает массив { room_id, name, chat_type, ... }
    const endpoint_url = `${base_url}/_synapse/admin/v1/room_children/${encodeURIComponent(roomId)}`;
    try {
      const { json } = await jsonClient(endpoint_url);
      return json.children || [];
    } catch (error) {
      console.error(`Ошибка при получении дочерних комнат для ${roomId}:`, error);
      return [];
    }
  },

  create: async (resource, params) => {
    console.log("create " + resource, params);
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];
    if (!("create" in res)) return Promise.reject();

    const { meta, ...dataForBody } = params.data;

    const createConfig = res.create(dataForBody);

    let endpoint_url = homeserver + createConfig.endpoint;

    if (meta?.impersonate) {
      const impersonateId = encodeURIComponent(meta.impersonate);
      endpoint_url += (endpoint_url.includes("?") ? "&" : "?") + `_user_id=${impersonateId}`;
      console.log(`Impersonating user: ${impersonateId}. New URL: ${endpoint_url}`);
    } else {
      console.log("No impersonation, performing action as current admin.");
    }

    const { json } = await jsonClient(endpoint_url, {
      method: createConfig.method,
      body: JSON.stringify(createConfig.body, filterNullValues),
    });

    if (resource === "rooms" && json.room_id) {
      let child_rooms = {};

      if (json.room_alias) {
        const parts = json.room_alias.split("|");
        if (parts.length === 3) {
          json.room_alias = parts[0];
          child_rooms = {
            public_chat_id: parts[1],
            private_chat_id: parts[2],
          };
          console.log("Успешно извлечены ID дочерних чатов:", child_rooms);
        }
      }

      return {
        data: {
          id: json.room_id,
          ...dataForBody,
          ...child_rooms,
        },
      };
    }

    // --- ИЗМЕНЕНИЕ: ДОЖИДАЕМСЯ ВЫПОЛНЕНИЯ ASYNC MAP ---
    // Это гарантирует, что в afterCreate придет объект, а не Promise.
    const mappedData = await res.map(json);
    return { data: mappedData };
  },

  createMany: async (resource: string, params: { ids: Identifier[]; data: RaRecord }) => {
    console.log("createMany " + resource);
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];
    if (!("create" in res)) throw Error(`Create ${resource} is not allowed`);

    const responses = await Promise.all(
      params.ids.map(id => {
        params.data.id = id;
        const cre = res.create(params.data);
        const endpoint_url = homeserver + cre.endpoint;
        return jsonClient(endpoint_url, {
          method: cre.method,
          body: JSON.stringify(cre.body, filterNullValues),
        });
      })
    );
    return { data: responses.map(({ json }) => json) };
  },

  delete: async (resource, params) => {
    console.log("delete " + resource);
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];

    if ("delete" in res) {
      const del = res.delete(params);
      const endpoint_url = homeserver + del.endpoint;
      const { json } = await jsonClient(endpoint_url, {
        method: "method" in del ? del.method : "DELETE",
        body: "body" in del ? JSON.stringify(del.body) : null,
      });
      return { data: json };
    } else {
      const endpoint_url = homeserver + res.path;
      const { json } = await jsonClient(`${endpoint_url}/${params.id}`, {
        method: "DELETE",
        body: JSON.stringify(params.previousData, filterNullValues),
      });
      return { data: json };
    }
  },

  deleteMany: async (resource, params) => {
    console.log("deleteMany " + resource, "params", params);
    const homeserver = localStorage.getItem("base_url");
    if (!homeserver || !(resource in resourceMap)) throw Error("Homeserver not set");

    const res = resourceMap[resource];

    if ("delete" in res) {
      const responses = await Promise.all(
        params.ids.map(id => {
          const del = res.delete({ ...params, id: id });
          const endpoint_url = homeserver + del.endpoint;
          return jsonClient(endpoint_url, {
            method: "method" in del ? del.method : "DELETE",
            body: "body" in del ? JSON.stringify(del.body) : null,
          });
        })
      );

      return {
        data: responses.map(({ json }) => json),
      };
    } else {
      const endpoint_url = homeserver + res.path;
      const responses = await Promise.all(
        params.ids.map(id =>
          jsonClient(`${endpoint_url}/${id}`, {
            method: "DELETE",
          })
        )
      );
      return { data: responses.map(({ json }) => json) };
    }
  },

  deleteMedia: async ({ before_ts, size_gt = 0, keep_profiles = true }) => {
    const homeserver = localStorage.getItem("home_server");
    const endpoint = `/_synapse/admin/v1/media/${homeserver}/delete?before_ts=${before_ts}&size_gt=${size_gt}&keep_profiles=${keep_profiles}`;

    const base_url = localStorage.getItem("base_url");
    const endpoint_url = base_url + endpoint;
    const { json } = await jsonClient(endpoint_url, { method: "POST" });
    return json as DeleteMediaResult;
  },

  purgeRemoteMedia: async ({ before_ts }) => {
    const endpoint = `/_synapse/admin/v1/purge_media_cache?before_ts=${before_ts}`;

    const base_url = localStorage.getItem("base_url");
    const endpoint_url = base_url + endpoint;
    const { json } = await jsonClient(endpoint_url, { method: "POST" });
    return json as DeleteMediaResult;
  },

  uploadMedia: async ({ file, filename, content_type }: UploadMediaParams) => {
    const base_url = localStorage.getItem("base_url");
    const uploadMediaURL = `${base_url}/_matrix/media/v3/upload`;

    const { json } = await jsonClient(`${uploadMediaURL}?filename=${filename}`, {
      method: "POST",
      body: file,
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": content_type,
      }) as Headers,
    });
    return json as UploadMediaResult;
  },
  getFeatures: async (id: Identifier) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/experimental_features/${encodeURIComponent(returnMXID(id))}`;
    const { json } = await jsonClient(endpoint_url);
    return json.features as ExperimentalFeaturesModel;
  },
  updateFeatures: async (id: Identifier, features: ExperimentalFeaturesModel) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/experimental_features/${encodeURIComponent(returnMXID(id))}`;
    await jsonClient(endpoint_url, { method: "PUT", body: JSON.stringify({ features }) });
  },
  getRateLimits: async (id: Identifier) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(id))}/override_ratelimit`;
    const { json } = await jsonClient(endpoint_url);
    return json as RateLimitsModel;
  },
  getAccountData: async (id: Identifier) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(id))}/accountdata`;
    const { json } = await jsonClient(endpoint_url);
    return json as AccountDataModel;
  },
  setRateLimits: async (id: Identifier, rateLimits: RateLimitsModel) => {
    const filtered = Object.entries(rateLimits)
      .filter(([key, value]) => value !== null && value !== undefined)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(id))}/override_ratelimit`;
    if (Object.keys(filtered).length === 0) {
      await jsonClient(endpoint_url, { method: "DELETE" });
      return;
    }

    await jsonClient(endpoint_url, { method: "POST", body: JSON.stringify(filtered) });
  },

  getRoomStateEvent: async (roomId, eventType, stateKey) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_matrix/client/v3/rooms/${encodeURIComponent(
      roomId
    )}/state/${encodeURIComponent(eventType)}/${encodeURIComponent(stateKey)}`;

    try {
      const { json } = await jsonClient(endpoint_url);
      return json;
    } catch (error) {
      // Если событие не найдено (404), это не критическая ошибка, просто вернем null.
      if (error instanceof HttpError && error.status === 404) {
        return null;
      }
      // Все другие ошибки пробрасываем дальше.
      throw error;
    }
  },

  checkUsernameAvailability: async (username: string) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/username_available?username=${encodeURIComponent(username)}`;
    try {
      const { json } = await jsonClient(endpoint_url);
      return json as UsernameAvailabilityResult;
    } catch (error) {
      if (error instanceof HttpError) {
        return { available: false, error: error.body.error, errcode: error.body.errcode } as UsernameAvailabilityResult;
      }
      throw error;
    }
  },

  deactivateUser: async (id: Identifier) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/deactivate/${encodeURIComponent(returnMXID(id))}`;

    await jsonClient(endpoint_url, {
      method: "POST",
      body: JSON.stringify({}), // Пустое тело для деактивации без удаления
    });
  },

  makeRoomAdmin: async (roomId, userId, impersonateId) => {
    const base_url = localStorage.getItem("base_url");
    let endpoint_url = `${base_url}/_synapse/admin/v1/rooms/${encodeURIComponent(roomId)}/make_room_admin`;

    if (impersonateId) {
      endpoint_url += `?_user_id=${encodeURIComponent(impersonateId)}`;
    }

    try {
      const { json } = await jsonClient(endpoint_url, { method: "POST", body: JSON.stringify({ user_id: userId }) });
      return { success: true };
    } catch (error) {
      if (error instanceof HttpError) {
        return { success: false, error: error.body.error, errcode: error.body.errcode };
      }
      throw error;
    }
  },

  inviteUser: async (roomId, userId, impersonateId) => {
    const base_url = localStorage.getItem("base_url");
    let endpoint_url = `${base_url}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`;

    if (impersonateId) {
      endpoint_url += `?_user_id=${encodeURIComponent(impersonateId)}`;
    }

    return jsonClient(endpoint_url, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  getRoomsByCategory: async (category: string) => {
    const url = `${localStorage.getItem("base_url")}/_synapse/admin/v1/rooms_by_category?category=${category}`;
    const { json } = await fetchUtils.fetchJson(url, {
      method: "GET",
      headers: new Headers({ Authorization: `Bearer ${localStorage.getItem("access_token")}` }),
    });
    return json.rooms || [];
  },

  getHierarchyMembers: async (roomId: string) => {
    const base_url = localStorage.getItem("base_url");
    const endpoint_url = `${base_url}/_synapse/admin/v1/hierarchy_members/${encodeURIComponent(roomId)}`;
    try {
      const { json } = await jsonClient(endpoint_url);
      return { data: json.users || [] };
    } catch (error) {
      console.error(`Error getting hierarchy members for space ${roomId}:`, error);
      return { data: [] };
    }
  },

  joinRoom: async (roomId, userIdToJoin, adminImpersonatingId) => {
    const base_url = localStorage.getItem("base_url");
    let endpoint_url = `${base_url}/_synapse/admin/v1/join/${encodeURIComponent(roomId)}`;

    if (adminImpersonatingId) {
      endpoint_url += `?user_id=${encodeURIComponent(adminImpersonatingId)}`;
    }

    return jsonClient(endpoint_url, {
      method: "POST",
      body: JSON.stringify({ user_id: userIdToJoin }),
    });
  },

  getServerRunningProcess: async (etkeAdminUrl: string, burstCache = false): Promise<ServerProcessResponse> => {
    const locked_at = "";
    const command = "";

    let serverURL = `${etkeAdminUrl}/lock`;
    if (burstCache) {
      serverURL += `?time=${new Date().getTime()}`;
    }

    try {
      const response = await fetch(serverURL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        console.error(`Error getting server running process: ${response.status} ${response.statusText}`);
        return { locked_at, command };
      }
      const status = response.status;

      if (status === 200) {
        const json = await response.json();
        return json as { locked_at: string; command: string };
      }
      if (status === 204) {
        return { locked_at, command };
      }
    } catch (error) {
      console.error("Error getting server running process", error);
    }

    return { locked_at, command };
  },
  getServerStatus: async (etkeAdminUrl: string, burstCache = false): Promise<ServerStatusResponse> => {
    let serverURL = `${etkeAdminUrl}/status`;
    if (burstCache) {
      serverURL += `?time=${new Date().getTime()}`;
    }

    try {
      const response = await fetch(serverURL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        console.error(`Error getting server status: ${response.status} ${response.statusText}`);
        return { success: false, ok: false, host: "", results: [] };
      }

      const status = response.status;
      if (status === 200) {
        const json = await response.json();
        const result = { success: true, ...json } as ServerStatusResponse;
        return result;
      }
    } catch (error) {
      console.error("Error getting server status", error);
    }

    return { success: false, ok: false, host: "", results: [] };
  },
  getServerNotifications: async (
    serverNotificationsUrl: string,
    burstCache = false
  ): Promise<ServerNotificationsResponse> => {
    let serverURL = `${serverNotificationsUrl}/notifications`;
    if (burstCache) {
      serverURL += `?time=${new Date().getTime()}`;
    }

    try {
      const response = await fetch(serverURL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        console.error(`Error getting server notifications: ${response.status} ${response.statusText}`);
        return { success: false, notifications: [] };
      }

      const status = response.status;
      if (status === 204) {
        return { success: true, notifications: [] };
      }

      if (status === 200) {
        const json = await response.json();
        const result = { success: true, notifications: json } as ServerNotificationsResponse;
        return result;
      }

      return { success: true, notifications: [] };
    } catch (error) {
      console.error("Error getting server notifications", error);
    }

    return { success: false, notifications: [] };
  },
  deleteServerNotifications: async (serverNotificationsUrl: string) => {
    try {
      const response = await fetch(`${serverNotificationsUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        method: "DELETE",
      });
      if (!response.ok) {
        console.error(`Error deleting server notifications: ${response.status} ${response.statusText}`);
        return { success: false };
      }

      const status = response.status;
      if (status === 204) {
        const result = { success: true };
        return result;
      }
    } catch (error) {
      console.error("Error deleting server notifications", error);
    }

    return { success: false };
  },
  getServerCommands: async (serverCommandsUrl: string) => {
    try {
      const response = await fetch(`${serverCommandsUrl}/commands`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        console.error(`Error fetching server commands: ${response.status} ${response.statusText}`);
        return {};
      }

      const status = response.status;

      if (status === 200) {
        const json = await response.json();
        return json as ServerCommandsResponse;
      }

      return {};
    } catch (error) {
      console.error("Error fetching server commands, error");
    }

    return {};
  },
  runServerCommand: async (serverCommandsUrl: string, command: string, additionalArgs: Record<string, any> = {}) => {
    const endpoint_url = `${serverCommandsUrl}/commands`;
    const body = {
      command: command,
      ...additionalArgs,
    };
    const response = await fetch(endpoint_url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    if (!response.ok) {
      console.error(`Error running server command: ${response.status} ${response.statusText}`);
      return {
        success: false,
      };
    }

    const status = response.status;

    if (status === 204) {
      return {
        success: true,
      };
    }

    return {
      success: false,
    };
  },
  getScheduledCommands: async (scheduledCommandsUrl: string) => {
    try {
      const response = await fetch(`${scheduledCommandsUrl}/schedules`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        console.error(`Error fetching scheduled commands: ${response.status} ${response.statusText}`);
        return [];
      }

      const status = response.status;

      if (status === 200) {
        const json = await response.json();
        return json as ScheduledCommand[];
      }

      return [];
    } catch (error) {
      console.error("Error fetching scheduled commands, error");
    }
    return [];
  },
  getRecurringCommands: async (recurringCommandsUrl: string) => {
    try {
      const response = await fetch(`${recurringCommandsUrl}/recurrings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        console.error(`Error fetching recurring commands: ${response.status} ${response.statusText}`);
        return [];
      }

      const status = response.status;

      if (status === 200) {
        const json = await response.json();
        return json as RecurringCommand[];
      }

      return [];
    } catch (error) {
      console.error("Error fetching recurring commands, error");
    }
    return [];
  },
  createScheduledCommand: async (scheduledCommandsUrl: string, command: Partial<ScheduledCommand>) => {
    try {
      const response = await fetch(`${scheduledCommandsUrl}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        console.error(`Error creating scheduled command: ${response.status} ${response.statusText}`);
        throw new Error("Failed to create scheduled command");
      }

      if (response.status === 204) {
        return command as ScheduledCommand;
      }

      const json = await response.json();
      return json as ScheduledCommand;
    } catch (error) {
      console.error("Error creating scheduled command", error);
      throw error;
    }
  },
  updateScheduledCommand: async (scheduledCommandsUrl: string, command: ScheduledCommand) => {
    try {
      const response = await fetch(`${scheduledCommandsUrl}/schedules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const jsonErr = JSON.parse(await response.text());
        console.error(`Error updating scheduled command: ${response.status} ${response.statusText}`);
        throw new Error(jsonErr.error);
      }

      if (response.status === 204) {
        return command;
      }

      const json = await response.json();
      console.log("JSON", json);
      return json as ScheduledCommand;
    } catch (error) {
      console.error("Error updating scheduled command", error);
      throw error;
    }
  },
  deleteScheduledCommand: async (scheduledCommandsUrl: string, id: string) => {
    try {
      const response = await fetch(`${scheduledCommandsUrl}/schedules/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        console.error(`Error deleting scheduled command: ${response.status} ${response.statusText}`);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting scheduled command", error);
      return { success: false };
    }
  },
  createRecurringCommand: async (recurringCommandsUrl: string, command: Partial<RecurringCommand>) => {
    try {
      const response = await fetch(`${recurringCommandsUrl}/recurrings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        console.error(`Error creating recurring command: ${response.status} ${response.statusText}`);
        throw new Error("Failed to create recurring command");
      }

      if (response.status === 204) {
        return command as RecurringCommand;
      }

      const json = await response.json();
      return json as RecurringCommand;
    } catch (error) {
      console.error("Error creating recurring command", error);
      throw error;
    }
  },
  updateRecurringCommand: async (recurringCommandsUrl: string, command: RecurringCommand) => {
    try {
      const response = await fetch(`${recurringCommandsUrl}/recurrings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        console.error(`Error updating recurring command: ${response.status} ${response.statusText}`);
        throw new Error("Failed to update recurring command");
      }

      if (response.status === 204) {
        return command as RecurringCommand;
      }

      const json = await response.json();
      return json as RecurringCommand;
    } catch (error) {
      console.error("Error updating recurring command", error);
      throw error;
    }
  },
  deleteRecurringCommand: async (recurringCommandsUrl: string, id: string) => {
    try {
      const response = await fetch(`${recurringCommandsUrl}/recurrings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (!response.ok) {
        console.error(`Error deleting recurring command: ${response.status} ${response.statusText}`);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting recurring command", error);
      return { success: false };
    }
  },
  sendStateEvent: async (roomId, eventType, stateKey, content, impersonateId) => {
    const base_url = localStorage.getItem("base_url");
    let endpoint_url = `${base_url}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/state/${encodeURIComponent(eventType)}/${encodeURIComponent(stateKey)}`;

    if (impersonateId) {
      endpoint_url += `?_user_id=${encodeURIComponent(impersonateId)}`;
    }

    return jsonClient(endpoint_url, {
      method: "PUT",
      body: JSON.stringify(content),
    });
  },

  // <<< НАЧАЛО: ДОБАВЬТЕ ЭТОТ КОД >>>
  // Реализация нашего нового кастомного метода
  addSubscriberAdmin: async params => {
    const { spaceId, userId } = params;
    const base_url = localStorage.getItem("base_url");
    // Убедитесь, что этот эндпоинт (`/v2/`) соответствует тому, что вы создали на бэкенде
    const endpoint_url = `${base_url}/_synapse/admin/v2/spaces/${encodeURIComponent(spaceId)}/subscriber_admins`;

    console.log(`Calling addSubscriberAdmin for user ${userId} in space ${spaceId}`);

    // Используем jsonClient для автоматического добавления токена авторизации
    // и обработки ошибок.
    return jsonClient(endpoint_url, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }).then(({ json }) => json); // Возвращаем результат запроса
  },
  // <<< КОНЕЦ: ДОБАВЬТЕ ЭТОТ КОД >>>
};

const dataProvider = withLifecycleCallbacks(baseDataProvider, [
  {
    resource: "users",
    beforeUpdate: async (params: UpdateParams<any>, dataProvider: DataProvider) => {
      const avatarFile = params.data.avatar_file?.rawFile;
      const avatarErase = params.data.avatar_erase;
      const rates = params.data.rates;

      if (rates) {
        await dataProvider.setRateLimits(params.id, rates);
        delete params.data.rates;
      }

      if (avatarErase) {
        params.data.avatar_url = "";
        return params;
      }

      if (avatarFile instanceof File) {
        const response = await dataProvider.uploadMedia({
          file: avatarFile,
          filename: params.data.avatar_file.title,
          content_type: params.data.avatar_file.rawFile.type,
        });
        params.data.avatar_url = response.content_uri;
      }
      return params;
    },
    beforeDelete: async (params: DeleteParams<any>, dataProvider: DataProvider) => {
      if (params.meta?.deleteMedia) {
        const base_url = localStorage.getItem("base_url");
        const endpoint_url = `${base_url}/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(params.id))}/media`;
        await jsonClient(endpoint_url, { method: "DELETE" });
      }

      if (params.meta?.redactEvents) {
        const base_url = localStorage.getItem("base_url");
        const endpoint_url = `${base_url}/_synapse/admin/v1/user/${encodeURIComponent(returnMXID(params.id))}/redact`;
        await jsonClient(endpoint_url, { method: "POST", body: JSON.stringify({ rooms: [] }) });
      }

      return params;
    },
    beforeDeleteMany: async (params: DeleteManyParams<any>, dataProvider: DataProvider) => {
      await Promise.all(
        params.ids.map(async id => {
          if (params.meta?.deleteMedia) {
            const base_url = localStorage.getItem("base_url");
            const endpoint_url = `${base_url}/_synapse/admin/v1/users/${encodeURIComponent(returnMXID(id))}/media`;
            await jsonClient(endpoint_url, { method: "DELETE" });
          }

          if (params.meta?.redactEvents) {
            const base_url = localStorage.getItem("base_url");
            const endpoint_url = `${base_url}/_synapse/admin/v1/user/${encodeURIComponent(returnMXID(id))}/redact`;
            await jsonClient(endpoint_url, { method: "POST", body: JSON.stringify({ rooms: [] }) });
          }
        })
      );
      return params;
    },

    // --- ИЗМЕНЕНИЕ: ДОБАВЛЕН ОБРАБОТЧИК AFTERCREATE ---
    /**
     * Этот обработчик запускается автоматически после успешного создания пользователя.
     * Он немедленно отправляет второй запрос для деактивации только что созданной учетной записи.
     */
    afterCreate: async (result, dataProvider) => {
      console.log("Пользователь успешно создан. Запускаю немедленную деактивацию.");

      // 1. Получаем ID только что созданного пользователя из результата операции create
      const newUser = result.data;
      const userId = newUser.id;

      if (!userId) {
        console.error("Не удалось получить ID нового пользователя, деактивация отменена.");
        return result; // Возвращаем исходный результат, чтобы не сломать UI
      }

      // 2. Формируем URL для эндпоинта деактивации
      const base_url = localStorage.getItem("base_url");
      const endpoint_url = `${base_url}/_synapse/admin/v1/deactivate/${encodeURIComponent(userId)}`;

      try {
        // 3. Отправляем запрос на деактивацию
        await jsonClient(endpoint_url, {
          method: "POST",
          body: JSON.stringify({}), // Пустое тело для деактивации без удаления
        });
        console.log(`Пользователь ${userId} успешно деактивирован.`);
      } catch (error) {
        console.error(`Произошла ошибка при автоматической деактивации пользователя ${userId}:`, error);
        // Не пробрасываем ошибку дальше, чтобы UI не показывал ошибку "деактивации",
        // так как основная операция "создания" прошла успешно.
      }

      // 4. Возвращаем оригинальный результат операции `create`
      return result;
    },
  },
]);

export default dataProvider;
