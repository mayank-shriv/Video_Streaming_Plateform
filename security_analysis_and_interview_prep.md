# 🔒 Security Analysis & Interview Prep — Video Streaming Platform

---

## Part 1: Security Measures You Implemented

Below is **every security measure** found in your codebase, with exact file references and explanations.

---

### 1. 🔐 Password Hashing with Bcrypt

**Files:** [user.model.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/models/user.model.js)

```js
// Pre-save hook — hashes password before storing in DB
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10); // 10 salt rounds
});

// Instance method — compares plaintext password with hashed version
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};
```

**What you did:**
- **Never store plaintext passwords** — bcrypt hashes every password before it hits MongoDB
- **Salt rounds = 10** — each hash is unique even for identical passwords
- **`isModified("password")` check** — prevents rehashing on unrelated updates (e.g., changing email)
- **Comparison via `bcrypt.compare()`** — never decrypts the hash; compares mathematically

---

### 2. 🎫 JWT (JSON Web Tokens) — Access Token & Refresh Token

**Files:** [user.model.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/models/user.model.js), [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js), [auth.middlewares.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/middlewares/auth.middlewares.js)

#### Access Token Generation
```js
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email, username: this.username, fullName: this.fullname },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // 1 day
    );
};
```

#### Refresh Token Generation
```js
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id }, // Minimal payload — only user ID
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } // 10 days
    );
};
```

