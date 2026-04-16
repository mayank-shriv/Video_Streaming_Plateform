# 📝 Doratube — Interview Notes & Build Guide

---

## Part A: Step-by-Step Build Guide

> Follow these steps in order if you were building this project from scratch.

---

### Step 1: Initialize the Project

```bash
mkdir full-stack-video-platform && cd full-stack-video-platform
npm init -y
```

- Edit [package.json](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/package.json) → add `"type": "module"` (enables ES Module `import/export` syntax)
- Add dev script: `"dev": "nodemon src/index.js"`

**Install dependencies:**
```bash
npm install express mongoose dotenv cors cookie-parser bcrypt jsonwebtoken multer cloudinary
npm install -D nodemon prettier
```

| Package | Why |
|---|---|
| `express` | Web framework — handles routes, middleware, HTTP |
| `mongoose` | MongoDB ODM — schemas, validation, queries |
| `dotenv` | Load [.env](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/.env) variables into `process.env` |
| `cors` | Allow cross-origin requests from frontend |
| `cookie-parser` | Parse cookies from HTTP requests |
| `bcrypt` | Hash passwords (one-way encryption) |
| `jsonwebtoken` | Create & verify JWT tokens |
| `multer` | Handle file uploads (`multipart/form-data`) |
| `cloudinary` | Cloud storage for images/videos |
| `nodemon` | Auto-restart server on file changes (dev only) |

---

### Step 2: Create Folder Structure

```
src/
├── index.js          ← Entry point (dotenv + DB connect + server start)
├── app.js            ← Express app config (middlewares + routes)
├── constant.js       ← DB name constant
├── db/
│   └── index.js      ← MongoDB connection logic
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   └── subscription.model.js
├── controllers/
│   └── user.controller.js
├── routes/
│   └── user.routes.js
├── middlewares/
│   ├── auth.middlewares.js
│   └── multer.middlewares.js
├── utils/
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   └── cloudinary.js
public/
└── temp/             ← Multer saves uploads here temporarily
.env                  ← Secrets (never commit!)
```

> **Interview tip:** Explain this is a **layered MVC architecture** — Routes → Middleware → Controller → Model → Database

---

### Step 3: Setup Environment Variables ([.env](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/.env))

```env
PORT=3000
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
ACCESS_TOKEN_SECRET=<long-random-string>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<different-long-random-string>
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

> **Interview Q:** *Why two different secrets for access & refresh tokens?*  
> **A:** Separation of concerns. If access secret is compromised, refresh tokens remain safe. Different expiry times serve different security purposes.

---

### Step 4: Build the Utility Layer (Build These First!)

#### 4a. [asyncHandler.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/asyncHandler.js) — Error-catching wrapper
```js
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err))
}
```
- **What:** A Higher-Order Function (HOF) that wraps async controllers
- **Why:** Eliminates repetitive `try/catch` in every route handler
- **How:** `Promise.resolve()` converts any return value to a Promise, `.catch()` forwards errors to Express

#### 4b. [ApiError.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiError.js) — Custom error class
```js
class ApiError extends Error {
    constructor(statusCode, message, errors = [], stack) {
        super(message)
        this.statusCode = statusCode
        this.success = false
        this.error = errors
    }
}
```
- **What:** Extends JavaScript's native [Error](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiError.js#1-22) class
- **Why:** Standard errors don't have `statusCode` — we need HTTP status codes in API errors
- **Key:** `Error.captureStackTrace(this, this.constructor)` gives clean stack traces

#### 4c. [ApiResponse.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/ApiResponse.js) — Standardized response
```js
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400  // Auto-determines success/failure
    }
}
```
- **Why:** Every API endpoint returns the same shape → frontend can reliably parse responses

#### 4d. [cloudinary.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/utils/cloudinary.js) — Cloud file upload
```js
const uploadOnCloudinary = async (localPath) => {
    const response = await cloudinary.uploader.upload(localPath, {
        resource_type: "auto"  // auto-detect: image, video, or raw
    })
    return response  // Contains .url, .public_id, etc.
}
```
- **Flow:** Local temp file → Upload to Cloudinary → Return URL → Delete local file on failure
- **Cleanup:** `fs.unlink()` removes temp file if upload fails (prevents disk filling up)

---

### Step 5: Build the Database Connection

```js
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("MongoDB Connected:", conn.connection.host)
    } catch (error) {
        console.error("MongoDB connection error", error)
        process.exit(1)  // KILL the app — can't run without DB
    }
}
```

> **Interview Q:** *Why `process.exit(1)`?*  
> **A:** **Fail-fast pattern** — exit code `1` means abnormal termination. The app is useless without a database, so we stop immediately instead of serving broken requests. Process managers (PM2, Docker) can auto-restart it.

---

### Step 6: Build the Models (Mongoose Schemas)

#### 6a. User Model — The most complex one

**Schema fields:** `username`, `email`, `fullname`, `avatar`, `coverImage`, `watchHistory`, `password`, `refreshToken`

**Three key techniques:**

**① Pre-save Hook (Middleware):**
```js
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return  // Skip if password didn't change
    this.password = await bcrypt.hash(this.password, 10)  // 10 salt rounds
})
```
> **Interview Q:** *Why check `isModified("password")`?*  
> **A:** Without it, the password re-hashes every time ANY field is updated (e.g., changing avatar would double-hash the password, making it unverifiable).

> **Interview Q:** *Why use `function()` instead of arrow function?*  
> **A:** Arrow functions don't have their own `this`. In Mongoose hooks, `this` refers to the document being saved — arrow functions would lose that context.

**② Instance Method — Password Verification:**
```js
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
```
> **Interview Q:** *What is bcrypt.compare doing?*  
> **A:** bcrypt extracts the salt from the stored hash, re-hashes the input password with that same salt, and compares. It NEVER decrypts — bcrypt is one-way.

**③ Instance Methods — JWT Token Generation:**
```js
// Access Token: short-lived (1d), contains user details
generateAccessToken() → jwt.sign({ _id, email, username, fullName }, SECRET, { expiresIn: "1d" })

