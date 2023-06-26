# Materials Matter App

### The idea:

A prototype application that allows professors to create and upload their lecture's content into a web-friendly "map".
This allows students to view and explore these at their own discretion.
Professors are able to create "comment sessions" so that students can comment and reply directly on top of the map in real time.
These will then be organized and stored in the "comment session", and can be viewed at a later date.

---

### The stack:

This stack mainly uses Typescript and SCSS for its languages.
The back-end is a Node server with Express for its routing, Socket.io for real-time comments, and MySQL for its database.
The front-end uses React.js and SCSS, which are bundled by Webpack.
Knex.js is used to create OOP model abstractions for schemas, queries, and typing under the [models](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/models) directory.

---

### Important files:

* [server.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/server.ts): The root file that the Express server is created in. Imports all the routes made in the [controllers](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/controllers) directory.
* [utils/authentication.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/authentication.ts): The configuration file responsible for creating user sessions with Passport.js. Uses Google's OAuth to only allow users with the @binghamton.edu email domain.
* [utils/socketIO.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/socketIO.ts): The configuration file for creating the Socket.io configuration with Passport.js user sessions.
* [views/styles/globals.scss](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/styles/globals.scss): A SCSS file that is bundled for every webpage served.
* [utils/regexTester.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/utils/regexTester.ts): A utility class made to validate an incoming JSON request body against a formatted object with regular expressions as the values.
* [models/__init__.ts](https://github.com/KevinCox0427/Materials-Matter-App/blob/main/models/__init__.ts): Imports all the SQL schemas made in the [models](https://github.com/KevinCox0427/Materials-Matter-App/tree/main/models) directory to initliaze the SQL database connection.
