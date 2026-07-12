import type { Asset, TheaterOperation } from "./mission.ts";

const REF_LAT = 48.1374;
const REF_LON = 11.5755;
const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LON = 71_100; // approximate at 48°N

function localPoint(northM: number, eastM: number) {
  return {
    lat: REF_LAT + northM / M_PER_DEG_LAT,
    lon: REF_LON + eastM / M_PER_DEG_LON,
  };
}

export const escortWaypoints = [
  { id: "dock", ...localPoint(0, 0) },
  { id: "wp-1", ...localPoint(2, 0) },
  { id: "wp-2", ...localPoint(4, 1) },
  { id: "wp-3", ...localPoint(6, 0) },
  { id: "wp-4", ...localPoint(8, -1) },
  { id: "checkpoint", ...localPoint(10, 0) },
];

export const escortAssets: Asset[] = [
  {
    id: "crawler-01",
    name: "Pi Crawler",
    kind: "robot",
    role: "payload",
    status: "idle",
    ...localPoint(0, 0),
    heading: 0,
    speed: 0,
    batteryPct: 88,
    isSimulated: true,
  },
  {
    id: "quad-01",
    name: "Quadruped Scout",
    kind: "robot",
    role: "scout",
    status: "idle",
    ...localPoint(0, 1.5),
    heading: 0,
    speed: 0,
    batteryPct: 92,
    isSimulated: true,
  },
  {
    id: "arm-01",
    name: "Checkpoint Arm",
    kind: "robot",
    role: "checkpoint",
    status: "idle",
    ...localPoint(10, 0.5),
    heading: 270,
    speed: 0,
    batteryPct: 100,
    isSimulated: true,
  },
];

export const escortOperation: TheaterOperation = {
  id: "op-edth-relay-run",
  name: "EDTH — Relay Run",
  active: true,
  status: "active",
  missions: [
    {
      id: "msn-payload-escort",
      name: "Escort medical payload to Checkpoint Bravo",
      active: true,
      status: "active",
      type: "payload_escort",
      assignedAssetIds: escortAssets.map((a) => a.id),
      route: escortWaypoints,
      payload: {
        id: "payload-med-01",
        label: "Medical supplies",
        status: "in_transit",
        currentWaypointIndex: 0,
        carrierAssetId: "crawler-01",
      },
      autonomyPolicy: {
        confirmConfidence: 0.75,
        scoutDispatchConfidence: 0.65,
        corridorWidthM: 2,
        llmAutoApprove: false,
      },
      zones: [
        {
          id: "zone-corridor",
          name: "Route corridor",
          type: "route_corridor",
          affiliation: "friendly",
          status: "active",
          ring: [
            localPoint(0, -1),
            localPoint(10, -1),
            localPoint(10, 1),
            localPoint(0, 1),
            localPoint(0, -1),
          ].map((p) => [p.lon, p.lat] as [number, number]),
          label: "Corridor",
        },
        {
          id: "zone-no-go",
          name: "No-go area",
          type: "no_go_area",
          affiliation: "hostile",
          status: "active",
          ring: [
            localPoint(5, -2.5),
            localPoint(7, -2.5),
            localPoint(7, -1.5),
            localPoint(5, -1.5),
            localPoint(5, -2.5),
          ].map((p) => [p.lon, p.lat] as [number, number]),
          label: "NO-GO",
        },
        {
          id: "zone-destination",
          name: "Checkpoint Bravo",
          type: "objective",
          affiliation: "friendly",
          status: "active",
          ring: [
            localPoint(9.5, -1),
            localPoint(10.5, -1),
            localPoint(10.5, 1),
            localPoint(9.5, 1),
            localPoint(9.5, -1),
          ].map((p) => [p.lon, p.lat] as [number, number]),
          label: "Checkpoint B",
        },
      ],
      objectives: [
        {
          id: "obj-clear-route",
          label: "Clear route corridor",
          status: "active",
          targets: [],
        },
        {
          id: "obj-hold-checkpoint",
          label: "Hold destination checkpoint",
          status: "pending",
          targets: [],
        },
      ],
    },
  ],
};