// Refresh Token: long-lived (10d), contains only _id
generateRefreshToken() → jwt.sign({ _id }, REFRESH_SECRET, { expiresIn: "10d" })
```
> **Interview Q:** *Why does access token have more data than refresh token?*  
> **A:** Access token is used for authorization — the server needs user info without DB queries. Refresh token only needs `_id` to look up the user and issue a new access token.

#### 6b. Video Model
- Uses `mongoose-aggregate-paginate-v2` plugin for paginated aggregation queries
- `owner` field references `User` via `Schema.Types.ObjectId` + `ref: "User"`

#### 6c. Subscription Model
- **Self-referencing join table:** Both `subscriber` and `channel` reference `User`
- To count subscribers: `Subscription.countDocuments({ channel: userId })`
- To check if subscribed: `Subscription.findOne({ subscriber: myId, channel: theirId })`

---

### Step 7: Build Middlewares

#### 7a. Multer — File Upload Middleware
```js
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./public/temp"),
    filename: (req, file, cb) => cb(null, file.originalname)
})
export const upload = multer({ storage })
```

**Usage patterns:**
| Method | Use Case |
|---|---|
| `upload.single("avatar")` | One file, one field |
| `upload.array("photos", 5)` | Multiple files, one field |
| `upload.fields([{name:"avatar"}, {name:"cover"}])` | Multiple files, multiple fields |

**After middleware:** Files accessible via `req.file` (single) or `req.files` (fields/array)

#### 7b. Auth Middleware — JWT Verification
```js
export const verifyJwt = asyncHandler(async (req, _res, next) => {
    // 1. Extract token from cookies OR Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
    // 2. Verify token signature & expiry
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    // 3. Find user, exclude sensitive fields
    const user = await User.findById(decoded._id).select("-password -refreshToken")
    
    // 4. Attach user to request object
    req.user = user
    next()  // Pass control to next middleware/controller
})
```

> **Interview Q:** *Why check both cookies and Authorization header?*  
> **A:** Cookies work for browser clients (web app). Authorization header works for mobile apps and API clients (Postman, etc.). Supporting both makes the API flexible.

---

### Step 8: Build Controllers

#### 8a. Register User — Full Flow
```
1. Destructure { fullname, email, username, password } from req.body
2. Validate: all fields non-empty using .some() + .trim()
3. Check duplicates: User.findOne({ $or: [{ username }, { email }] })
4. Get file paths: req.files?.avatar?.[0]?.path
5. Upload to Cloudinary: uploadOnCloudinary(avatarLocalPath)
6. Create user: User.create({ ... })  ← triggers pre-save hook (password hashing)
7. Fetch without secrets: User.findById(id).select("-password -refreshToken")
8. Return: new ApiResponse(201, createdUser, "User Registered Successfully")
```

#### 8b. Login User — Full Flow
```
1. Get { username, email, password } from req.body
2. Find user: User.findOne({ $or: [{ username }, { email }] })
3. Verify password: user.isPasswordCorrect(password)
4. Generate tokens: generateAccessAndRefreshToken(user._id)
   └── Creates both tokens, saves refreshToken to DB
5. Set cookies: httpOnly: true, secure: true
6. Return: user data + accessToken + refreshToken
```

> **Interview Q:** *Why `httpOnly: true`?*  
> **A:** Prevents JavaScript from accessing the cookie (`document.cookie` won't see it). Protects against **XSS** (Cross-Site Scripting) attacks — even if an attacker injects JS, they can't steal the token.

> **Interview Q:** *Why `secure: true`?*  
> **A:** Cookie is only sent over **HTTPS** connections — prevents **MITM** (Man-in-the-Middle) attacks from intercepting the token over unencrypted HTTP.

#### 8c. Logout User
```
1. (Protected route — verifyJwt runs first, sets req.user)
2. Clear refreshToken from DB: User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } })
3. Clear cookies: res.clearCookie("accessToken").clearCookie("refreshToken")
```

#### 8d. Refresh Token Rotation
```
1. Get refresh token from cookies or body
2. jwt.verify(token, REFRESH_TOKEN_SECRET) → get decoded._id
3. Find user → compare stored token with incoming token
4. If match: generate new access + refresh token pair
5. Return new tokens in cookies + response
```

> **Interview Q:** *What is token rotation?*  
> **A:** Each time a refresh token is used, it's replaced with a new one. The old one becomes invalid. This limits the damage if a refresh token is stolen — the attacker can only use it once before it's invalidated.

---

### Step 9: Build Routes

```js
const router = Router()

