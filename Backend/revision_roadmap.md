# 🎯 Full-Stack Video Platform — Interview Revision Roadmap

> **Project Name:** Doratube (Full-Stack Video Platform)  
> **Tech Stack:** Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt, Cloudinary, Multer  
> **Architecture:** MVC (Model → Controller → Route) with utility & middleware layers

---

## 📋 Revision Order (Follow This Sequence)

---

### Phase 1: Project Foundation & Setup

#### 1.1 — Project Initialization & ES Modules
- **What:** The project uses `"type": "module"` in [package.json](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/package.json) → enables `import/export` syntax instead of `require()`
- **Why it matters:** Modern JavaScript, interviewers ask about CommonJS vs ES Modules
- **Revise:** 
  - Difference between `require()` (CommonJS) and `import` (ES Modules)
  - Why `"type": "module"` is needed in [package.json](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/package.json)

#### 1.2 — Environment Variables (`dotenv`)
- **What:** `import "dotenv/config"` loads [.env](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/.env) variables into `process.env`
- **Why it's first:** Must load BEFORE any other module reads env variables
- **Key variables:** `PORT`, `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `CLOUDINARY_*` credentials
- **Revise:**
  - Why env variables exist (security — never commit secrets to Git)
  - The [.env](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/.env) → `process.env` flow

#### 1.3 — Express App Configuration ([app.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/app.js))
- **Middlewares applied in order:**

| Middleware | Purpose |
|---|---|
| `cors({ origin, credentials })` | Allow cross-origin requests from frontend |
| `express.json({ limit: "16kb" })` | Parse JSON request bodies |
| `express.urlencoded({ extended: true })` | Parse form-encoded data |
| `express.static("public")` | Serve static files (uploaded temp files) |
| `cookieParser()` | Parse cookies from requests (needed for JWT tokens) |

- **Revise:**
  - What CORS is and why `credentials: true` is needed
  - Middleware execution order in Express (top to bottom)
  - What `extended: true` means in URL-encoded parsing

---

### Phase 2: Database Layer

#### 2.1 — MongoDB Connection ([db/index.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/db/index.js))
- **Pattern:** Async connection with **fail-fast** → `process.exit(1)` if DB fails
- **Connection string:** `${MONGODB_URI}/${DB_NAME}` where `DB_NAME = "Doratube"`
- **Startup flow:** [connectDB()](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/db/index.js#53-86) → `.then(() => app.listen())` → server starts ONLY after DB connects
- **Revise:**
  - Why fail-fast is important (don't serve requests without a database)
  - `process.exit(1)` — exit code 1 = abnormal termination
  - Mongoose `.connect()` returns a connection instance

#### 2.2 — Mongoose Schemas & Models

##### User Model ([user.model.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/user.model.js))
| Field | Type | Notes |
|---|---|---|
| `username` | String | unique, lowercase, **indexed** |
| `email` | String | unique, lowercase |
| `fullname` | String | **indexed** |
| `avatar` | String | Cloudinary URL, **required** |
| `coverImage` | String | Optional Cloudinary URL |
| `watchHistory` | ObjectId[] | References `Video` model |
| `password` | String | Hashed via bcrypt |
| `refreshToken` | String | Stored for token rotation |

**Key techniques in User Model:**
1. **Pre-save Hook** — `userSchema.pre("save")` hashes password with `bcrypt.hash(password, 10)` before saving
   - `isModified("password")` check prevents re-hashing on non-password updates
2. **Instance Methods:**
   - [isPasswordCorrect(password)](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/user.model.js#68-74) → `bcrypt.compare()` to verify login
   - [generateAccessToken()](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/user.model.js#75-92) → JWT with `{ _id, email, username, fullName }`, expires in 1 day
   - [generateRefreshToken()](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/user.model.js#93-107) → JWT with `{ _id }` only, expires in 10 days

##### Video Model ([video.model.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/video.model.js))
- Fields: `videoFile`, `thumbnail`, `title`, `describtion`, `duration`, `view` (default 0), `isPublished`, `owner` (ref: User)
- **Plugin:** `mongoose-aggregate-paginate-v2` for paginated queries
- **Revise:** What aggregation pipelines are and why pagination matters for large datasets

##### Subscription Model ([subscription.model.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/models/subscription.model.js))
- Simple join table: `subscriber` (User) → `channel` (User)
- Both fields reference the `User` model
- **Revise:** This is a **self-referencing relationship** — one User subscribes to another User

---

### Phase 3: Utility Layer (Interview Favorites ⭐)

#### 3.1 — Custom Error Handling ([ApiError.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiError.js))
```
class ApiError extends Error {
    constructor(statusCode, message, errors, stack)
}
```
- Extends native [Error](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiError.js#1-22) class → custom error with `statusCode`, `success: false`, `errors[]`
- Uses `Error.captureStackTrace()` for clean stack traces
- **Revise:** Class inheritance in JS, `extends`, `super()`, why custom errors matter

#### 3.2 — Standardized API Response ([ApiResponse.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiResponse.js))
```
class ApiResponse {
    constructor(statusCode, data, message)
    // success = statusCode < 400 (auto-calculated)
}
```
- Ensures **consistent response format** across all endpoints
- **Revise:** Why standardized responses matter (frontend can expect same shape)

#### 3.3 — Async Handler Wrapper ([asyncHandler.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/asyncHandler.js))
```js
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err))
}
```
- **Higher-Order Function** — takes a function, returns a function
- Wraps async route handlers to automatically catch errors → no need for try/catch in every controller
- Passes errors to Express error-handling middleware via `next(err)`
- **Revise:** HOFs, Promise.resolve(), Express error propagation with `next()`

#### 3.4 — Cloudinary Upload Utility ([cloudinary.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/cloudinary.js))
- **Flow:** Local file path → upload to Cloudinary → return response (URL) → delete local file on failure
- `resource_type: "auto"` → auto-detects image/video/raw
- Uses `fs.unlink()` to clean up temp files on error
- **Revise:** File upload lifecycle: Client → Multer (temp disk) → Cloudinary (cloud) → cleanup

---

### Phase 4: Middleware Layer

#### 4.1 — Multer File Upload ([multer.middlewares.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/middlewares/multer.middlewares.js))
- **Storage:** `multer.diskStorage()` → saves to `./public/temp`
- **Filename:** Uses `file.originalname` (notes about collision issues in comments)
- **Usage:** `upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }])`
- **Revise:**
  - `multipart/form-data` vs `application/json`
  - `upload.single()` vs `upload.array()` vs `upload.fields()`
  - Why temp storage before cloud upload (validation, fallback)

#### 4.2 — JWT Auth Middleware ([auth.middlewares.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/middlewares/auth.middlewares.js))
```
Token extraction → jwt.verify() → User.findById() → req.user = user → next()
```
- Extracts token from: **cookies** OR **Authorization header** (`Bearer <token>`)
- Verifies against `ACCESS_TOKEN_SECRET`
- Attaches user to `req.user` (excluding password & refreshToken)
- **Revise:** How middleware protects routes, `next()` function, token extraction strategies

---

### Phase 5: Controllers & Business Logic

#### 5.1 — Token Generation Helper
```
generateAccessAndRefreshToken(userId)
```
- Finds user → generates both tokens → saves refreshToken to DB → returns both
- `user.save({ validateBeforeSave: false })` — skips validation (only updating token)

#### 5.2 — User Registration Flow
1. Extract `{ fullname, email, username, password }` from `req.body`
2. Validate all fields are non-empty (using `.some()` + `.trim()`)
3. Check duplicate user: `User.findOne({ $or: [{ username }, { email }] })`
4. Get file paths: `req.files?.avatar?.[0]?.path`
5. Upload avatar & coverImage to Cloudinary
6. Create user in DB
7. Fetch created user WITHOUT password/refreshToken: `.select("-password -refreshToken")`
8. Return `ApiResponse(201, user, "User Registered Successfully")`

**Revise:** `$or` operator, `.select()` for field exclusion, file handling with Multer

#### 5.3 — Login Flow
1. Get credentials from body → validate username/email exists
2. Find user with `$or` query
3. Verify password: `user.isPasswordCorrect(password)`
4. Generate access + refresh tokens
5. Set **HTTP-only secure cookies**: `{ httpOnly: true, secure: true }`
6. Return user data + both tokens

**Revise:** Why `httpOnly` cookies (prevent XSS attacks), `secure` flag (HTTPS only)

#### 5.4 — Logout Flow
1. Protected route (requires `verifyJwt` middleware)
2. `User.findByIdAndUpdate()` → set `refreshToken: undefined`
3. Clear both cookies with `.clearCookie()`
4. **Revise:** `$set` operator, why clearing both cookie + DB token is important

#### 5.5 — Refresh Token Rotation
1. Get refresh token from cookies or body
2. `jwt.verify()` with `REFRESH_TOKEN_SECRET`
3. Find user → compare stored token with incoming token
4. Generate new pair of tokens → return with new cookies
- **Revise:** Why refresh tokens exist, token rotation security pattern, sliding sessions

#### 5.6 — Other Endpoints
- `changePassword` — verify old password → set new → save (triggers pre-save hook for hashing)
- `getCurrentUser` — simply returns `req.user` from auth middleware
- `updateAccountDetails` — `findByIdAndUpdate` with `$set`
- `updateUserAvatar` / `updateUserCoverAvatar` — single file upload → Cloudinary → update DB

---

### Phase 6: Routes & API Versioning

#### 6.1 — Route Setup ([user.routes.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/routes/user.routes.js))

| Method | Endpoint | Middleware | Controller |
|---|---|---|---|
| POST | `/api/v1/user/register` | `upload.fields()` | `registerUser` |
| POST | `/api/v1/user/login` | — | `loginUser` |
| POST | `/api/v1/user/logout` | `verifyJwt` | `logOutUser` |
| POST | `/api/v1/user/refresh-token` | — | `refreshAccessToken` |

- **API Versioning:** `/api/v1/` prefix allows future breaking changes in `/api/v2/`
- **Revise:** Express Router, route mounting with `app.use()`, middleware chaining

---

### Phase 7: Key Concepts to Revise for Interview

> [!IMPORTANT]
> These are the most commonly asked topics from this project. Master these!

| # | Topic | Where in Code |
|---|---|---|
| 1 | **JWT (Access + Refresh Tokens)** | `user.model.js`, `auth.middlewares.js`, `user.controller.js` |
| 2 | **bcrypt Password Hashing** | `user.model.js` (pre-save hook + instance method) |
| 3 | **Mongoose Pre-save Hooks** | `user.model.js` line 63 |
| 4 | **Multer File Upload** | `multer.middlewares.js` (diskStorage config) |
| 5 | **Cloudinary Integration** | `cloudinary.js` (upload + cleanup pattern) |
| 6 | **Express Middleware** | `app.js` (global) + `auth.middlewares.js` (route-level) |
| 7 | **Higher-Order Functions** | `asyncHandler.js` |
| 8 | **Custom Error/Response Classes** | `ApiError.js`, `ApiResponse.js` (OOP in JS) |
| 9 | **MongoDB `$or` / `$set` Operators** | `user.controller.js` (findOne, findByIdAndUpdate) |
| 10 | **HTTP-only Secure Cookies** | `user.controller.js` (login/logout) |
| 11 | **CORS Configuration** | `app.js` |
| 12 | **Aggregation + Pagination** | `video.model.js` (plugin) |
| 13 | **Self-referencing Relationships** | `subscription.model.js` (User → User) |
| 14 | **Fail-fast DB Pattern** | `db/index.js` (process.exit) |

---

### Phase 8: Architecture Diagram (Explain This Flow)

```
Client Request
     │
     ▼