**What you did:**
- **Dual-token strategy** — short-lived access token (1d) + long-lived refresh token (10d)
- **Separate secrets** — `ACCESS_TOKEN_SECRET` ≠ `REFRESH_TOKEN_SECRET` (compromise one doesn't break the other)
- **Minimal refresh token payload** — only `_id` (reduces attack surface if intercepted)
- **Access token carries user context** — avoids DB lookups on every authenticated request
- **Refresh token stored in DB** — enables server-side invalidation (logout = delete from DB)

---

### 3. 🍪 Secure, HttpOnly Cookies

**File:** [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js#L101-L104)

```js
const options = {
    httpOnly: true,  // ← Cannot be accessed by JavaScript (XSS protection)
    secure: true     // ← Only sent over HTTPS
}
res.cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
```

**What you did:**
- **`httpOnly: true`** — JavaScript on the client **cannot** read these cookies → blocks XSS token theft
- **`secure: true`** — cookies are **only** sent over HTTPS → blocks man-in-the-middle attacks
- Applied consistently on **login**, **token refresh**, **logout** (clearCookie)

---

### 4. 🔄 Token Refresh Flow (Rotation)

**File:** [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js#L145-L184)

```js
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    // 1. Verify the token signature
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    // 2. Fetch user and compare with stored token
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh Token is expired or used");
    }
    // 3. Generate fresh pair of tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
});
```

**What you did:**
- **Token rotation** — old refresh token is replaced on each refresh → one-time use
- **DB comparison** — verifies the incoming token matches what's stored → prevents replay attacks
- **Graceful failure** — expired or tampered tokens return `401 Unauthorized`

---

### 5. 🛡️ Authentication Middleware (Route Protection)

**File:** [auth.middlewares.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/middlewares/auth.middlewares.js)

```js
export const verifyJwt = asyncHandler(async (req, _res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    req.user = user;
    next();
});
```

**What you did:**
- **Dual token extraction** — supports both cookies and `Authorization: Bearer <token>` header
- **Token verification** — validates signature + expiry using the secret
- **User hydration** — attaches the full user object to `req.user` (minus password & refreshToken)
- **Protected routes** — applied as middleware on sensitive routes:

```js
// Protected routes (require verifyJwt)
router.route("/logout").post(verifyJwt, logOutUser)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/change-password").post(verifyJwt, changePassword)
router.route("/update-account").patch(verifyJwt, updateAccountDetails)
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover").patch(verifyJwt, upload.single("coverImage"), updateUserCoverAvatar)
```

---

### 6. 🔒 Logout — Server-Side Token Invalidation

**File:** [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js#L120-L141)

```js
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken: undefined } // ← Invalidate stored token
    });
    res.clearCookie("accessToken", options)
       .clearCookie("refreshToken", options); // ← Remove from browser
});
```

**What you did:**
- **Server-side invalidation** — sets `refreshToken` to `undefined` in DB, so even if someone has the old token, it won't match
- **Client-side cleanup** — clears both cookies from the browser

---

### 7. 🌐 CORS (Cross-Origin Resource Sharing)

**File:** [app.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/app.js#L12-L15)

```js
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Configurable via .env
    credentials: true                 // Allow cookies to be sent cross-origin
}));
```

**What you did:**
- **Origin restriction** — controlled via environment variable (prevents unauthorized domains from calling your API)
- **`credentials: true`** — allows cookies to be sent/received in cross-origin requests (required for your cookie-based auth)

> [!WARNING]
> Your `.env` currently has `CORS_ORIGIN=*` which allows **all origins**. In production, set this to your specific frontend domain (e.g., `https://doratube.com`).

---

### 8. 📁 Environment Variables (.env) & dotenv

**Files:** [.env](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/.env), [index.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/index.js)

```env
PORT = 3000
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET = ahsjkfhajk...
ACCESS_TOKEN_EXPIRY = 1d
REFRESH_TOKEN_SECRET = jarikwjfad...
REFRESH_TOKEN_EXPIRY = 10d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**What you did:**
- **Separation of secrets from code** — all secrets (DB URI, JWT secrets, Cloudinary keys) live in `.env`, not hardcoded
- **`dotenv/config`** — loads env vars at startup: `import "dotenv/config"`
- **`.gitignore` includes `.env`** — prevents secrets from being committed to version control

---

### 9. 🚫 Password Exclusion from API Responses

**File:** [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js)

```js
// On registration
const createdUser = await User.findById(user.id).select("-password -refreshToken");

// On login
const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

// In auth middleware
const user = await User.findById(decodedToken._id).select("-password -refreshToken");

// On updates
.select("-password")
```

**What you did:**
- **`.select("-password -refreshToken")`** used everywhere — ensures sensitive fields NEVER appear in API responses
- Consistent across registration, login, middleware, and update operations

---

### 10. ✅ Input Validation & Duplicate Checking

**File:** [user.controller.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/controllers/user.controller.js)

```js
// Empty field validation
if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
}

// Duplicate user check
const existedUser = await User.findOne({ $or: [{ username }, { email }] });
if (existedUser) {
    throw new ApiError(409, "User with email and email already exists");
}
```

**What you did:**
- **Prevents empty/whitespace-only inputs** — trims and validates all required fields
- **Duplicate prevention** — checks both username and email before registration
- **Proper HTTP status codes** — 400 for bad input, 409 for conflict, 401 for unauthorized

---

### 11. 📦 Request Payload Size Limiting

**File:** [app.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/app.js#L17-L22)

```js
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
```

**What you did:**
- **16KB limit on JSON and URL-encoded payloads** — prevents attackers from sending extremely large payloads (DoS protection)
- Separate from file uploads (which go through Multer)

---

### 12. 🧹 Temp File Cleanup on Upload Failure

**File:** [cloudinary.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/utils/cloudinary.js)

```js
catch(error) {
    fs.unlink(localPath, (err) => { ... }); // Delete local file if Cloudinary upload fails
    return null;
}
```

**What you did:**
- **Cleanup on failure** — deletes the locally stored temp file if the Cloudinary upload fails
- Prevents disk space exhaustion from accumulated failed uploads

---

### 13. ⚡ Async Error Handling (asyncHandler)

**File:** [asyncHandler.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/utils/asyncHandler.js)

```js
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};
```

**What you did:**
- **Catches all unhandled promise rejections** — prevents server crashes
- **Propagates errors to Express error handler** — via `next(err)`
- Wraps every controller — consistent error handling across the entire app

---

### 14. 📋 Standardized Error & Response Classes

**Files:** [ApiError.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/utils/ApiError.js), [ApiResponse.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/utils/ApiResponse.js)

**What you did:**
- **`ApiError`** — extends `Error` with `statusCode`, `message`, `errors`, and stack trace capture
- **`ApiResponse`** — standardized JSON response with `statusCode`, `data`, `message`, `success`
- **Prevents information leakage** — controlled error messages instead of raw stack traces in responses

---

### 15. 🗂️ File Upload Controls (Multer)

**File:** [multer.middlewares.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/middlewares/multer.middlewares.js)

```js
upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
])
```

**What you did:**
- **`maxCount: 1`** — limits uploads to 1 file per field
- **Disk storage** — files go to `./public/temp` (not memory, preventing memory exhaustion)
- **Field-specific uploads** — only accepts `avatar` and `coverImage` fields

---

### 16. 🔑 Mongoose Schema-Level Security

**File:** [user.model.js](file:///c:/ProgrammingShit/Projects/VideoStreamingPlateform/Backend/src/models/user.model.js)

```js
username: { unique: true, lowercase: true, trim: true, index: true }
email: { unique: true, lowercase: true, trim: true }
```

**What you did:**
- **`unique: true`** — database-level constraint preventing duplicate usernames/emails
- **`lowercase: true`** — normalizes input (prevents `User` vs `user` bypass)
- **`trim: true`** — removes whitespace padding
- **`required: true`** — schema-level validation as a safety net

---

## Summary Table

| # | Security Measure | Where | Protects Against |
|---|---|---|---|
| 1 | Bcrypt password hashing | `user.model.js` | Password theft from DB breach |
| 2 | JWT Access + Refresh tokens | `user.model.js`, `user.controller.js` | Stateless auth, session hijacking |
| 3 | HttpOnly + Secure cookies | `user.controller.js` | XSS token theft, MITM attacks |
| 4 | Token rotation on refresh | `user.controller.js` | Replay attacks |
| 5 | Auth middleware (verifyJwt) | `auth.middlewares.js` | Unauthorized access to protected routes |
| 6 | Server-side logout | `user.controller.js` | Lingering sessions after logout |
| 7 | CORS configuration | `app.js` | Cross-origin attacks |
| 8 | Environment variables (.env) | `.env`, `.gitignore` | Secret exposure in source code |
| 9 | Password exclusion from responses | `user.controller.js` | Accidental password leakage |
| 10 | Input validation | `user.controller.js` | Injection, invalid data |
| 11 | Payload size limiting | `app.js` | DoS via large payloads |
| 12 | Temp file cleanup | `cloudinary.js` | Disk exhaustion |
| 13 | Async error handling | `asyncHandler.js` | Server crashes, unhandled rejections |
| 14 | Standardized error classes | `ApiError.js`, `ApiResponse.js` | Information leakage |
| 15 | File upload limits | `multer.middlewares.js` | Upload abuse |
| 16 | Schema-level validation | `user.model.js` | Data integrity, duplicate bypass |

---

> [!IMPORTANT]
> **Things you mentioned but are NOT currently in your codebase:**
> - **Helmet** — not installed or used (would add security headers like `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.)
> - **Rate limiting** — no `express-rate-limit` or equivalent (would prevent brute-force attacks)
> - **CSRF protection** — no CSRF tokens implemented
> - **Input sanitization** — no libraries like `express-validator` or `mongo-sanitize`