// Public routes
router.route("/register").post(upload.fields([...]), registerUser)
router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// Protected routes (require verifyJwt)
router.route("/logout").post(verifyJwt, logOutUser)
```

**Mount in app.js:**
```js
app.use("/api/v1/user", userRoutes)
// Full URL: http://localhost:3000/api/v1/user/register
```

> **Interview Q:** *Why `/api/v1/`?*  
> **A:** **API versioning** — if we make breaking changes, we create `/api/v2/` without breaking existing clients still using `/v1/`.

---

### Step 10: Wire Everything in [index.js](file:///c:/ProgrammingShit/Backend/07-Full-Stack-Video-Platform/src/index.js)

```js
import "dotenv/config"    // MUST be first — loads env vars
import connectDB from "./db/index.js"
import { app } from "./app.js"

connectDB()
  .then(() => app.listen(process.env.PORT || 3000))
  .catch((err) => console.log("MongoDB connection failed!!", err))
```

**Startup sequence:** Load env → Connect DB → Start server (only if DB succeeds)

---

## Part B: Interview Quick-Reference Notes

### 🔐 Authentication Flow Diagram
```
     REGISTER                    LOGIN                     PROTECTED REQUEST
 ┌──────────────┐          ┌──────────────┐          ┌──────────────────────┐
 │ POST /register│          │ POST /login  │          │ GET /protected-route │
 │ + avatar file │          │ email + pass │          │ Cookie: accessToken  │
 └──────┬───────┘          └──────┬───────┘          └──────────┬───────────┘
        ▼                         ▼                             ▼
 ┌──────────────┐          ┌──────────────┐          ┌──────────────────────┐
 │ Multer saves │          │  Find user   │          │  verifyJwt middleware │
 │ to /public/  │          │  by email    │          │  jwt.verify(token)   │
 │ temp folder  │          └──────┬───────┘          │  → req.user = user   │
 └──────┬───────┘                 ▼                  └──────────┬───────────┘
        ▼                  ┌──────────────┐                     ▼
 ┌──────────────┐          │bcrypt.compare│          ┌──────────────────────┐
 │ Upload to    │          │  password    │          │  Controller runs     │
 │ Cloudinary   │          └──────┬───────┘          │  with user context   │
 └──────┬───────┘                 ▼                  └──────────────────────┘
        ▼                  ┌──────────────┐
 ┌──────────────┐          │ Generate JWT │
 │ bcrypt.hash  │          │ Access (1d)  │
 │ password     │          │ Refresh (10d)│
 │ (pre-save)   │          └──────┬───────┘
 └──────┬───────┘                 ▼
        ▼                  ┌──────────────┐
 ┌──────────────┐          │ Set httpOnly │
 │ Save to DB   │          │ cookies      │
 │ (MongoDB)    │          │ + return user│
 └──────────────┘          └──────────────┘
```

### 🧠 Key Concepts One-Liners (Quick Recall)

| Concept | One-liner |
|---|---|
| **JWT** | JSON-based token with header.payload.signature, verified using a secret key |
| **bcrypt** | One-way hashing with salt — `hash()` to store, `compare()` to verify, never decrypts |
| **Pre-save hook** | Mongoose middleware that runs BEFORE `.save()` — used for password hashing |
| **asyncHandler** | HOF wrapper that catches async errors and passes to `next(err)` |
| **Multer** | Middleware that parses `multipart/form-data` and saves files to disk |
| **CORS** | Browser security policy — server must explicitly allow cross-origin requests |
| **httpOnly cookie** | Cookie invisible to JavaScript — protects against XSS |
| **Refresh token** | Long-lived token stored in DB — used to get new access tokens without re-login |
| **Token rotation** | Old refresh token invalidated when new one is issued — limits stolen token damage |
| **`$or` operator** | MongoDB query: match ANY condition in the array |
| **`$set` operator** | MongoDB update: set specific fields without affecting others |
| **`.select("-field")`** | Mongoose: exclude fields from query result |
| **`process.exit(1)`** | Kill Node process with error code — fail-fast pattern |
| **API versioning** | `/api/v1/` prefix allows breaking changes in future `/v2/` |

### 🎤 How to Explain This Project in Interview (30-second pitch)

> *"I built **Doratube**, a backend for a video-sharing platform using **Node.js**, **Express**, and **MongoDB**. It features a complete **JWT-based authentication system** with access and refresh token rotation, **bcrypt password hashing** using Mongoose pre-save hooks, and a **cloud-based file upload pipeline** where files go through Multer to local temp storage, then to Cloudinary. The API follows **RESTful conventions** with versioned endpoints, custom error/response classes for consistency, and a layered architecture separating routes, middlewares, controllers, and models."*