┌─────────────────────────────────────────────┐
│  Express App (app.js)                       │
│  ┌─────────┐ ┌──────┐ ┌──────────────────┐ │
│  │  CORS   │→│ JSON │→│ Cookie Parser    │ │
│  └─────────┘ └──────┘ └──────────────────┘ │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Routes (user.routes.js)                    │
│  /api/v1/user/register → multer → controller│
│  /api/v1/user/logout   → verifyJwt → ctrl  │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Controllers (user.controller.js)           │
│  Uses: asyncHandler, ApiError, ApiResponse  │
│  Calls: Cloudinary upload, User model       │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  Models (Mongoose Schemas)                  │
│  User ←→ Video ←→ Subscription             │
│  Pre-save hooks, Instance methods           │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│  MongoDB Atlas (Cloud Database)             │
│  Database: "Doratube"                       │
└─────────────────────────────────────────────┘
```

---

### ⏱️ Suggested Revision Timeline

| Day | Focus | Time |
|---|---|---|
| **Day 1** | Phase 1 + 2 (Setup, DB, Models) | 2–3 hours |
| **Day 2** | Phase 3 + 4 (Utils + Middleware) | 2 hours |
| **Day 3** | Phase 5 + 6 (Controllers + Routes) | 3 hours |
| **Day 4** | Phase 7 (Interview Q&A practice) | 2 hours |
| **Day 5** | Full walkthrough + mock explanation | 1–2 hours |
