# Community chat setup

The chat is embedded in `games/index.html` and uses Firebase Authentication and Realtime Database, so it can share messages across Netlify and GitHub Pages. Each host must be listed as an authorized domain in Firebase Authentication.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/) and add a Web app.
2. In **Authentication > Sign-in method**, enable **Anonymous**.
3. In **Realtime Database**, create a database and copy its URL (for example, `https://your-project-default-rtdb.firebaseio.com`).
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId`, plus the database URL, into [`chat-config.js`](chat-config.js).
5. In **Authentication > Settings > Authorized domains**, add the Netlify hostname and the GitHub Pages hostname that will serve the site.
6. In **Realtime Database > Rules**, publish these rules:

```json
{
  "rules": {
    "messages": {
      ".read": "auth != null",
      "$messageId": {
        ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid",
        ".validate": "newData.hasChildren(['uid', 'name', 'text', 'createdAt'])",
        "uid": {
          ".validate": "newData.isString() && newData.val() === auth.uid"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 24"
        },
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500"
        },
        "createdAt": {
          ".validate": "newData.isNumber() && newData.val() <= now && newData.val() > now - 60000"
        },
        "$other": {
          ".validate": false
        }
      }
    }
  }
}
```

The web config is public by design; never put a service-account key in this site. The database rules restrict messages to signed-in anonymous users, validate their contents, and prevent editing or deleting existing messages. This is a public room, so messages and nicknames are visible to every visitor. For a larger public audience, add abuse reporting and server-enforced rate limits before opening the room widely.