---
---

## Part 2: Interview Questions & Answers

### 📚 Category 1: Bcrypt & Password Hashing

---

**Q1. What is bcrypt and why did you use it instead of storing plaintext passwords?**

> Bcrypt is a one-way hashing algorithm specifically designed for passwords. I used it because:
> - It's **one-way** — you can't reverse the hash to get the original password
> - It automatically generates a **random salt** for each password, so even identical passwords produce different hashes
> - It has a **cost factor** (salt rounds) that makes it deliberately slow, making brute-force attacks impractical
> - If our database is breached, attackers get hashes, not passwords

---

**Q2. What are salt rounds in bcrypt? Why did you choose 10?**

> Salt rounds (also called the cost factor) determine how many times the hashing algorithm runs. Each increment doubles the computation time:
> - 10 rounds ≈ ~10 hashes/second (good balance of security vs performance)
> - 12 rounds ≈ ~3 hashes/second (better security, slower registration/login)
> - Higher values = more secure but slower
> 
> I chose 10 because it's the industry standard default — secure enough to resist brute-force while not noticeably slowing down user registration/login.

---

**Q3. What is a salt in password hashing? Why is it important?**

> A salt is a random string added to the password **before** hashing. It's important because:
> - Without salt: `hash("password123")` always produces the same output → attackers can use **rainbow tables** (precomputed hash lookups)
> - With salt: `hash("password123" + "random_salt")` produces a **unique** output every time
> - Bcrypt generates and embeds the salt automatically in the hash string

