# Materials Matter App

### The idea:

A prototype application that allows professors to create and upload their lecture's content into a web-friendly "map" with a rich text editor.
This allows students to view and explore these at their own discretion, as well as allowing professors to have much more engaging content.
Professors are also able to create "comment sessions" so that students can comment and reply directly on top of the map in real time.
These will then be organized and stored in the "comment session", and can be viewed at a later date.

---

### The stack:

This stack mainly uses Typescript.
The back-end is a Node server with Express for its routing, Socket.io for real-time comments, and MySQL for its database.
The front-end uses React.js, Redux for a centralized state, Quill.js for a rich text editor, and SCSS, which are all bundled by Webpack.
Knex.js is used to create OOP model abstractions for schemas, queries, and typing under the [models](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/models) directory.

---

### Important files:

* [views/Map/Map.tsx](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/views/Map/Map.tsx): The React file that renders the main application. This is for the map's editor and viewer.
* [views/Map/store/store.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/views/Map/store/store.ts): The Redux store that imports all the data slices in the [store](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/views/Map/store) directory for the main React application. Since the stateful data is quite large and stretches across many components, having a centralized state makes is a lot easier to manipulate and is much more ledgible.
* [server.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/server.ts): The root file that the Express server is created in. Imports all the routes made in the [controllers](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/controllers) directory.
* [utils/authentication.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/authentication.ts): The configuration file responsible for creating user sessions with Passport.js. Uses Google's OAuth to only allow users with the @binghamton.edu email domain.
* [utils/socketIO.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/socketIO.ts): The configuration file for creating the Socket.io configuration with Passport.js user sessions.
* [views/styles/globals.scss](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/styles/globals.scss): A SCSS file that is bundled for every webpage served.
* [utils/regexTester.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/regexTester.ts): A utility class made to validate an incoming JSON request body against a formatted object with regular expressions as the values.
* [models/\_\_init\_\_.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/models/__init__.ts): Imports all the SQL schemas made in the [models](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/models) directory to initliaze the SQL database connection.
