# Community chat setup

The chat is embedded in `games/index.html` and uses Firebase Authentication and Realtime Database, so it can share messages across Netlify and GitHub Pages. Each host must be listed as an authorized domain in Firebase Authentication.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/) and add a Web app.
2. In **Authentication > Sign-in method**, enable **Anonymous**.
3. In **Realtime Database**, create a database and copy its URL (for example, `https://your-project-default-rtdb.firebaseio.com`).
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId`, plus the database URL, into [`chat-config.js`](chat-config.js).
5. In **Authentication > Settings > Authorized domains**, add the Netlify hostname and the GitHub Pages hostname that will serve the site.
6. In **Realtime Database > Rules**, replace the rules with the following and click **Publish**. The username reservation and message write rules must both be live in the same database used by `chat-config.js`:

```json
{
  "rules": {
    "usernames": {
      "$username": {
        ".read": "auth != null",
        ".write": "auth != null && newData.isString() && newData.val() === auth.uid && (!data.exists() || data.val() === auth.uid)",
        ".validate": "newData.isString() && newData.val() === auth.uid"
      }
    },
    "messages": {
      ".read": "auth != null",
      "$messageId": {
        ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid && root.child('usernames').child(newData.child('nameKey').val()).val() === auth.uid",
        ".validate": "newData.hasChildren(['uid', 'name', 'nameKey', 'text', 'createdAt'])",
        "uid": {
          ".validate": "newData.isString() && newData.val() === auth.uid"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 20 && newData.val().toLowerCase() === newData.parent().child('nameKey').val()"
        },
        "nameKey": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-z0-9_]{3,20}$/) && root.child('usernames').child(newData.val()).val() === auth.uid"
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

The web config is public by design; never put a service-account key in this site. These rules let each Firebase UID reserve a case-insensitive username once, require that reservation for every new message, and prevent editing or deleting existing messages. Each message stores its Firebase UID, which you can match to the UID in **Authentication > Users** when moderating. Anonymous UIDs only identify a browser's Firebase account; people can create a different anonymous account by clearing browser data or switching devices. For stronger accountability, require a verified Google or email sign-in instead of anonymous authentication. This is a public room, so messages and usernames are visible to every visitor. For a larger public audience, add abuse reporting and server-enforced rate limits before opening the room widely.