---

**Q4. Why did you use `isModified("password")` in your pre-save hook?**

> The `pre("save")` hook runs every time `.save()` is called — not just on registration. Without the `isModified` check, the password would get **re-hashed on every save**, including when updating email, fullname, or avatar. This would corrupt the password because you'd be hashing an already-hashed value, making login impossible.

---

**Q5. What's the difference between `bcrypt.hash()` and `bcrypt.compare()`?**

> - `bcrypt.hash(plaintext, saltRounds)` → takes a plaintext password and returns a hashed string
> - `bcrypt.compare(plaintext, hash)` → takes a plaintext password and an existing hash, then mathematically compares them **without decrypting**. Returns `true` or `false`.
> 
> The key point: bcrypt.compare does NOT decrypt. It hashes the input using the same salt (embedded in the stored hash) and compares the results.

---

**Q6. Can bcrypt be decoded? How is comparison possible then?**

> No, bcrypt cannot be decoded — it's a one-way function. Comparison works because:
> 1. The stored hash contains the salt and cost factor as a prefix: `$2b$10$<salt><hash>`
> 2. `bcrypt.compare()` extracts the salt from the stored hash
> 3. It hashes the input password using that same salt
> 4. It compares the two hash outputs — if they match, the passwords are the same

---

### 📚 Category 2: JWT (JSON Web Tokens)

---

**Q7. What is JWT and why did you use it?**

> JWT (JSON Web Token) is a compact, URL-safe token format used for stateless authentication. I used it because:
> - **Stateless** — the server doesn't need to store session data in memory or a session store
> - **Self-contained** — the token itself carries user info (id, email, username) in its payload
> - **Scalable** — works across multiple server instances without shared session storage
> - **Standard** — widely adopted format with library support in every language

---

**Q8. What are the three parts of a JWT? Explain each.**

> A JWT has three Base64URL-encoded parts separated by dots: `header.payload.signature`
> 
> 1. **Header** — algorithm (`HS256`) and token type (`JWT`)
> 2. **Payload** — the claims (data): `{ _id, email, username, exp, iat }`
> 3. **Signature** — `HMAC-SHA256(base64(header) + "." + base64(payload), SECRET_KEY)`
> 
> The signature ensures the token hasn't been tampered with. If anyone changes the payload, the signature won't match, and `jwt.verify()` will fail.

---

**Q9. Is JWT encrypted? Can someone read the payload?**

> **No, JWT is NOT encrypted by default** — it's only **signed**. The payload is Base64-encoded (not encrypted), so anyone can decode it. That's why:
> - I never put the password in the token payload
> - The refresh token has a minimal payload (only `_id`)
> - The real security comes from the **signature** — you can read it, but you can't forge it without the secret

---

**Q10. What's the difference between Access Token and Refresh Token? Why use both?**

> | | Access Token | Refresh Token |
> |---|---|---|
> | **Purpose** | Authenticate API requests | Get a new access token |
> | **Lifetime** | Short (1 day in my app) | Long (10 days in my app) |
> | **Payload** | Rich (id, email, username) | Minimal (only id) |
> | **Stored in** | Cookie + response body | Cookie + response body + DB |
> | **Secret** | ACCESS_TOKEN_SECRET | REFRESH_TOKEN_SECRET |
> 
> **Why both?** If we only had access tokens:
> - Short-lived = user logs in constantly (bad UX)
> - Long-lived = if stolen, attacker has long access (bad security)
> 
> With both: access token is short-lived (limits damage if stolen), refresh token silently renews it (good UX).

---

**Q11. What happens when the access token expires?**

> 1. Client sends request with expired access token → server returns `401 Unauthorized`
> 2. Client sends the refresh token to `/api/v1/user/refresh-token`
> 3. Server verifies the refresh token (signature + DB match)
> 4. Server generates a **new** access token AND a new refresh token (rotation)
> 5. Server sends both back via cookies
> 6. Client retries the original request with the new access token

