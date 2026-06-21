# Backend Spec: 3D Cat Avatar Generation

> Project: PetHero FastAPI backend  
> Date: 2026-06-20  
> Frontend counterpart: `docs/design-request-3d-cat-avatar.md`

---

## Goal

Add backend endpoints that generate a rigged, animated 3D avatar from a pet photo using the Meshy AI API, store the result, and expose it to the React Native app.

---

## Meshy AI pipeline

Use the official Meshy REST API (`https://api.meshy.ai/openapi/v1/`).

### 1. Image to 3D

```http
POST https://api.meshy.ai/openapi/v1/image-to-3d
Authorization: Bearer {MESHY_API_KEY}
Content-Type: application/json

{
  "image_url": "{publicly_accessible_photo_url}",
  "ai_model": "latest",
  "should_texture": true,
  "enable_pbr": true,
  "should_remesh": true,
  "target_polycount": 30000,
  "topology": "triangle",
  "pose_mode": "",
  "target_formats": ["glb"],
  "alpha_thumbnail": false,
  "multi_view_thumbnails": false
}
```

Response:

```json
{ "result": "{task_id}" }
```

Poll until `status` is `SUCCEEDED`:

```http
GET https://api.meshy.ai/openapi/v1/image-to-3d/{task_id}
```

Use `model_urls.glb` as the generated mesh URL.

### 2. Rigging

```http
POST https://api.meshy.ai/openapi/v1/rigging
Authorization: Bearer {MESHY_API_KEY}
Content-Type: application/json

{
  "model_url": "{glb_url_from_step_1}",
  "height_meters": 0.25
}
```

Poll until `status` is `SUCCEEDED`. Use `rigged_character_glb_url`.

**Note:** Meshy’s API docs officially target humanoids, but marketing materials claim quadruped support. Validate with a real cat test and fall back to a static (non-rigged) GLB if rigging fails.

### 3. Animation

```http
POST https://api.meshy.ai/openapi/v1/animations
Authorization: Bearer {MESHY_API_KEY}
Content-Type: application/json

{
  "rig_task_id": "{rig_task_id}",
  "action_id": 92
}
```

Pick an action ID suitable for quadruped idle/walk. Poll until `status` is `SUCCEEDED`. Use `animation_glb_url`.

---

## Data model additions

```python
class PetAvatarStatus(str, Enum):
    pending = "pending"
    generating = "generating"
    succeeded = "succeeded"
    failed = "failed"

class PetAvatar(BaseModel):
    task_id: str
    status: PetAvatarStatus
    progress: int  # 0-100
    glb_url: str | None
    thumbnail_url: str | None
    last_error: str | None
    updated_at: datetime

class PetStats(BaseModel):
    hunger: int = 70        # 0-100
    hydration: int = 60     # 0-100
    health: int = 90        # 0-100
    happiness: int = 75     # 0-100
    looks: int = 45         # 0-100
    level: int = 1
    xp: int = 0
    xp_to_next: int = 500
    streak_days: int = 0
    rating: int = 0
    tier: str = "Bronze"

class Pet(BaseModel):
    # ... existing fields
    avatar: PetAvatar | None = None
    stats: PetStats | None = None
```

---

## API endpoints

### Start avatar generation

```http
POST /pets/{pet_id}/avatar
```

Body (optional):

```json
{ "photo_url": "https://..." }
```

If `photo_url` is omitted, use the pet’s existing `photo_ref`.

Behavior:

1. Create a `PetAvatar` record with `status: "generating"`, `progress: 0`.
2. Start the Meshy `image-to-3d` task asynchronously.
3. Return the initial avatar record immediately.

Response:

```json
{
  "avatar": {
    "task_id": "meshy-task-id",
    "status": "generating",
    "progress": 0,
    "glb_url": null,
    "thumbnail_url": null,
    "last_error": null,
    "updated_at": "2026-06-20T17:53:19Z"
  }
}
```

### Get avatar status

```http
GET /pets/{pet_id}/avatar
```

Returns the latest avatar record. If generation is still running, the backend can either return the cached progress or poll Meshy briefly and update.

### Delete avatar

```http
DELETE /pets/{pet_id}/avatar
```

Removes the avatar record.

---

## Async processing strategy

Option A — **Background worker** (recommended):

- Use Celery, RQ, or FastAPI background tasks.
- Store task state in Redis/DB.
- Frontend polls `GET /pets/{pet_id}/avatar`.

Option B — **SSE push**:

- `GET /pets/{pet_id}/avatar/stream` streams progress events.
- More real-time but harder on mobile networks.

For v1, recommend **Option A with polling**.

---

## Stats computation (v1 suggestion)

Compute `PetStats` from the activity log:

- `hunger`: decays over time since last feed; +20 after feeding.
- `hydration`: decays since last water; +20 after water.
- `health`: baseline 100; drops if medication is overdue.
- `happiness`: average of hunger/hydration/health plus streak bonus.
- `looks`: increases with streaks and successful avatar generation; decays slowly.
- `rating`: `looks * 10 + level * 100 + streak_days * 50`.
- `tier`: Bronze / Silver / Gold / Platinum / Legendary based on rating.

---

## Environment variables

```bash
MESHY_API_KEY=your_key_here
MESHY_WEBHOOK_SECRET=optional_secret_for_callbacks
```

---

## Error handling

- If Meshy returns `402 Payment Required`, surface as "generation quota exceeded".
- If rigging fails for a cat, fall back to the static GLB from step 1 and mark `last_error`.
- If any step times out, retry once, then mark `failed`.

---

## Open questions

- Should the backend cache generated GLB files locally or rely on Meshy signed URLs?
- Should we pre-generate avatars for seed pets?
- Which animation action IDs work best for cats?
