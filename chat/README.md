# Community chat setup

The chat is embedded in `games/index.html` and uses Firebase Authentication and Realtime Database, so it can share messages across Netlify and GitHub Pages. Each host must be listed as an authorized domain in Firebase Authentication.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/) and add a Web app.
2. In **Authentication > Sign-in method**, enable **Anonymous** and **Email/Password**.
3. In **Realtime Database**, create a database and copy its URL (for example, `https://your-project-default-rtdb.firebaseio.com`).
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId`, plus the database URL, into [`chat-config.js`](chat-config.js).
5. In **Authentication > Settings > Authorized domains**, add the Netlify hostname and the GitHub Pages hostname that will serve the site.
6. In **Realtime Database > Rules**, replace the rules with the following and click **Publish**. The username reservation, private profile, admin check, announcement, site controls, and message write rules must all be live in the same database used by `chat-config.js`:

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
    "profiles": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['name', 'nameKey'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 20 && newData.val().toLowerCase() === newData.parent().child('nameKey').val()"
        },
        "nameKey": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-z0-9_]{3,20}$/) && root.child('usernames').child(newData.val()).val() === auth.uid"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "admins": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": false,
        ".validate": "newData.isBoolean()"
      }
    },
    "announcement": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".validate": "newData.hasChildren(['uid', 'text', 'createdAt'])",
      "uid": {
        ".validate": "newData.isString() && newData.val() === auth.uid"
      },
      "text": {
        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 240"
      },
      "createdAt": {
        ".validate": "newData.isNumber() && newData.val() <= now && newData.val() > now - 60000"
      },
      "$other": {
        ".validate": false
      }
    },
    "siteControl": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "theme": {
        ".validate": "newData.isString() && newData.val().matches(/^(local|emerald|ocean|ember)$/)"
      },
      "accent": {
        ".validate": "newData.isString() && newData.val().matches(/^(theme|mint|blue|coral|gold|aqua)$/)"
      },
      "partyMode": {
        ".validate": "newData.isBoolean()"
      },
      "refreshToken": {
        ".validate": "newData.isString() && newData.val().matches(/^[0-9]+-[a-z0-9]+$/)"
      },
      "$other": {
        ".validate": false
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

7. Create or log into the account that should have admin access. In **Authentication > Users**, copy its UID. In **Realtime Database > Data**, add `admins/<uid>` with the Boolean value `true` (for example, `admins/abc123: true`). Only grant this to trusted accounts. The database rules prevent changes to admin access from the website; manage this allowlist in the Firebase console.

The admin control room can publish a site-wide theme and accent, toggle confetti, send or clear an announcement, and request a refresh. It can be opened while a game is running. Refresh requests reload visitors who already have the updated arcade code open; users with older code, closed tabs, or offline browsers cannot be remotely refreshed. A force refresh may interrupt a game.
The **Fun** tab also lets an admin launch a random game or trigger a one-off confetti burst in their current tab.

The web config is public by design; never put a service-account key in this site. These rules let each Firebase UID reserve a case-insensitive username once, require that reservation for every new message, and limit profile access to its owner. Each message stores its Firebase UID, which you can match to the UID in **Authentication > Users** when moderating.

Chat does not require an account: visitors can choose a name and send messages as guests. Creating an account while signed in as a guest links that guest UID to an email and password, keeping an already-claimed username attached to the account. Later, log in with the same email and password to restore the saved name. An older guest identity can only be linked from the browser where that guest session still exists. Admin announcements are sent to connected visitors and appear above the game iframe. Admins can also override visitor themes, accent colors, and confetti effects. This is a public room, so messages and usernames are visible to every visitor. For a larger public audience, add abuse reporting and server-enforced rate limits before opening the room widely.