---

**Q12. Why did you use separate secrets for access and refresh tokens?**

> Separation of concerns and defense in depth:
> - If `ACCESS_TOKEN_SECRET` is compromised, the attacker can only forge access tokens (short-lived, 1 day)
> - They still can't forge refresh tokens because it uses a different secret
> - It limits the blast radius of a secret leak

---

**Q13. What is token rotation? Why did you implement it?**

> Token rotation means every time a refresh token is used, it's replaced with a new one. In my code, `generateAccessAndRefreshToken()` creates both tokens and saves the new refresh token to the DB, overwriting the old one.
> 
> **Why?** If an attacker steals a refresh token and uses it, the legitimate user's next refresh will fail (token mismatch in DB), alerting them to a compromise. Without rotation, a stolen refresh token could be used indefinitely until expiry.

---

**Q14. How does `jwt.verify()` work internally?**

> 1. Parses the token into header, payload, and signature
> 2. Recomputes the signature using the header + payload + the secret you provide
> 3. Compares the recomputed signature with the token's signature
> 4. If they match → token is authentic (not tampered)
> 5. Checks the `exp` claim against current time → if past, throw `TokenExpiredError`
> 6. Returns the decoded payload if everything passes

---

### 📚 Category 3: Cookies & Cookie Security

---

**Q15. Why use cookies instead of localStorage for storing tokens?**

> | | Cookies | localStorage |
> |---|---|---|
> | **XSS protection** | `httpOnly` flag blocks JS access | Fully accessible to any JS on the page |
> | **Auto-sent** | Automatically included in every request | Must be manually added to headers |
> | **CSRF risk** | Vulnerable (mitigated with SameSite) | Not vulnerable |
> | **Size limit** | ~4KB | ~5-10MB |
> 
> I chose cookies with `httpOnly: true` because even if there's an XSS vulnerability on the frontend, the attacker's malicious JavaScript **cannot read the tokens**.

---

**Q16. What does `httpOnly: true` actually do?**

> It tells the browser to **block JavaScript access** to the cookie. Specifically:
> - `document.cookie` will NOT show httpOnly cookies
> - XSS attacks that try to steal tokens via `document.cookie` or `fetch` to exfiltrate cookies will **fail**
> - The cookie is still sent automatically on every HTTP request — it's just invisible to client-side JS

---

**Q17. What does `secure: true` do on a cookie?**

