

# videotube-project-code


## Getting Started

### Prerequisites

- Node.js (v16 or above recommended)
- npm (Node Package Manager)

### Installation

```sh
npm install
```

### Running the Server

```sh
npm run dev
```

### Project Structure

- `src/` - Main source code
- `public/` - Static files
- `package.json` - Project metadata and dependencies


## Project Overview

This is the backend for the Videotube project, built with Node.js and Express.

Progress so far: the backend core is implemented — an Express app with a MongoDB connection, a `User` model that hashes passwords and provides token helpers, and a registration flow (`POST /api/v1/users/register`) that accepts multipart/form-data (text fields and avatar/cover image uploads) using multer. Uploaded files are stored temporarily and then uploaded to Cloudinary via a utility; the controller includes basic validation and duplicate-user checks. A few common errors (missing `app` import, missing password field, and 409 conflicts on duplicate users) were discovered and documented for debugging.


## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the mk&it'sTeam.