> It tells the browser to **only send the cookie over HTTPS** connections:
> - Prevents the cookie from being sent over plain HTTP
> - Blocks man-in-the-middle (MITM) attackers from intercepting tokens on insecure networks
> - In development (http://localhost), this can cause issues — cookies won't be sent

---

**Q18. What is the `SameSite` cookie attribute? Why didn't you use it?**

> `SameSite` controls when cookies are sent in cross-site requests:
> - `SameSite=Strict` — only sent for same-site requests (most secure, but can break external links)
> - `SameSite=Lax` — sent for top-level navigations (default in modern browsers, good balance)
> - `SameSite=None` — sent for all cross-site requests (requires `Secure: true`)
> 
> I didn't explicitly set it, but modern browsers default to `Lax`. In a production app, I would add `sameSite: "strict"` for maximum CSRF protection.

---

### 📚 Category 4: CORS (Cross-Origin Resource Sharing)

---

**Q19. What is CORS and why did you configure it?**

> CORS is a browser security mechanism that blocks requests from one origin (e.g., `http://frontend.com`) to a different origin (e.g., `http://api.com:3000`). Without CORS configuration on the server, the browser will reject the response.
> 
> I configured it because my frontend and backend may run on different ports/domains, and I needed the browser to allow cross-origin API calls.

---

**Q20. What does `credentials: true` do in your CORS config?**

> By default, cross-origin requests **don't include cookies**. Setting `credentials: true` tells the browser:
> - "It's okay to send cookies (and authentication headers) with cross-origin requests"
> - This is required for my cookie-based JWT auth to work when the frontend is on a different origin
> 
> The frontend must also set `credentials: 'include'` in its fetch calls.

---

**Q21. What's wrong with `CORS_ORIGIN=*` and how would you fix it?**

> `*` means "allow any origin" — every website in the world can call my API. This is dangerous in production because:
> - Any malicious site could make authenticated requests to my API using a logged-in user's cookies
> - Browsers actually block `credentials: true` with `origin: *` — this is a spec violation
> 
> **Fix:** Set `CORS_ORIGIN=https://my-frontend-domain.com` in production, or use a whitelist of allowed origins.

---

### 📚 Category 5: Environment Variables & .env Files

---

**Q22. Why do we use `.env` files? What problem do they solve?**

> `.env` files solve the problem of **hardcoded secrets**:
> - Secrets (DB passwords, API keys, JWT secrets) should NEVER be in source code
> - Different environments (dev, staging, production) need different values
> - `.env` keeps secrets local to each machine
> - `.gitignore` excludes `.env` from version control → secrets never reach GitHub

---

**Q23. How does `dotenv` work under the hood?**

> 1. Reads the `.env` file from the project root
> 2. Parses each `KEY=VALUE` line
> 3. Injects them into `process.env` (Node.js's global environment object)
> 4. Does NOT overwrite existing environment variables (system env vars take priority)
> 
> In my project: `import "dotenv/config"` runs this at the very start of `index.js`, before any other code accesses `process.env`.

---

**Q24. What happens if your `.env` file gets pushed to GitHub?**

> **Catastrophic scenario:**
> - Anyone can see your MongoDB connection string → full database access
> - Anyone can see your JWT secrets → forge any token, impersonate any user
> - Anyone can see your Cloudinary keys → abuse your storage/bandwidth
> 
> **Mitigation:** `.gitignore` includes `.env` to prevent this. If it accidentally gets pushed:
> 1. Immediately rotate ALL secrets (new DB password, new JWT secrets, new API keys)
> 2. Remove the file from git history using `git filter-branch` or BFG Repo Cleaner
> 3. Force push the cleaned history

---

**Q25. What's the difference between `.env`, `.env.production`, and `.env.local`?**

> | File | Purpose |
> |---|---|
> | `.env` | Default values, shared across environments |
> | `.env.local` | Local overrides (never committed) |
> | `.env.development` | Development-specific values |
> | `.env.production` | Production-specific values |
> | `.env.test` | Test environment values |
> 
> Priority (in most frameworks): `.env.local` > `.env.{environment}` > `.env`

---

### 📚 Category 6: Helmet (Not in Your Project — But You Should Know)

---

**Q26. What is Helmet.js and what security headers does it set?**

> Helmet is an Express middleware that sets various HTTP response headers to improve security:
> 
> | Header | What It Does |
> |---|---|
> | `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing |
> | `X-Frame-Options: DENY` | Prevents clickjacking (iframe embedding) |
> | `Strict-Transport-Security` | Forces HTTPS for future requests |
> | `X-XSS-Protection` | Enables browser XSS filter |
> | `Content-Security-Policy` | Controls which resources the browser can load |
> | `X-Powered-By` | Helmet removes this (hides that you use Express) |
> 
> **Usage:** `app.use(helmet())` — one line adds all these protections.

---

**Q27. Why is removing the `X-Powered-By` header important?**

> By default, Express sends `X-Powered-By: Express` in every response. This tells attackers:
> - You're using Express (and likely Node.js)
> - They can target known Express/Node vulnerabilities
> - It's unnecessary information disclosure
> 
> Helmet removes it automatically, or you can do: `app.disable('x-powered-by')`

---

### 📚 Category 7: HTTPS, MITM, and Transport Security

---

**Q28. What is a Man-in-the-Middle (MITM) attack? How do your cookies prevent it?**

> A MITM attack is when an attacker intercepts communication between client and server (e.g., on public WiFi). They can:
> - Read all data being transmitted (including tokens)
> - Modify requests/responses
> 
> My `secure: true` cookie flag ensures tokens are **only sent over HTTPS**, which is encrypted. Even if an attacker intercepts the traffic, they see encrypted data, not the raw tokens.

---

### 📚 Category 8: XSS and CSRF Attacks

---

**Q29. What is XSS (Cross-Site Scripting)? How does your app defend against it?**

> XSS is when an attacker injects malicious JavaScript into your site (e.g., via a comment field that renders HTML). The script runs in the victim's browser and can:
> - Steal tokens from `localStorage` or `document.cookie`
> - Make API calls as the victim
> 
> **My defense:** `httpOnly: true` cookies — even if XSS occurs, the attacker's script **cannot access the tokens**.

---

**Q30. What is CSRF (Cross-Site Request Forgery)? Are you vulnerable?**

> CSRF is when a malicious site tricks a user's browser into making a request to your API while the user is logged in. Since cookies are sent automatically, the request is authenticated.
> 
> **Am I vulnerable?** Partially:
> - My cookies are `httpOnly` and `secure` ✅
> - But I don't have `SameSite` explicitly set (browsers default to `Lax`) ⚠️
> - I don't have CSRF tokens ⚠️
> 
> **Fix:** Add `SameSite: 'strict'` to cookies and/or implement CSRF tokens for state-changing requests.

---

### 📚 Category 9: Authentication Flow (End-to-End)

---

**Q31. Walk me through the complete login flow in your application.**

> 1. User submits username/email + password to `POST /api/v1/user/login`
> 2. Server finds user by username or email in MongoDB
> 3. Server runs `bcrypt.compare(inputPassword, storedHash)` → returns true/false
> 4. If valid: generates access token (JWT with user data, 1d expiry) + refresh token (JWT with just `_id`, 10d expiry)
> 5. Saves refresh token to user document in DB
> 6. Sets both tokens as `httpOnly`, `secure` cookies in the response
> 7. Also sends tokens in the response body (for mobile clients that can't use cookies)
> 8. Sends back user data **without password or refresh token**

---

**Q32. Walk me through what happens when a protected route is accessed.**

> 1. Request hits `verifyJwt` middleware
> 2. Middleware extracts token from `req.cookies.accessToken` OR `Authorization: Bearer <token>` header
> 3. Calls `jwt.verify(token, ACCESS_TOKEN_SECRET)` → decodes payload or throws error
> 4. Fetches full user from DB using decoded `_id`, excluding password and refreshToken
> 5. Attaches user object to `req.user`
> 6. Calls `next()` → request proceeds to the actual controller
> 7. If any step fails → throws `ApiError(401, "Unauthorized")` → request is rejected

---

**Q33. How does your logout work and why is server-side invalidation important?**

> 1. Client sends `POST /api/v1/user/logout` (must be authenticated → `verifyJwt` runs first)
> 2. Server sets `refreshToken: undefined` in the user's DB document
> 3. Server clears both cookies from the browser response
> 
> **Why server-side matters:** If we only cleared cookies (client-side), an attacker who already copied the tokens could still use them until expiry. By removing the refresh token from the DB, even if they try to refresh, the DB comparison fails.

---

### 📚 Category 10: Advanced / Scenario-Based Questions

---

**Q34. If you could add one more security feature to your project, what would it be?**

> **Helmet.js** — it's a single line of code (`app.use(helmet())`) that adds 10+ security headers. It's the highest ROI security improvement:
> - Prevents clickjacking, MIME sniffing, XSS
> - Adds HSTS for HTTPS enforcement
> - Sets Content-Security-Policy
> - Removes `X-Powered-By`

---

**Q35. How would you add rate limiting to prevent brute-force login attacks?**

> ```js
> import rateLimit from 'express-rate-limit';
> const loginLimiter = rateLimit({
>     windowMs: 15 * 60 * 1000, // 15 minutes
>     max: 5, // 5 attempts per window
>     message: "Too many login attempts, try again after 15 minutes"
> });
> router.route("/login").post(loginLimiter, loginUser);
> ```
> This limits each IP to 5 login attempts per 15-minute window.

---

**Q36. Your refresh token is stolen. What happens? How do you handle it?**

> **What happens with current implementation:**
> - Attacker uses the stolen refresh token to get new access tokens
> - Since I have token rotation, when the **legitimate user** tries to refresh, their old token won't match the DB (attacker already rotated it) → user gets 401
> - This **alerts** the user that something is wrong
> 
> **Better approach (not yet implemented):**
> - Maintain a token family chain — if a rotated-out token is ever reused, invalidate the entire family
> - Force re-login for the user
> - Optionally log the IP of the suspicious request

---

**Q37. How would you handle token storage for a mobile app vs. a web app?**

> | Platform | Storage Method |
> |---|---|
> | **Web (Browser)** | `httpOnly, secure` cookies (my current approach) |
> | **Mobile (React Native/Flutter)** | Secure storage (Keychain on iOS, Keystore on Android) |
> | **Mobile** | Cannot use cookies → use `Authorization: Bearer <token>` header |
> 
> My auth middleware already supports both: `req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")`

---

**Q38. What is the difference between authentication and authorization?**

> | | Authentication | Authorization |
> |---|---|---|
> | **Question** | "Who are you?" | "What can you do?" |
> | **In my app** | `verifyJwt` middleware (validates JWT) | Not yet implemented (no role-based access) |
> | **Example** | Login with username + password | Admin can delete videos, User cannot |
> 
> My app currently handles authentication well but doesn't have authorization (role-based access control).

---

**Q39. Why do you use `validateBeforeSave: false` when saving the refresh token?**

> ```js
> await user.save({ validateBeforeSave: false })
> ```
> When saving ONLY the refresh token, I skip Mongoose schema validation because:
> - The user document already passed validation during registration
> - Schema validations (like `required` on password) would fail because we're not sending all fields
> - We're only updating the `refreshToken` field — no need to re-validate everything

---

**Q40. What would you do differently if you were building this for production?**

> 1. **Add Helmet.js** — security headers in one line
> 2. **Add rate limiting** — prevent brute-force attacks
> 3. **Restrict CORS origin** — specific domain, not `*`
> 4. **Add `SameSite: strict`** to cookies — CSRF prevention
> 5. **Add input sanitization** — `express-validator` or `mongo-sanitize` to prevent NoSQL injection
> 6. **Add request logging** — `morgan` or `winston` for audit trails
> 7. **Implement roles/permissions** — authorization layer
> 8. **Use HTTPS everywhere** — TLS certificate with `secure: true` cookies
> 9. **Add file type validation** in Multer — only allow image/video MIME types
> 10. **Implement password strength requirements** — minimum length, complexity

---

### 📚 Quick-Fire Round (One-Liners)

| # | Question | Answer |
|---|---|---|
| 41 | What does `process.env` do? | Accesses environment variables set by the OS or `.env` file |
| 42 | What is the `exp` claim in JWT? | Expiration time — token is invalid after this timestamp |
| 43 | What is the `iat` claim in JWT? | "Issued At" — when the token was created |
| 44 | What does `.select("-password")` do? | Excludes the `password` field from the Mongoose query result |
| 45 | What is the purpose of `cookie-parser`? | Parses cookies from `req.headers.cookie` into `req.cookies` object |
| 46 | Why use `express.json({ limit: "16kb" })`? | Prevents denial of service via oversized JSON payloads |
| 47 | What is a rainbow table? | Precomputed table of hash values used to crack unsalted passwords |
| 48 | What's the difference between hashing and encryption? | Hashing is one-way (can't reverse). Encryption is two-way (can decrypt with key). |
| 49 | Can JWT be used without HTTPS? | Technically yes, but never should — token is base64 (readable), not encrypted |
| 50 | What does `next()` do in Express middleware? | Passes control to the next middleware or route handler in the chain |

---

### 📚 Bonus: Tell Me About Your Project (Interview Opener)

> "I built a full-stack video streaming platform called **DoraTube** using **Node.js**, **Express**, and **MongoDB**. On the security front, I implemented:
> 
> - **Bcrypt** for password hashing with salt rounds
> - **JWT-based dual-token authentication** — short-lived access tokens and long-lived refresh tokens with rotation
> - **HttpOnly secure cookies** to prevent XSS-based token theft
> - **CORS** configured with credentials support for cross-origin requests
> - **Environment variables** via dotenv with `.gitignore` protection for secrets
> - **Server-side logout** with token invalidation in the database
> - **Input validation** and **payload size limiting** to prevent injections and DoS
> - A custom **asyncHandler** utility for centralized error handling
> 
> If I were to improve it for production, I'd add **Helmet.js** for security headers, **rate limiting** against brute-force, and **role-based authorization**."
